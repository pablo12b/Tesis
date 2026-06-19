import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '../.env' });

const app = express();
const { Pool } = pg;

// Middleware
app.use(cors());
app.use(express.json());

// Pool de conexiones
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

pool.on('error', (err) => {
  console.error('Error en el pool:', err);
});

// Rutas API
app.get('/api/universidades', async (req, res) => {
  try {
    const query = `
      SELECT institucion FROM estadisticas_universidad 
      ORDER BY institucion
    `;
    const result = await pool.query(query);
    res.json(result.rows.map(r => r.institucion));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/estadisticas/:institucion', async (req, res) => {
  const { institucion } = req.params;
  
  try {
    // 1. Obtener Estadísticas Generales
    const statsQuery = `
      SELECT total_publicaciones, total_comentarios, total_likes, total_views 
      FROM estadisticas_universidad 
      WHERE institucion = $1
    `;
    
    // 2. Obtener Narrativa Global y Porcentajes de IA
    const macroQuery = `
      SELECT narrativa_general, porcentajes_emociones, factores_riesgo 
      FROM narrativa_global_universidad 
      WHERE institucion = $1
    `;
    
    // 3. Mantener conteo de fuentes desde crudas
    const fuenteQuery = `
      SELECT 
        CASE nc.fuente_id
          WHEN 1 THEN 'TikTok'
          WHEN 2 THEN 'Instagram'
          WHEN 3 THEN 'Facebook'
          ELSE 'Desconocida'
        END as fuente, COUNT(*)::int as cantidad
      FROM narrativas_crudas nc
      WHERE nc.institucion = $1
      GROUP BY nc.fuente_id
      ORDER BY cantidad DESC
    `;
    
    const [statsRes, macroRes, fuentesRes] = await Promise.all([
      pool.query(statsQuery, [institucion]),
      pool.query(macroQuery, [institucion]),
      pool.query(fuenteQuery, [institucion])
    ]);
    
    // Si no hay datos, retornamos objeto vacío
    if (statsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    const stats = statsRes.rows[0];
    // Manejar el caso donde no haya macro-análisis (todavía generándose)
    const macro = macroRes.rows.length > 0 ? macroRes.rows[0] : {
      narrativa_general: "Análisis en proceso...",
      porcentajes_emociones: {},
      factores_riesgo: {}
    };

    // Formatear porcentajes de emociones de objeto a array
    const emocionesFormat = Object.keys(macro.porcentajes_emociones).map(key => ({
      emocion_principal: key,
      cantidad: macro.porcentajes_emociones[key]
    })).sort((a, b) => b.cantidad - a.cantidad);

    // Formatear factores de estrés de objeto a array
    const estresFormat = Object.keys(macro.factores_riesgo).map(key => ({
      factor_estres: key,
      cantidad: macro.factores_riesgo[key]
    })).sort((a, b) => b.cantidad - a.cantidad);

    // Formatear respuesta final
    const respuesta = {
      institucion,
      metricas: {
        publicaciones: parseInt(stats.total_publicaciones) || 0,
        comentarios: parseInt(stats.total_comentarios) || 0,
        likes: parseInt(stats.total_likes) || 0,
        views: parseInt(stats.total_views) || 0,
      },
      narrativa: macro.narrativa_general || "No disponible",
      emociones: emocionesFormat,
      estres: estresFormat,
      fuentes: fuentesRes.rows.map(f => ({
        fuente: f.fuente,
        cantidad: parseInt(f.cantidad)
      }))
    };
    
    res.json(respuesta);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Endpoint para ejecutar el pipeline de scraping
app.post('/api/scraper/run', async (req, res) => {
  const { institucion } = req.body;
  
  if (!institucion) {
    return res.status(400).json({ error: 'Falta la institución' });
  }
  
  console.log(`\n🚀 INICIANDO PIPELINE DE SCRAPING PARA: ${institucion} 🚀`);
  
  // Establecer encabezados para respuesta tipo Server-Sent Events (SSE) si quisiéramos streaming, 
  // pero para no complicar el MVP vamos a esperar a que termine (lo cual podría dar timeout en HTTP).
  // Como dura mucho, el enfoque más estable en HTTP corto plazo es responder OK y procesar en background
  // PERO como el usuario pidió estado "Cargando", responderemos cuando termine. Advertencia de timeout.
  
  try {
    const runPythonScript = (scriptPath, args) => {
      return new Promise((resolve, reject) => {
        // Ruta al ejecutable de Python en el entorno virtual
        const pythonExe = process.platform === 'win32' 
          ? path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe')
          : path.join(__dirname, '..', 'venv', 'bin', 'python');

        console.log(`Ejecutando: ${pythonExe} ${scriptPath} ${args.join(' ')}`);
        
        const pyProcess = spawn(pythonExe, [scriptPath, ...args]);
        
        pyProcess.stdout.on('data', (data) => {
          console.log(`[${path.basename(scriptPath)}] ${data.toString().trim()}`);
        });
        
        pyProcess.stderr.on('data', (data) => {
          console.error(`[${path.basename(scriptPath)} ERROR] ${data.toString().trim()}`);
        });
        
        pyProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`El script terminó con código ${code}`));
          }
        });
      });
    };

    const scraperDir = path.join(__dirname, '..', 'scraper');
    const procDir = path.join(__dirname, '..', 'procesamiento');

    // 0. Limpieza previa de datos antiguos (> 4 semanas)
    await runPythonScript(path.join(scraperDir, 'limpiar_narrativas_antiguas.py'), ['--institucion', institucion]);

    // 1. Scraping
    await runPythonScript(path.join(scraperDir, 'master_scraper.py'), ['--institucion', institucion]);
    
    // 2. Procesar (Limpieza y herencia)
    await runPythonScript(path.join(scraperDir, 'procesar_narrativas.py'), ['--institucion', institucion]);
    
    // 3. Análisis Semántico (Groq/Llama)
    await runPythonScript(path.join(procDir, 'analizar_narrativas.py'), ['--institucion', institucion]);
    
    // 4. Actualizar Estadísticas
    await runPythonScript(path.join(scraperDir, 'actualizar_estadisticas.py'), ['--institucion', institucion]);
    
    console.log(`\n✅ PIPELINE COMPLETADO PARA: ${institucion}`);
    res.json({ success: true, message: `Pipeline completado exitosamente para ${institucion}` });
    
  } catch (error) {
    console.error('Error en el pipeline:', error);
    res.status(500).json({ error: error.message || 'Error ejecutando el pipeline' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
});
