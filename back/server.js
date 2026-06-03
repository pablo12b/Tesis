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
      SELECT DISTINCT institucion FROM narrativas_crudas 
      WHERE institucion IS NOT NULL AND institucion != ''
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
    // Narrativas por nivel de riesgo
    const riesgoQuery = `
      SELECT a.nivel_riesgo, COUNT(*)::int as cantidad
      FROM analisis_semantico a
      JOIN narrativas_procesadas np ON a.procesada_id = np.id
      JOIN narrativas_crudas nc ON np.cruda_id = nc.id
      WHERE nc.institucion = $1
      GROUP BY a.nivel_riesgo
      ORDER BY 
        CASE a.nivel_riesgo
          WHEN 'Crítico' THEN 1
          WHEN 'Alto' THEN 2
          WHEN 'Medio' THEN 3
          WHEN 'Bajo' THEN 4
          ELSE 5
        END
    `;
    
    // Narrativas por emoción principal
    const emocionQuery = `
      SELECT a.emocion_principal, COUNT(*)::int as cantidad
      FROM analisis_semantico a
      JOIN narrativas_procesadas np ON a.procesada_id = np.id
      JOIN narrativas_crudas nc ON np.cruda_id = nc.id
      WHERE nc.institucion = $1
      GROUP BY a.emocion_principal
      ORDER BY cantidad DESC
    `;
    
    // Narrativas por factor de estrés (normalizado y consolidado)
    const estresQuery = `
      SELECT 
        CASE 
          WHEN LOWER(TRIM(a.factor_estres)) LIKE LOWER('%académico%') OR LOWER(TRIM(a.factor_estres)) = LOWER('academico') THEN 'Académico'
          WHEN LOWER(TRIM(a.factor_estres)) = LOWER('economico') OR LOWER(TRIM(a.factor_estres)) = LOWER('económico') THEN 'Económico'
          WHEN LOWER(TRIM(a.factor_estres)) LIKE LOWER('%familiar%') THEN 'Familiar'
          WHEN LOWER(TRIM(a.factor_estres)) LIKE LOWER('%social%') THEN 'Social'
          ELSE 'Desconocido'
        END as factor_estres,
        COUNT(*)::int as cantidad
      FROM analisis_semantico a
      JOIN narrativas_procesadas np ON a.procesada_id = np.id
      JOIN narrativas_crudas nc ON np.cruda_id = nc.id
      WHERE nc.institucion = $1
      GROUP BY factor_estres
      ORDER BY cantidad DESC
    `;
    
    // Narrativas por fuente
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
    
    const [riesgo, emociones, estres, fuentes] = await Promise.all([
      pool.query(riesgoQuery, [institucion]),
      pool.query(emocionQuery, [institucion]),
      pool.query(estresQuery, [institucion]),
      pool.query(fuenteQuery, [institucion])
    ]);
    
    // Total de narrativas
    const totalQuery = `
      SELECT COUNT(*) as total FROM narrativas_crudas WHERE institucion = $1
    `;
    const totalResult = await pool.query(totalQuery, [institucion]);
    
    // Formatear respuesta
    const respuesta = {
      institucion,
      total: parseInt(totalResult.rows[0].total),
      riesgo: riesgo.rows.map(r => ({
        nivel_riesgo: r.nivel_riesgo,
        cantidad: parseInt(r.cantidad)
      })),
      emociones: emociones.rows.map(e => ({
        emocion_principal: e.emocion_principal,
        cantidad: parseInt(e.cantidad)
      })),
      estres: estres.rows.map(es => ({
        factor_estres: es.factor_estres,
        cantidad: parseInt(es.cantidad)
      })),
      fuentes: fuentes.rows.map(f => ({
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
});
