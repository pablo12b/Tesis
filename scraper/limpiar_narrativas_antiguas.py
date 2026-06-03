import psycopg2
import os
import logging
from dotenv import load_dotenv
from datetime import datetime, timedelta

# ========== CONFIGURACIÓN ==========
load_dotenv()

# Logging
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, f"limpieza_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

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


def limpiar_narrativas_antiguas(semanas=4):
    """
    Elimina narrativas crudas cuya fecha_publicacion sea > semanas atrás
    Cascada de eliminación:
    - narrativas_crudas (id) → narrativas_procesadas (cruda_id)
    - narrativas_procesadas (id) → analisis_semantico (procesada_id)
    - narrativas_crudas (id) → deduplicacion_cache (buscando por hash)
    """
    logger.info("="*70)
    logger.info(f"[LIMPIEZA] Iniciando eliminación de narrativas > {semanas} semanas")
    logger.info("="*70)
    
    conn = obtener_conexion()
    if not conn:
        logger.error("[ERROR] No se pudo conectar a BD")
        return
    
    try:
        cur = conn.cursor()
        
        # Calcular fecha límite
        fecha_limite = datetime.now() - timedelta(weeks=semanas)
        logger.info(f"[FECHA LÍMITE] {fecha_limite.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 1. Buscar narrativas antiguas (ignorar fechas inválidas/desconocidas)
        # Solo busca fechas que se puedan convertir a DATE
        cur.execute("""
            SELECT id, contenido_original, fecha_publicacion, institucion
            FROM narrativas_crudas
            WHERE fecha_publicacion != 'Desconocida' 
            AND fecha_publicacion IS NOT NULL
            AND fecha_publicacion != ''
            AND CAST(fecha_publicacion AS DATE) < %s
            ORDER BY fecha_publicacion ASC
        """, (fecha_limite.date(),))
        
        narrativas_antiguas = cur.fetchall()
        
        if not narrativas_antiguas:
            logger.info("[OK] No hay narrativas antiguas para eliminar")
            cur.close()
            conn.close()
            return
        
        logger.info(f"[INFO] Encontradas {len(narrativas_antiguas)} narrativas antiguas")
        
        # 2. Eliminar en cascada
        eliminadas = 0
        errores = 0
        
        for cruda_id, contenido, fecha_pub, institucion in narrativas_antiguas:
            try:
                # Primero eliminar de analisis_semantico (que depende de narrativas_procesadas)
                cur.execute("""
                    DELETE FROM analisis_semantico
                    WHERE procesada_id IN (
                        SELECT id FROM narrativas_procesadas WHERE cruda_id = %s
                    )
                """, (cruda_id,))
                analisis_eliminados = cur.rowcount
                
                # Luego eliminar de narrativas_procesadas
                cur.execute("DELETE FROM narrativas_procesadas WHERE cruda_id = %s", (cruda_id,))
                procesadas_eliminadas = cur.rowcount
                
                # Finalmente eliminar de narrativas_crudas
                cur.execute("DELETE FROM narrativas_crudas WHERE id = %s", (cruda_id,))
                crudas_eliminadas = cur.rowcount
                
                conn.commit()
                eliminadas += 1
                
                logger.info(f"[ELIMINADA] ID {cruda_id} ({institucion}) - "
                           f"Fecha: {fecha_pub} - "
                           f"Análisis: {analisis_eliminados}, Procesadas: {procesadas_eliminadas}")
                
            except Exception as e:
                logger.error(f"[ERROR] Eliminando ID {cruda_id}: {str(e)}")
                conn.rollback()
                errores += 1
                continue
        
        # 3. Resumen
        logger.info("="*70)
        logger.info(f"[RESULTADO] {eliminadas} narrativas eliminadas exitosamente")
        logger.info(f"[RESULTADO] {errores} errores durante la limpieza")
        logger.info("="*70)
        
        cur.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"[ERROR CRÍTICO] {str(e)}")
        conn.rollback()
        conn.close()


if __name__ == "__main__":
    limpiar_narrativas_antiguas(semanas=4)
    logger.info("\n[FINALIZADO] Limpieza completada\n")
