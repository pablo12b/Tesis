import psycopg2
import os
import re
import emoji
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
    
    # 0. Traducir emojis a texto (ej. 🔥 -> :fuego:)
    # Se hace en español para que los modelos de lenguaje lo entiendan.
    texto = emoji.demojize(texto, language='es')
    
    # Quitar los dos puntos de la traducción de emojis (opcional, ayuda a la IA)
    texto = texto.replace(':', ' ')
    
    # 1. Eliminar saltos de línea y retornos de carro (\n, \r)
    texto = re.sub(r'[\r\n]+', ' ', texto)
    
    # 2. Eliminar espacios múltiples (dejar solo un espacio entre palabras)
    texto = re.sub(r'\s{2,}', ' ', texto)
    
    # 3. Eliminar caracteres extraños o invisibles
    texto = texto.replace('\u200b', '').replace('\xa0', ' ')
    
    return texto.strip()

def procesar_narrativas():
    conn = obtener_conexion()
    if not conn: return
    
    cur = conn.cursor()
    
    # Asegurar que narrativas_procesadas tenga la columna para saber si es heredado (opcional pero útil)
    try:
        cur.execute("ALTER TABLE narrativas_procesadas ADD COLUMN IF NOT EXISTS es_contexto_heredado BOOLEAN DEFAULT FALSE;")
        conn.commit()
    except:
        conn.rollback()

    print("Buscando nuevas narrativas para procesar...")
    # Ahora también traemos tipo_texto y url_publicacion para la herencia de contexto
    query = """
        SELECT nc.id, nc.contenido_original, nc.institucion, nc.tipo_texto, nc.url_publicacion
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
        tipo_texto = registro[3]
        url_publicacion = registro[4]
        
        # Traduce emojis y limpia espacios
        texto_limpio = limpiar_texto(texto_original)
        es_heredado = False
        
        # HERENCIA DE CONTEXTO
        # Si es un comentario y es muy corto (menos de 6 palabras)
        if tipo_texto == 'comentario' and len(texto_limpio.split()) < 6:
            # Buscamos la publicación original a la que pertenece este comentario
            cur.execute("""
                SELECT contenido_original FROM narrativas_crudas 
                WHERE url_publicacion = %s AND tipo_texto = 'publicacion' LIMIT 1
            """, (url_publicacion,))
            parent = cur.fetchone()
            
            if parent and parent[0]:
                parent_text = limpiar_texto(parent[0])
                # Limitamos el texto del padre para que no consuma toda la memoria de la IA
                parent_text_short = " ".join(parent_text.split()[:40]) 
                # Le inyectamos el contexto al comentario para la IA
                texto_limpio = f"{texto_limpio} [Contexto heredado de publicacion: {parent_text_short}...]"
                es_heredado = True
        
        # Generar un ID de estudiante basado en la institución
        estudiante_anonimo = f"STU-{institucion if institucion else 'OTRO'}"
        
        # Insertar en narrativas_procesadas
        insert_query = """
            INSERT INTO narrativas_procesadas (cruda_id, contenido_limpio, estudiante_id_anonimo, es_contexto_heredado)
            VALUES (%s, %s, %s, %s)
        """
        try:
            cur.execute(insert_query, (cruda_id, texto_limpio, estudiante_anonimo, es_heredado))
            procesados += 1
        except Exception as e:
            print(f"Error al procesar ID {cruda_id}: {e}")
            conn.rollback()
            continue
            
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"¡Éxito! {procesados} narrativas han sido procesadas (con traducción de emojis y herencia de contexto).")
    print("Los datos están listos para el Sprint 2 (Análisis Semántico con IA).")

if __name__ == "__main__":
    procesar_narrativas()