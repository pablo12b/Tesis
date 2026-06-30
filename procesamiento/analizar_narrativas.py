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
                narrativa_estres TEXT,
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
    
    Tu tarea es redactar dos narrativas:
    1. "narrativa_general": La NARRATIVA EMOCIONAL GENERAL DEFINITIVA (3 o 4 párrafos bien estructurados) que englobe todo lo mencionado.
    2. "narrativa_estres": Una explicación detallada de cómo las emociones predominantes están afectando los distintos factores de riesgo (Académico, Económico, Social, etc.) y de dónde provienen estas preocupaciones o factores de estrés en la comunidad estudiantil.

    Devuelve ÚNICAMENTE un JSON válido con ambas narrativas:
    {{
        "narrativa_general": "La redacción general aquí...",
        "narrativa_estres": "La explicación de los factores de estrés aquí..."
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
        data = json.loads(respuesta.choices[0].message.content.strip())
        return {
            "narrativa_general": data.get("narrativa_general", ""),
            "narrativa_estres": data.get("narrativa_estres", "")
        }
    except Exception as e:
        logger.error(f"Error en REDUCE: {str(e)}")
        return {
            "narrativa_general": "No se pudo generar la narrativa definitiva.",
            "narrativa_estres": "No se pudo generar la narrativa de estrés."
        }

def promediar_diccionarios(lista_diccionarios):
    if not lista_diccionarios: return {}
    resultado = {}
    claves = lista_diccionarios[0].keys()
    for k in claves:
        suma = sum(d.get(k, 0) for d in lista_diccionarios)
        resultado[k] = round(suma / len(lista_diccionarios), 1)
    return resultado

import argparse
import time

def clasificar_emociones_comentarios(institucion, cur, conn):
    logger.info(f"    -> [CLASIFICACIÓN INDIVIDUAL] Clasificando emociones para {institucion}...")
    cur.execute("""
        SELECT id, contenido_original FROM narrativas_crudas 
        WHERE institucion = %s AND (emocion_predominante = 'Sin clasificar' OR emocion_predominante IS NULL)
    """, (institucion,))
    comentarios = cur.fetchall()
    
    if not comentarios:
        logger.info(f"    -> No hay comentarios nuevos por clasificar para {institucion}.")
        return

    BATCH_SIZE = 40
    for i in range(0, len(comentarios), BATCH_SIZE):
        lote = comentarios[i:i+BATCH_SIZE]
        logger.info(f"       Clasificando lote {i//BATCH_SIZE + 1}/{(len(comentarios)-1)//BATCH_SIZE + 1} ({len(lote)} comentarios)...")
        
        texto_lote = "\n".join([f"ID: {c[0]} | TEXTO: {c[1]}" for c in lote])
        prompt = f"""
        Clasifica la emoción predominante de cada uno de los siguientes comentarios.
        Las opciones son estrictamente: Enojo, Tristeza, Alegría, Miedo, Ansiedad, Indiferencia.
        Devuelve ÚNICAMENTE un JSON con la estructura:
        {{
            "clasificaciones": [
                {{"id": 123, "emocion": "Enojo"}}
            ]
        }}
        
        COMENTARIOS:
        {texto_lote}
        """
        try:
            respuesta = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            res_json = json.loads(respuesta.choices[0].message.content.strip())
            clasificaciones = res_json.get("clasificaciones", [])
            
            for c in clasificaciones:
                cur.execute("UPDATE narrativas_crudas SET emocion_predominante = %s WHERE id = %s", (c.get("emocion", "Indiferencia"), c.get("id")))
            conn.commit()
            
            time.sleep(2) # Respetar rate limits
        except Exception as e:
            logger.error(f"Error clasificando lote: {e}")
            conn.rollback()

def ejecutar_map_reduce(institucion_arg="TODAS"):
    logger.info("="*60)
    logger.info(f"INICIANDO ANÁLISIS COMPLETO (MAP-REDUCE) - {institucion_arg}")
    logger.info("="*60)
    
    crear_tabla_global()
    conn = obtener_conexion()
    if not conn: return
    cur = conn.cursor()
    
    try:
        if institucion_arg != "TODAS":
            cur.execute("""
                SELECT nc.institucion, STRING_AGG(np.contenido_limpio, ' | ') as texto_agrupado
                FROM narrativas_procesadas np
                JOIN narrativas_crudas nc ON np.cruda_id = nc.id
                WHERE nc.institucion = %s AND nc.institucion IS NOT NULL AND nc.institucion != ''
                GROUP BY nc.institucion
            """, (institucion_arg,))
        else:
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
            
            # 1. CLASIFICACIÓN INDIVIDUAL DE COMENTARIOS NUEVOS
            clasificar_emociones_comentarios(institucion, cur, conn)
            
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
            narrativas = generar_narrativa_definitiva(institucion, texto_combinado)
            narrativa_final = narrativas.get("narrativa_general", "")
            narrativa_estres_final = narrativas.get("narrativa_estres", "")
            emociones_promedio = promediar_diccionarios(lista_emociones)
            factores_promedio = promediar_diccionarios(lista_factores)
            
            # GUARDAR EN BD
            cur.execute("""
                INSERT INTO narrativa_global_universidad 
                (institucion, narrativa_general, narrativa_estres, porcentajes_emociones, factores_riesgo, fecha_analisis)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (institucion) 
                DO UPDATE SET 
                    narrativa_general = EXCLUDED.narrativa_general,
                    narrativa_estres = EXCLUDED.narrativa_estres,
                    porcentajes_emociones = EXCLUDED.porcentajes_emociones,
                    factores_riesgo = EXCLUDED.factores_riesgo,
                    fecha_analisis = EXCLUDED.fecha_analisis
            """, (
                institucion, 
                narrativa_final,
                narrativa_estres_final,
                json.dumps(emociones_promedio),
                json.dumps(factores_promedio)
            ))
            
            # GUARDAR EN HISTORIAL DIARIO (COPIA ESTÁTICA)
            cur.execute("""
                INSERT INTO historial_narrativas_diarias 
                (institucion, fecha, narrativa_general, narrativa_estres, porcentajes_emociones, factores_riesgo)
                VALUES (%s, CURRENT_DATE, %s, %s, %s, %s)
                ON CONFLICT (institucion, fecha) DO UPDATE SET 
                    narrativa_general = EXCLUDED.narrativa_general,
                    narrativa_estres = EXCLUDED.narrativa_estres,
                    porcentajes_emociones = EXCLUDED.porcentajes_emociones,
                    factores_riesgo = EXCLUDED.factores_riesgo
            """, (
                institucion,
                narrativa_final,
                narrativa_estres_final,
                json.dumps(emociones_promedio),
                json.dumps(factores_promedio)
            ))
            
            # GUARDAR EN HISTORIAL DE EMOCIONES
            cur.execute("""
                INSERT INTO historial_emociones_ia (institucion, fecha, emociones) 
                VALUES (%s, CURRENT_DATE, %s)
                ON CONFLICT (institucion, fecha) DO UPDATE SET emociones = EXCLUDED.emociones
            """, (institucion, json.dumps(emociones_promedio)))

            conn.commit()
            logger.info(f"[ÉXITO] Análisis Map-Reduce guardado para {institucion}")
            
            # Pausa final antes de pasar a la siguiente universidad
            time.sleep(62)
            
        # == NUEVO: GENERAR NARRATIVA GLOBAL ==
        if institucion_arg == "TODAS":
            logger.info("="*60)
            logger.info("GENERANDO NARRATIVA GLOBAL META-ANALÍTICA")
            
            cur.execute("SELECT institucion, narrativa_general, porcentajes_emociones, factores_riesgo FROM narrativa_global_universidad WHERE institucion != 'GLOBAL'")
            rows = cur.fetchall()
            
            if rows:
                textos_individuales = []
                lista_emociones_global = []
                lista_factores_global = []
                
                for r in rows:
                    inst, narr, emo_json, fact_json = r
                    textos_individuales.append(f"--- {inst} ---\n{narr}\n")
                    if emo_json: lista_emociones_global.append(emo_json)
                    if fact_json: lista_factores_global.append(fact_json)
                
                texto_combinado = "\n".join(textos_individuales)
                
                prompt_global = f"""
                A continuación tienes los resúmenes narrativos individuales de varias universidades analizadas.
                
                RESÚMENES POR UNIVERSIDAD:
                \"\"\"
                {texto_combinado}
                \"\"\"
                
                Tu tarea es redactar una NARRATIVA EMOCIONAL GLOBAL (3 o 4 párrafos bien estructurados) que englobe la situación conjunta de la comunidad universitaria, comparando brevemente y destacando los patrones comunes de bienestar o estrés en todas las instituciones analizadas.
                Devuelve ÚNICAMENTE un JSON válido:
                {{
                    "narrativa_general": "La narrativa global comparativa aquí."
                }}
                """
                
                try:
                    logger.info("Esperando 62 segundos antes de generar la global...")
                    time.sleep(62)
                    
                    respuesta = client.chat.completions.create(
                        model="llama-3.1-8b-instant",
                        messages=[{"role": "user", "content": prompt_global}],
                        temperature=0.3,
                        max_tokens=1500,
                        response_format={"type": "json_object"}
                    )
                    narrativa_final_global = json.loads(respuesta.choices[0].message.content.strip()).get("narrativa_general", "")
                    
                    emociones_promedio_global = promediar_diccionarios(lista_emociones_global)
                    factores_promedio_global = promediar_diccionarios(lista_factores_global)
                    
                    cur.execute("""
                        INSERT INTO narrativa_global_universidad 
                        (institucion, narrativa_general, porcentajes_emociones, factores_riesgo, fecha_analisis)
                        VALUES (%s, %s, %s, %s, NOW())
                        ON CONFLICT (institucion) 
                        DO UPDATE SET 
                            narrativa_general = EXCLUDED.narrativa_general,
                            porcentajes_emociones = EXCLUDED.porcentajes_emociones,
                            factores_riesgo = EXCLUDED.factores_riesgo,
                            fecha_analisis = EXCLUDED.fecha_analisis
                    """, (
                        "GLOBAL", 
                        narrativa_final_global,
                        json.dumps(emociones_promedio_global),
                        json.dumps(factores_promedio_global)
                    ))

                    # GUARDAR EN HISTORIAL DE EMOCIONES GLOBAL
                    cur.execute("""
                        INSERT INTO historial_emociones_ia (institucion, fecha, emociones) 
                        VALUES (%s, CURRENT_DATE, %s)
                        ON CONFLICT (institucion, fecha) DO UPDATE SET emociones = EXCLUDED.emociones
                    """, ("GLOBAL", json.dumps(emociones_promedio_global)))
                    
                    conn.commit()
                    logger.info("[ÉXITO] Narrativa GLOBAL generada y guardada.")
                except Exception as e:
                    logger.error(f"Error generando global: {str(e)}")

        cur.close()
        conn.close()
        logger.info("\n[FINALIZADO] Análisis 100% completado.")
        
    except Exception as e:
        logger.error(f"Error crítico: {str(e)}", exc_info=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analizar narrativas")
    parser.add_argument("--institucion", type=str, default="TODAS", help="Institución a procesar")
    args = parser.parse_args()
    ejecutar_map_reduce(args.institucion)