"""
Script para validar resultados de scraping y estadísticas
"""
import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

def obtener_conexion_db():
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
        print(f"❌ Error conectando a BD: {e}")
        return None

def mostrar_estadisticas():
    """Muestra estadísticas generales del scraping"""
    conn = obtener_conexion_db()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    print("\n" + "="*70)
    print("📊 ESTADÍSTICAS GENERALES DEL SCRAPING")
    print("="*70)
    
    # Total de registros
    cursor.execute("SELECT COUNT(*) FROM narrativas_crudas;")
    total = cursor.fetchone()[0]
    print(f"\n📈 Total de registros en BD: {total}")
    
    # Por fuente
    cursor.execute("""
        SELECT fuente_id, COUNT(*) as cantidad 
        FROM narrativas_crudas 
        GROUP BY fuente_id 
        ORDER BY fuente_id
    """)
    
    fuentes = {1: "TikTok", 2: "Instagram", 3: "Facebook"}
    print(f"\n📍 Distribución por fuente:")
    for fuente_id, cantidad in cursor.fetchall():
        print(f"   • {fuentes.get(fuente_id, f'Fuente {fuente_id}')}: {cantidad} registros")
    
    # Registros últimas 24 horas
    cursor.execute("""
        SELECT COUNT(*) FROM narrativas_crudas 
        WHERE timestamp_extraccion >= NOW() - INTERVAL '24 hours'
    """)
    ultimas_24h = cursor.fetchone()[0]
    print(f"\n⏰ Última 24 horas: {ultimas_24h} registros")
    
    # Confianza promedio
    cursor.execute("SELECT AVG(confianza_relevancia) FROM narrativas_crudas WHERE confianza_relevancia > 0;")
    confianza_promedio = cursor.fetchone()[0]
    print(f"\n🎯 Confianza promedio: {confianza_promedio:.2f}")
    
    # Deduplicación
    cursor.execute("SELECT COUNT(*) FROM deduplicacion_cache;")
    cache_size = cursor.fetchone()[0]
    print(f"\n🔄 Hashes en cache de deduplicación: {cache_size}")
    
    print("\n" + "="*70)

def mostrar_ultimos_registros(limit=10):
    """Muestra los últimos registros capturados"""
    conn = obtener_conexion_db()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    print("\n" + "="*70)
    print(f"🔍 ÚLTIMOS {limit} REGISTROS CAPTURADOS")
    print("="*70)
    
    cursor.execute("""
        SELECT id, fuente_id, contenido_original, fecha_publicacion, 
               timestamp_extraccion, confianza_relevancia
        FROM narrativas_crudas 
        ORDER BY timestamp_extraccion DESC 
        LIMIT %s
    """, (limit,))
    
    fuentes = {1: "TikTok", 2: "Instagram", 3: "Facebook"}
    
    for i, (id, fuente_id, contenido, fecha_pub, timestamp, confianza) in enumerate(cursor.fetchall(), 1):
        print(f"\n[{i}] ID: {id}")
        print(f"    Fuente: {fuentes.get(fuente_id, f'Fuente {fuente_id}')}")
        print(f"    Contenido: {contenido[:100]}...")
        print(f"    Fecha pub: {fecha_pub}")
        print(f"    Timestamp: {timestamp}")
        print(f"    Confianza: {confianza:.2f}")
    
    print("\n" + "="*70)

def validar_anonimizacion(limit=5):
    """Valida que los datos estén anonimizados correctamente"""
    conn = obtener_conexion_db()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    print("\n" + "="*70)
    print("🔐 VALIDACIÓN DE ANONIMIZACIÓN")
    print("="*70)
    
    # Buscar correos electrónicos (patrón simple: contiene @)
    cursor.execute("""
        SELECT COUNT(*) FROM narrativas_crudas 
        WHERE contenido_original ILIKE '%@%' 
        AND contenido_original LIKE '%.%'
    """)
    
    sin_anonimizar = cursor.fetchone()[0]
    
    print(f"\n⚠️  Registros potencialmente sin anonimizar: {sin_anonimizar}")
    
    if sin_anonimizar == 0:
        print("✅ Todos los registros están anonimizados correctamente")
    else:
        print("🔴 ALERTA: Hay registros que pueden contener datos personales. Mostrando ejemplos:")
        cursor.execute("""
            SELECT contenido_original FROM narrativas_crudas 
            WHERE contenido_original ILIKE '%@%' 
            AND contenido_original LIKE '%.%'
            LIMIT %s
        """, (limit,))
        
        for contenido, in cursor.fetchall():
            print(f"   • {contenido[:80]}...")
    
    print("\n" + "="*70)

def main():
    print("\n🔍 VERIFICADOR DE RESULTADOS DE SCRAPING")
    print("Conectando a base de datos...")
    
    conn = obtener_conexion_db()
    if not conn:
        print("❌ No se pudo conectar a la BD")
        return
    
    conn.close()
    
    mostrar_estadisticas()
    mostrar_ultimos_registros(limit=10)
    validar_anonimizacion(limit=5)
    
    print("\n✅ Verificación completada")

if __name__ == "__main__":
    main()
