import psycopg2
import os
import re
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

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
        print(f"Error de conexión: {e}")
        return None

def limpiar_texto(texto):
    if not texto: return ""
    
    # 1. Eliminar saltos de línea y retornos de carro (\n, \r)
    texto = re.sub(r'[\r\n]+', ' ', texto)
    
    # 2. Eliminar espacios múltiples (dejar solo un espacio entre palabras)
    texto = re.sub(r'\s{2,}', ' ', texto)
    
    # 3. Eliminar caracteres extraños o invisibles (opcional pero recomendado para LLMs)
    texto = texto.replace('\u200b', '').replace('\xa0', ' ')
    
    return texto.strip()

def procesar_narrativas():
    conn = obtener_conexion()
    if not conn: return
    
    cur = conn.cursor()
    
    # 1. Buscar narrativas crudas que AÚN NO estén en la tabla de procesadas
    print("Buscando nuevas narrativas para procesar...")
    query = """
        SELECT nc.id, nc.contenido_original, nc.institucion
        FROM narrativas_crudas nc
        LEFT JOIN narrativas_procesadas np ON nc.id = np.cruda_id
        WHERE np.cruda_id IS NULL;
    """
    cur.execute(query)
    registros_pendientes = cur.fetchall()
    
    if not registros_pendientes:
        print("No hay narrativas nuevas para procesar. Todo está al día.")
        cur.close()
        conn.close()
        return

    print(f"Procesando {len(registros_pendientes)} narrativas...")
    procesados = 0

    for registro in registros_pendientes:
        cruda_id = registro[0]
        texto_original = registro[1]
        institucion = registro[2]
        
        # Limpieza final (tu scraper ya anonimizó, aquí solo normalizamos el formato)
        texto_limpio = limpiar_texto(texto_original)
        
        # Generar un ID de estudiante basado en la institución (Ej: STU-UPS, STU-UCACUE)
        estudiante_anonimo = f"STU-{institucion if institucion else 'OTRO'}"
        
        # Insertar en narrativas_procesadas
        insert_query = """
            INSERT INTO narrativas_procesadas (cruda_id, contenido_limpio, estudiante_id_anonimo)
            VALUES (%s, %s, %s)
        """
        try:
            cur.execute(insert_query, (cruda_id, texto_limpio, estudiante_anonimo))
            procesados += 1
        except Exception as e:
            print(f"Error al procesar ID {cruda_id}: {e}")
            conn.rollback()
            continue
            
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"¡Éxito! {procesados} narrativas han sido limpiadas y movidas a producción.")
    print("Los datos están listos para el Sprint 2 (Análisis con IA).")

if __name__ == "__main__":
    procesar_narrativas()