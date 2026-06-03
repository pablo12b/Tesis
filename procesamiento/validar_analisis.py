import os
import psycopg2
import logging
from dotenv import load_dotenv
from datetime import datetime, timedelta

# ========== CONFIGURACIÓN ==========
load_dotenv()

# Logging
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, f"validacion_analisis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

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
        logger.error(f"[ERROR] Error conectando a BD: {str(e)}")
        return None

def mostrar_estadisticas():
    """Muestra estadísticas del análisis semántico"""
    conn = obtener_conexion()
    if not conn:
        return
    
    cur = conn.cursor()
    
    try:
        logger.info("="*60)
        logger.info("ESTADISTICAS DEL ANALISIS SEMANTICO - SPRINT 2")
        logger.info("="*60)
        
        # Total de análisis
        cur.execute("SELECT COUNT(*) FROM analisis_semantico")
        total = cur.fetchone()[0]
        logger.info(f"\n[TOTAL] Análisis registrados: {total}")
        
        # Distribución por nivel de riesgo
        logger.info(f"\n[DISTRIBUCION NIVEL DE RIESGO]")
        cur.execute("""
            SELECT nivel_riesgo, COUNT(*) as cantidad
            FROM analisis_semantico
            GROUP BY nivel_riesgo
            ORDER BY cantidad DESC
        """)
        for riesgo, cantidad in cur.fetchall():
            porcentaje = (cantidad / total * 100) if total > 0 else 0
            logger.info(f"  {riesgo}: {cantidad} ({porcentaje:.1f}%)")
        
        # Emociones más frecuentes
        logger.info(f"\n[EMOCIONES DETECTADAS]")
        cur.execute("""
            SELECT emocion_principal, COUNT(*) as cantidad
            FROM analisis_semantico
            GROUP BY emocion_principal
            ORDER BY cantidad DESC
            LIMIT 10
        """)
        for emocion, cantidad in cur.fetchall():
            logger.info(f"  {emocion}: {cantidad}")
        
        # Factores de estrés más frecuentes
        logger.info(f"\n[FACTORES DE ESTRES]")
        cur.execute("""
            SELECT factor_estres, COUNT(*) as cantidad
            FROM analisis_semantico
            GROUP BY factor_estres
            ORDER BY cantidad DESC
        """)
        for factor, cantidad in cur.fetchall():
            logger.info(f"  {factor}: {cantidad}")
        
        # Confianza promedio
        cur.execute("SELECT AVG(confianza_ia) FROM analisis_semantico")
        confianza_promedio = cur.fetchone()[0]
        logger.info(f"\n[CONFIANZA PROMEDIO] {confianza_promedio:.2f}")
        
        # Últimos análisis
        logger.info(f"\n[ULTIMOS 5 ANALISIS]")
        cur.execute("""
            SELECT id, procesada_id, usuario_anonimo, nivel_riesgo, emocion_principal, 
                   factor_estres, timestamp_analisis
            FROM analisis_semantico
            ORDER BY timestamp_analisis DESC
            LIMIT 5
        """)
        
        for record in cur.fetchall():
            aid, pid, user, riesgo, emocion, factor, timestamp = record
            logger.info(f"\n  ID: {aid} | Procesada: {pid}")
            logger.info(f"  Usuario: {user}")
            logger.info(f"  Riesgo: {riesgo} | Emoción: {emocion} | Factor: {factor}")
            logger.info(f"  Timestamp: {timestamp}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"[ERROR] Error mostrando estadísticas: {str(e)}")

def mostrar_narrativas_por_riesgo():
    """Muestra narrativas agrupadas por nivel de riesgo"""
    conn = obtener_conexion()
    if not conn:
        return
    
    cur = conn.cursor()
    
    try:
        logger.info("\n" + "="*60)
        logger.info("NARRATIVAS POR NIVEL DE RIESGO")
        logger.info("="*60)
        
        for riesgo in ['CRITICO', 'ALTO', 'MEDIO', 'BAJO']:
            logger.info(f"\n[{riesgo}]")
            cur.execute("""
                SELECT a.id, a.usuario_anonimo, a.emocion_principal, a.historia_inferida
                FROM analisis_semantico a
                WHERE a.nivel_riesgo = %s
                LIMIT 3
            """, (riesgo,))
            
            registros = cur.fetchall()
            if not registros:
                logger.info(f"  Sin registros con riesgo {riesgo}")
            else:
                for aid, user, emocion, historia in registros:
                    logger.info(f"  ID {aid} - {user}")
                    logger.info(f"    Emoción: {emocion}")
                    logger.info(f"    Inferencia: {historia[:100]}...")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"[ERROR] Error mostrando narrativas por riesgo: {str(e)}")

