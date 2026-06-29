import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '../.env' });

const app = express();
const { Pool } = pg;

// Middleware
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'tesis-bienestar-secret-key';

// Middleware de Autenticación
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Token faltante.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

// Viejo Login removido, movido abajo del pool

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

// Login Endpoint (Base de Datos)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const token = jwt.sign({ id: user.id, role: user.rol, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Registro de Usuario
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan campos obligatorios' });
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    await pool.query('INSERT INTO usuarios (username, password_hash, rol) VALUES ($1, $2, $3)', [username, hash, 'usuario']);
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    return res.status(500).json({ error: 'Error al registrar' });
  }
});

// Listar Usuarios (Solo Admin)
app.get('/api/usuarios', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Permisos insuficientes' });
  try {
    const users = await pool.query('SELECT id, username, rol, created_at FROM usuarios ORDER BY id ASC');
    return res.json(users.rows);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Cambiar Rol de Usuario (Solo Admin)
app.put('/api/usuarios/:id/rol', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Permisos insuficientes' });
  const { id } = req.params;
  const { rol } = req.body;
  if (rol !== 'admin' && rol !== 'usuario') return res.status(400).json({ error: 'Rol inválido' });
  try {
    await pool.query('UPDATE usuarios SET rol = $1 WHERE id = $2', [rol, id]);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el rol' });
  }
});
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
      SELECT narrativa_general, porcentajes_emociones, factores_riesgo, ejemplos_emociones 
      FROM narrativa_global_universidad 
      WHERE institucion = $1
    `;
    
    // 3. Obtener Historial de Fuentes desde crudas
    const fuenteQuery = `
      SELECT 
        TO_CHAR(nc.fecha_captura, 'YYYY-MM-DD') as fecha,
        CASE nc.fuente_id
          WHEN 1 THEN 'TikTok'
          WHEN 2 THEN 'Instagram'
          WHEN 3 THEN 'Facebook'
          ELSE 'Desconocida'
        END as fuente,
        COUNT(*)::int as cantidad
      FROM narrativas_crudas nc
      WHERE nc.institucion = $1
      GROUP BY TO_CHAR(nc.fecha_captura, 'YYYY-MM-DD'), nc.fuente_id
      ORDER BY fecha ASC
    `;
    
    // 4. Historial diario de emociones desde la IA
    const historicoQuery = `
      SELECT 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
        emociones
      FROM historial_emociones_ia
      WHERE institucion = $1
      ORDER BY fecha ASC
      LIMIT 30
    `;
    
    const [statsRes, macroRes, fuentesRes, historicoRes] = await Promise.all([
      pool.query(statsQuery, [institucion]),
      pool.query(macroQuery, [institucion]),
      pool.query(fuenteQuery, [institucion]),
      pool.query(historicoQuery, [institucion])
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
      factores_riesgo: {},
      ejemplos_emociones: {}
    };

    // Formatear porcentajes de emociones de objeto a array
    const ejemplos = macro.ejemplos_emociones || {};
    const emocionesFormat = Object.keys(macro.porcentajes_emociones).map(key => ({
      emocion_principal: key,
      cantidad: macro.porcentajes_emociones[key],
      ejemplo: ejemplos[key] || "Sin ejemplo disponible."
    })).sort((a, b) => b.cantidad - a.cantidad);

    // Formatear factores de estrés de objeto a array
    const estresFormat = Object.keys(macro.factores_riesgo).map(key => ({
      factor_estres: key,
      cantidad: macro.factores_riesgo[key]
    })).sort((a, b) => b.cantidad - a.cantidad);

    // Formatear fuentes histórico
    const fuentesFormat = Object.values(fuentesRes.rows.reduce((acc, curr) => {
      if (!acc[curr.fecha]) acc[curr.fecha] = { fecha: curr.fecha, TikTok: 0, Instagram: 0, Facebook: 0 };
      acc[curr.fecha][curr.fuente] = parseInt(curr.cantidad) || 0;
      return acc;
    }, {})).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Formatear histórico de emociones
    const historicoFormat = historicoRes.rows.map(row => {
      const em = row.emociones || {};
      return {
        fecha: row.fecha,
        Enojo: em.Enojo || 0,
        Tristeza: em.Tristeza || 0,
        Miedo: em.Miedo || 0,
        Ansiedad: em.Ansiedad || 0,
        Alegría: em.Alegría || 0,
        Indiferencia: em.Indiferencia || 0
      };
    });

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
      fuentes: fuentesFormat,
      historico: historicoFormat
    };
    
    res.json(respuesta);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/global-narrativa', async (req, res) => {
  try {
    const macroQuery = `SELECT narrativa_general, porcentajes_emociones, factores_riesgo, ejemplos_emociones FROM narrativa_global_universidad WHERE institucion = 'GLOBAL'`;
    const macroRes = await pool.query(macroQuery);
    if (macroRes.rows.length > 0) {
      const macro = macroRes.rows[0];
      const ejemplos = macro.ejemplos_emociones || {};
      const emocionesFormat = Object.entries(macro.porcentajes_emociones || {}).map(([emocion, cantidad]) => ({
        emocion_principal: emocion,
        cantidad: Number(cantidad),
        ejemplo: ejemplos[emocion] || "Sin ejemplo disponible."
      }));
      const estresFormat = Object.entries(macro.factores_riesgo || {}).map(([factor, cantidad]) => ({
        factor_estres: factor,
        cantidad: Number(cantidad)
      }));
      res.json({
        narrativa_general: macro.narrativa_general,
        porcentajes_emociones: emocionesFormat,
        factores_riesgo: estresFormat
      });
    } else {
      res.json({ narrativa_general: "Análisis en proceso...", porcentajes_emociones: [], factores_riesgo: [] });
    }
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

// Endpoint para ejecutar el pipeline de scraping (Protegido por authMiddleware)
app.post('/api/scraper/run', authMiddleware, async (req, res) => {
  const { institucion } = req.body;
  
  if (!institucion) {
    return res.status(400).json({ error: 'Falta la institución' });
  }
  
  // Establecer encabezados para Streaming
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  const sendLog = (msg) => {
    res.write(msg + '\n');
    console.log(msg);
  };

  sendLog(`\n🚀 INICIANDO PIPELINE DE SCRAPING PARA: ${institucion} 🚀`);
  
  try {
    const runPythonScript = (scriptPath, args) => {
      return new Promise((resolve, reject) => {
        let pythonExe = 'python3';
        if (process.env.NODE_ENV !== 'production') {
          pythonExe = process.platform === 'win32' 
            ? path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe')
            : path.join(__dirname, '..', 'venv', 'bin', 'python');
        }

        sendLog(`Ejecutando: ${pythonExe} ${path.basename(scriptPath)}`);
        
        const pyProcess = spawn(pythonExe, [scriptPath, ...args]);
        
        pyProcess.stdout.on('data', (data) => {
          const lines = data.toString().trim().split('\n');
          lines.forEach(line => {
            if(line) sendLog(`[${path.basename(scriptPath)}] ${line.trim()}`);
          });
        });
        
        pyProcess.stderr.on('data', (data) => {
          const lines = data.toString().trim().split('\n');
          lines.forEach(line => {
            if(line) sendLog(`[${path.basename(scriptPath)} ERROR] ${line.trim()}`);
          });
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
    sendLog('\n--- Paso 0: Limpieza Previa ---');
    await runPythonScript(path.join(scraperDir, 'limpiar_narrativas_antiguas.py'), ['--institucion', institucion]);

    // 1. Scraping
    sendLog('\n--- Paso 1: Scraping ---');
    await runPythonScript(path.join(scraperDir, 'master_scraper.py'), ['--institucion', institucion]);
    
    // 2. Procesar (Limpieza y herencia)
    sendLog('\n--- Paso 2: Procesamiento ---');
    await runPythonScript(path.join(scraperDir, 'procesar_narrativas.py'), ['--institucion', institucion]);
    
    // 3. Análisis Semántico (Groq/Llama)
    sendLog('\n--- Paso 3: Análisis Semántico ---');
    await runPythonScript(path.join(procDir, 'analizar_narrativas.py'), ['--institucion', institucion]);
    
    // 4. Actualizar Estadísticas
    sendLog('\n--- Paso 4: Estadísticas ---');
    await runPythonScript(path.join(scraperDir, 'actualizar_estadisticas.py'), ['--institucion', institucion]);
    
    sendLog(`\n✅ PIPELINE COMPLETADO PARA: ${institucion}`);
    res.write('__SUCCESS__\n');
    res.end();
    
  } catch (error) {
    sendLog(`\n❌ Error en el pipeline: ${error.message}`);
    res.write(`__ERROR__${error.message}\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
});
