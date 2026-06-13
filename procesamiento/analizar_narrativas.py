import os
import json
import psycopg2
import logging
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime
import time

# ========== CONFIGURACIÓN ==========
load_dotenv()

log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, f"map_reduce_analisis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ========== FUNCIONES ==========
def obtener_conexion():
    try:
        return psycopg2.connect(
            user=os.getenv('DB_USER'), 
            password=os.getenv('DB_PASSWORD'),
            host=os.getenv('DB_HOST'), 
            port=os.getenv('DB_PORT'), 
            database=os.getenv('DB_NAME')
        )
    except Exception as e:
        logger.error(f"Error conectando a BD: {str(e)}")
        return None

def crear_tabla_global():
    conn = obtener_conexion()
    if not conn: return False
    
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS narrativa_global_universidad (
                id SERIAL PRIMARY KEY,
                institucion VARCHAR(100) UNIQUE NOT NULL,
                narrativa_general TEXT,
                porcentajes_emociones JSONB,
                factores_riesgo JSONB,
                fecha_analisis TIMESTAMP DEFAULT NOW()
            );
        """)
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Error creando tabla: {str(e)}")
        return False

def generar_analisis_parcial(institucion, chunk_texto, chunk_index, total_chunks):
    """Fase MAP: Analiza un fragmento del texto total"""
    logger.info(f"    -> [MAP] Analizando Paquete {chunk_index}/{total_chunks} de {institucion}...")
    prompt_map = f"""
    Eres un psicólogo analizando un FRAGMENTO ({chunk_index}/{total_chunks}) de comentarios de estudiantes de {institucion}.
    
    TEXTO:
    \"\"\"
    {chunk_texto}
    \"\"\"
    
    Devuelve ÚNICAMENTE un JSON válido:
    {{
        "resumen_parcial": "Resumen de 1 párrafo de los problemas o sentimientos en ESTE fragmento.",
        "porcentajes_emociones": {{"Enojo": 0, "Tristeza": 0, "Alegría": 0, "Miedo": 0, "Ansiedad": 0, "Indiferencia": 0}},
        "factores_riesgo": {{"Académico": 0, "Económico": 0, "Social": 0, "Infraestructura": 0, "Atención al Estudiante": 0}}
    }}
    """
    
    try:
        respuesta = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt_map}],
            temperature=0.2,
            max_tokens=800,
            response_format={"type": "json_object"}
        )
        return json.loads(respuesta.choices[0].message.content.strip())
    except Exception as e:
        logger.error(f"Error en MAP: {str(e)}")
        return None

def generar_narrativa_definitiva(institucion, resumenes_combinados):
    """Fase REDUCE: Genera la narrativa final uniendo los resúmenes parciales"""
    logger.info(f"    -> [REDUCE] Generando Narrativa Definitiva para {institucion}...")
    prompt_reduce = f"""
    A continuación tienes los resúmenes parciales de TODO el texto de los estudiantes de {institucion}.
    
    RESÚMENES PARCIALES:
    \"\"\"
    {resumenes_combinados}
    \"\"\"
    
    Tu tarea es redactar la NARRATIVA EMOCIONAL GENERAL DEFINITIVA (3 o 4 párrafos bien estructurados) que englobe todo lo mencionado arriba.
    Devuelve ÚNICAMENTE un JSON válido:
    {{
        "narrativa_general": "La redacción final aquí."
    }}
    """
    
    try:
        respuesta = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt_reduce}],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        return json.loads(respuesta.choices[0].message.content.strip()).get("narrativa_general", "")
    except Exception as e:
        logger.error(f"Error en REDUCE: {str(e)}")
        return "No se pudo generar la narrativa definitiva."

def promediar_diccionarios(lista_diccionarios):
    if not lista_diccionarios: return {}
    resultado = {}
    claves = lista_diccionarios[0].keys()
    for k in claves:
        suma = sum(d.get(k, 0) for d in lista_diccionarios)
        resultado[k] = round(suma / len(lista_diccionarios), 1)
    return resultado

def ejecutar_map_reduce():
    logger.info("="*60)
    logger.info("INICIANDO ANÁLISIS 100% COMPLETO (MAP-REDUCE)")
    logger.info("="*60)
    
    crear_tabla_global()
    conn = obtener_conexion()
    if not conn: return
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT nc.institucion, STRING_AGG(np.contenido_limpio, ' | ') as texto_agrupado
            FROM narrativas_procesadas np
            JOIN narrativas_crudas nc ON np.cruda_id = nc.id
            WHERE nc.institucion IS NOT NULL AND nc.institucion != ''
            GROUP BY nc.institucion
        """)
        instituciones = cur.fetchall()
        
        for institucion, texto_agrupado in instituciones:
            logger.info(f"\n[UNIVERSIDAD] {institucion}")
            
            # Dividir en fragmentos de 9000 caracteres
            TAMANO_CHUNK = 9000
            chunks = [texto_agrupado[i:i+TAMANO_CHUNK] for i in range(0, len(texto_agrupado), TAMANO_CHUNK)]
            total_chunks = len(chunks)
            logger.info(f"Texto total: {len(texto_agrupado)} chars. Dividido en {total_chunks} paquetes.")
            
            resumenes_parciales = []
            lista_emociones = []
            lista_factores = []
            
            # FASE MAP
            for i, chunk in enumerate(chunks):
                resultado_map = generar_analisis_parcial(institucion, chunk, i+1, total_chunks)
                if resultado_map:
                    resumenes_parciales.append(resultado_map.get("resumen_parcial", ""))
                    lista_emociones.append(resultado_map.get("porcentajes_emociones", {}))
                    lista_factores.append(resultado_map.get("factores_riesgo", {}))
                
                # Respetar rate limits de Groq
                logger.info("Esperando 62 segundos para evitar baneos de la API...")
                time.sleep(62)
            
            # FASE REDUCE
            texto_combinado = "\n".join(resumenes_parciales)
            narrativa_final = generar_narrativa_definitiva(institucion, texto_combinado)
            emociones_promedio = promediar_diccionarios(lista_emociones)
            factores_promedio = promediar_diccionarios(lista_factores)
            
            # GUARDAR EN BD
            cur.execute("""
                INSERT INTO narrativa_global_universidad 
                (institucion, narrativa_general, porcentajes_emociones, factores_riesgo, fecha_analisis)
                VALUES (%s, %s, %s, %s, NOW())
                ON CONFLICT (institucion) 
                DO UPDATE SET 
                    narrativa_general = EXCLUDED.narrativa_general,
                    porcentajes_emociones = EXCLUDED.porcentajes_emociones,
                    factores_riesgo = EXCLUDED.factores_riesgo,
                    fecha_analisis = NOW()
            """, (
                institucion, 
                narrativa_final,
                json.dumps(emociones_promedio),
                json.dumps(factores_promedio)
            ))
            conn.commit()
            logger.info(f"[ÉXITO] Análisis Map-Reduce guardado para {institucion}")
            
            # Pausa final antes de pasar a la siguiente universidad
            time.sleep(62)
            
        cur.close()
        conn.close()
        logger.info("\n[FINALIZADO] Análisis 100% de todas las universidades completado.")
        
    except Exception as e:
        logger.error(f"Error crítico: {str(e)}", exc_info=True)

if __name__ == "__main__":
    ejecutar_map_reduce()