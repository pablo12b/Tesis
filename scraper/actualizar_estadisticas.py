import psycopg2
import os
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

import argparse

def actualizar_estadisticas(institucion_arg="TODAS"):
    conn = obtener_conexion()
    if not conn: return
    
    cur = conn.cursor()
    
    # 1. Crear la tabla de estadísticas si no existe
    crear_tabla_query = """
        CREATE TABLE IF NOT EXISTS estadisticas_universidad (
            id SERIAL PRIMARY KEY,
            institucion VARCHAR(100) UNIQUE NOT NULL,
            total_publicaciones INTEGER DEFAULT 0,
            total_comentarios INTEGER DEFAULT 0,
            total_likes INTEGER DEFAULT 0,
            total_views INTEGER DEFAULT 0,
            ultima_actualizacion TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS estadisticas_historico (
            id SERIAL PRIMARY KEY,
            institucion VARCHAR(100) NOT NULL,
            fecha DATE NOT NULL DEFAULT CURRENT_DATE,
            total_publicaciones INTEGER DEFAULT 0,
            total_comentarios INTEGER DEFAULT 0,
            total_likes INTEGER DEFAULT 0,
            total_views INTEGER DEFAULT 0,
            UNIQUE (institucion, fecha)
        );
    """
    try:
        cur.execute(crear_tabla_query)
        conn.commit()
        print("Tablas de estadísticas verificadas/creadas exitosamente.")
    except Exception as e:
        print(f"Error al crear tablas: {e}")
        conn.rollback()
        cur.close()
        conn.close()
        return

    # 2. Calcular estadísticas agregadas desde narrativas_crudas
    print("Calculando estadísticas actuales...")
    
    # Esta consulta suma likes y views, y cuenta cuántas publicaciones y comentarios hay por institución
    # Usamos COALESCE para manejar casos donde las columnas likes/views puedan ser NULL
    if institucion_arg != "TODAS":
        calculo_query = """
            SELECT 
                institucion,
                COUNT(*) FILTER (WHERE tipo_texto = 'publicacion') as total_publicaciones,
                COUNT(*) FILTER (WHERE tipo_texto = 'comentario') as total_comentarios,
                SUM(COALESCE(likes, 0)) as total_likes,
                SUM(COALESCE(views, 0)) as total_views
            FROM narrativas_crudas
            WHERE institucion = %s AND institucion IS NOT NULL AND institucion != ''
            GROUP BY institucion;
        """
        cur.execute(calculo_query, (institucion_arg,))
    else:
        calculo_query = """
            SELECT 
                institucion,
                COUNT(*) FILTER (WHERE tipo_texto = 'publicacion') as total_publicaciones,
                COUNT(*) FILTER (WHERE tipo_texto = 'comentario') as total_comentarios,
                SUM(COALESCE(likes, 0)) as total_likes,
                SUM(COALESCE(views, 0)) as total_views
            FROM narrativas_crudas
            WHERE institucion IS NOT NULL AND institucion != ''
            GROUP BY institucion;
        """
        cur.execute(calculo_query)
    resultados = cur.fetchall()
    
    if not resultados:
        print("No hay datos en narrativas_crudas para calcular estadísticas.")
        cur.close()
        conn.close()
        return

    # 3. Insertar o actualizar (UPSERT) los resultados en la tabla de estadísticas
    print(f"Actualizando estadísticas para {len(resultados)} instituciones...")
    
    upsert_global_query = """
        INSERT INTO estadisticas_universidad 
            (institucion, total_publicaciones, total_comentarios, total_likes, total_views, ultima_actualizacion)
        VALUES 
            (%s, %s, %s, %s, %s, NOW())
        ON CONFLICT (institucion) 
        DO UPDATE SET 
            total_publicaciones = EXCLUDED.total_publicaciones,
            total_comentarios = EXCLUDED.total_comentarios,
            total_likes = EXCLUDED.total_likes,
            total_views = EXCLUDED.total_views,
            ultima_actualizacion = NOW();
    """

    upsert_historico_query = """
        INSERT INTO estadisticas_historico
            (institucion, fecha, total_publicaciones, total_comentarios, total_likes, total_views)
        VALUES
            (%s, CURRENT_DATE, %s, %s, %s, %s)
        ON CONFLICT (institucion, fecha)
        DO UPDATE SET
            total_publicaciones = EXCLUDED.total_publicaciones,
            total_comentarios = EXCLUDED.total_comentarios,
            total_likes = EXCLUDED.total_likes,
            total_views = EXCLUDED.total_views;
    """
    
    exito = 0
    for fila in resultados:
        institucion = fila[0]
        pubs = fila[1]
        coms = fila[2]
        likes = fila[3]
        views = fila[4]
        
        try:
            cur.execute(upsert_global_query, (institucion, pubs, coms, likes, views))
            cur.execute(upsert_historico_query, (institucion, pubs, coms, likes, views))
            
            # Guardar también en historial_narrativas_diarias
            import json
            metricas_json = json.dumps({
                "publicaciones": pubs,
                "comentarios": coms,
                "likes": likes,
                "views": views
            })
            cur.execute("""
                UPDATE historial_narrativas_diarias 
                SET metricas = %s 
                WHERE institucion = %s AND fecha = CURRENT_DATE
            """, (metricas_json, institucion))
            
            exito += 1
            print(f"[{institucion}] Pubs: {pubs} | Coms: {coms} | Likes: {likes} | Vistas: {views}")
        except Exception as e:
            print(f"Error al actualizar institución {institucion}: {e}")
            conn.rollback()
            continue
            
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"\n¡Éxito! Se han actualizado las estadísticas de {exito} universidades.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Actualizar estadísticas")
    parser.add_argument("--institucion", type=str, default="TODAS", help="Institución a procesar")
    args = parser.parse_args()
    actualizar_estadisticas(args.institucion)