def validar_integridad_datos():
    """Valida integridad de los datos"""
    conn = obtener_conexion()
    if not conn:
        return
    
    cur = conn.cursor()
    
    try:
        logger.info("\n" + "="*60)
        logger.info("VALIDACION DE INTEGRIDAD DE DATOS")
        logger.info("="*60)
        
        # Verificar campos NULL
        logger.info(f"\n[CAMPOS NULL]")
        cur.execute("""
            SELECT 
                COUNT(CASE WHEN usuario_anonimo IS NULL THEN 1 END) as usuarios_null,
                COUNT(CASE WHEN nivel_riesgo IS NULL THEN 1 END) as riesgo_null,
                COUNT(CASE WHEN emocion_principal IS NULL THEN 1 END) as emocion_null,
                COUNT(CASE WHEN factor_estres IS NULL THEN 1 END) as factor_null,
                COUNT(CASE WHEN historia_inferida IS NULL THEN 1 END) as historia_null
            FROM analisis_semantico
        """)
        
        usuarios_null, riesgo_null, emocion_null, factor_null, historia_null = cur.fetchone()
        
        campos_validos = 0
        total_campos = 0
        
        if usuarios_null == 0:
            logger.info("  [OK] Usuarios anonimizados: OK")
            campos_validos += 1
        else:
            logger.warning(f"  [ALERTA] Usuarios NULL: {usuarios_null}")
        
        if riesgo_null == 0:
            logger.info("  [OK] Nivel de riesgo: OK")
            campos_validos += 1
        else:
            logger.warning(f"  [ALERTA] Riesgo NULL: {riesgo_null}")
        
        if emocion_null == 0:
            logger.info("  [OK] Emoción principal: OK")
            campos_validos += 1
        else:
            logger.warning(f"  [ALERTA] Emoción NULL: {emocion_null}")
        
        if factor_null == 0:
            logger.info("  [OK] Factor de estrés: OK")
            campos_validos += 1
        else:
            logger.warning(f"  [ALERTA] Factor NULL: {factor_null}")
        
        if historia_null == 0:
            logger.info("  [OK] Historia inferida: OK")
            campos_validos += 1
        else:
            logger.warning(f"  [ALERTA] Historia NULL: {historia_null}")
        
        total_campos = 5
        logger.info(f"\n[RESUMEN] {campos_validos}/{total_campos} campos válidos")
        
        # Verificar valores válidos
        logger.info(f"\n[VALORES VALIDOS]")
        cur.execute("""
            SELECT 
                COUNT(DISTINCT nivel_riesgo) as tipos_riesgo,
                COUNT(DISTINCT emocion_principal) as tipos_emocion,
                COUNT(DISTINCT factor_estres) as tipos_factor
            FROM analisis_semantico
        """)
        
        tipos_riesgo, tipos_emocion, tipos_factor = cur.fetchone()
        logger.info(f"  Tipos de riesgo detectados: {tipos_riesgo}")
        logger.info(f"  Tipos de emoción detectados: {tipos_emocion}")
        logger.info(f"  Tipos de factor detectados: {tipos_factor}")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        logger.error(f"[ERROR] Error validando integridad: {str(e)}")

def main():
    """Ejecuta todas las validaciones"""
    logger.info("\n")
    logger.info("*"*60)
    logger.info("* VALIDACION DE ANALISIS SEMANTICO - SPRINT 2")
    logger.info("*"*60)
    
    mostrar_estadisticas()
    mostrar_narrativas_por_riesgo()
    validar_integridad_datos()
    
    logger.info("\n" + "="*60)
    logger.info("VALIDACION COMPLETADA")
    logger.info("="*60)

if __name__ == "__main__":
    main()
