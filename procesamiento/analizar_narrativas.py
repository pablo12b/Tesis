import os
import json
import psycopg2
import logging
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime

# ========== CONFIGURACIÓN ==========
# Cargar .env desde raíz Tesis/
load_dotenv()

# Logging con UTF-8 para Windows (sin reconfigure)
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, f"sprint2_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

# Configurar logging de forma simple y compatible
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configurar Groq
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ========== FUNCIONES ==========
def obtener_conexion():
    """Conexión centralizada a BD"""
    try:
        conn = psycopg2.connect(
            user=os.getenv('DB_USER'), 
            password=os.getenv('DB_PASSWORD'),
            host=os.getenv('DB_HOST'), 
            port=os.getenv('DB_PORT'), 
            database=os.getenv('DB_NAME')
        )
        return conn
    except Exception as e:
        logger.error(f"Error conectando a BD: {str(e)}")
        return None

def crear_tablas_sprint2():
    """Crea tablas necesarias para Sprint 2"""
    conn = obtener_conexion()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        logger.info("Creando tablas de Sprint 2...")
        
        # Eliminar tabla anterior si existe
        cur.execute("DROP TABLE IF EXISTS analisis_semantico CASCADE")
        
        # Tabla de análisis semántico corregida
        cur.execute("""
            CREATE TABLE analisis_semantico (
                id SERIAL PRIMARY KEY,
                procesada_id INT NOT NULL UNIQUE,
                usuario_anonimo VARCHAR(64),
                nivel_riesgo VARCHAR(50),
                emocion_principal VARCHAR(100),
                factor_estres VARCHAR(100),
                historia_inferida TEXT,
                confianza_ia FLOAT DEFAULT 0.5,
                timestamp_analisis TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (procesada_id) REFERENCES narrativas_procesadas(id)
            );
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        logger.info("Tablas creadas exitosamente con el esquema corregido")
        return True
    except Exception as e:
        logger.error(f"Error creando tablas: {str(e)}")
        return False

def analizar_narrativa_con_groq(texto_original):
    """Analiza texto con Groq + Llama 3 (GRATIS)"""
    prompt_maestro = f"""
    Eres un psicólogo y analista de datos experto en bienestar estudiantil universitario en Cuenca, Ecuador.
    Analiza la siguiente narrativa de un estudiante anónimo. Ten en cuenta la jerga local (ej. 'supletorios', 'jalar', 'fregado').
    
    Narrativa: "{texto_original}"
    
    Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura (sin texto adicional ni bloques de código markdown):
    {{
        "nivel_riesgo": "Bajo, Medio, Alto, o Critico",
        "emocion_principal": "La emocion predominante (ej. Frustracion, Ansiedad)",
        "factor_estres": "Academico, Economico, Familiar, Social o Desconocido",
        "historia_inferida": "Una breve inferencia (max 3 lineas) de lo que podria estar viviendo el estudiante."
    }}
    """
    try:
        respuesta = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt_maestro}],
            temperature=0.3,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        texto_json = respuesta.choices[0].message.content.strip()
        resultado = json.loads(texto_json)
        
        logger.info(f"[OK] Análisis Groq/Llama3: {resultado.get('nivel_riesgo')} | {resultado.get('emocion_principal')}")
        return resultado
    except Exception as e:
        logger.error(f"[ERROR] Error con Groq/Llama3: {str(e)}")
        return None

def ejecutar_sprint_2():
    """Procesa narrativas procesadas con IA"""
    logger.info("="*60)
    logger.info("[IA] INICIANDO SPRINT 2 - PROCESAMIENTO SEMANTICO")
    logger.info("="*60)
    
    # Crear tablas si no existen / Recrear esquema limpio
    crear_tablas_sprint2()
    
    conn = obtener_conexion()
    if not conn:
        logger.error("[ERROR] No se pudo conectar a BD")
        return
    
    cur = conn.cursor()
    
    try:
        #Trae datos limpios y el ID sin NULLs de narrativas_procesadas
        cur.execute("""
            SELECT np.id, np.contenido_limpio, np.estudiante_id_anonimo, nc.confianza_relevancia
            FROM narrativas_procesadas np
            JOIN narrativas_crudas nc ON np.cruda_id = nc.id
            LEFT JOIN analisis_semantico ast ON np.id = ast.procesada_id
            WHERE ast.procesada_id IS NULL
        """)
        
        pendientes = cur.fetchall()
        
        if not pendientes:
            logger.info("[OK] No hay narrativas pendientes de análisis")
            cur.close()
            conn.close()
            return
        
        logger.info(f"[INFO] Encontradas {len(pendientes)} narrativas pendientes")
        
        for procesada_id, texto, usuario, confianza in pendientes:
            logger.info(f"[PROCESO] Procesando narrativa procesada ID {procesada_id}...")
            logger.info(f"[TEXTO] {texto[:60]}...")
            
            resultado_ia = analizar_narrativa_con_groq(texto)
            
            if resultado_ia:
                # Guardar en BD apuntando a la tabla correcta
                cur.execute("""
                    INSERT INTO analisis_semantico 
                    (procesada_id, usuario_anonimo, nivel_riesgo, emocion_principal, factor_estres, historia_inferida, confianza_ia)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    procesada_id, 
                    usuario,
                    resultado_ia.get('nivel_riesgo'),
                    resultado_ia.get('emocion_principal'),
                    resultado_ia.get('factor_estres'),
                    resultado_ia.get('historia_inferida'),
                    confianza
                ))
                conn.commit()
                logger.info(f"[GUARDADO] Análisis guardado con éxito")
            else:
                logger.warning(f"[ADVERTENCIA] Falló análisis IA para narrativa {procesada_id}")
        
        cur.close()
        conn.close()
        logger.info("[FINALIZADO] Sprint 2 completado exitosamente")
        
    except Exception as e:
        logger.error(f"[ERROR CRITICO] Error en Sprint 2: {str(e)}", exc_info=True)

if __name__ == "__main__":
    ejecutar_sprint_2()