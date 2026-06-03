"""
Script para limpiar TODA la base de datos antes de un nuevo scraping
Borra datos en orden correcto respetando foreign keys
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def limpiar_bd():
    try:
        conn = psycopg2.connect(
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT'),
            database=os.getenv('DB_NAME')
        )
        
        cur = conn.cursor()
        
        print("\n" + "="*80)
        print("LIMPIANDO BASE DE DATOS")
        print("="*80)
        
        # Orden importante: por dependencias de FK
        tablas = [
            'analisis_semantico',
            'narrativas_procesadas',
            'narrativas_crudas',
            'deduplicacion_cache'
        ]
        
        for tabla in tablas:
            cur.execute(f"DELETE FROM {tabla}")
            deleted = cur.rowcount
            print(f"✓ {tabla:30} | {deleted:5} registros eliminados")
        
        conn.commit()
        
        print("="*80)
        print("✅ BASE DE DATOS LIMPIADA - Lista para nuevo scraping")
        print("="*80 + "\n")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    
    return True

if __name__ == "__main__":
    import sys
    
    print("\n⚠️  ADVERTENCIA: Esto borrará TODA la información de la BD")
    print("   Narrativas crudas, procesadas, análisis y caché de deduplicación")
    respuesta = input("\n¿Confirmas que quieres continuar? (escribe 'SI' para confirmar): ").strip().upper()
    
    if respuesta == "SI":
        if limpiar_bd():
            sys.exit(0)
        else:
            sys.exit(1)
    else:
        print("❌ Operación cancelada")
        sys.exit(1)
