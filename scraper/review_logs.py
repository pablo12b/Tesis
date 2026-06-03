"""
Script para analizar logs de sesiones anteriores
"""
import os
import glob
from datetime import datetime

def listar_logs():
    """Lista todos los archivos de log disponibles"""
    log_dir = os.path.join(os.getcwd(), 'logs')
    
    if not os.path.exists(log_dir):
        print("📁 No hay carpeta de logs aún")
        return
    
    logs = sorted(glob.glob(os.path.join(log_dir, '*.log')), reverse=True)
    
    print("\n" + "="*70)
    print("📋 ARCHIVOS DE LOG DISPONIBLES")
    print("="*70)
    
    for i, log_file in enumerate(logs[:10], 1):
        filename = os.path.basename(log_file)
        size = os.path.getsize(log_file)
        print(f"{i}. {filename} ({size} bytes)")
    
    print("="*70)
    
    return logs

def analizar_log(log_file):
    """Analiza un archivo de log y muestra estadísticas"""
    
    print("\n" + "="*70)
    print(f"📖 ANÁLISIS DEL LOG: {os.path.basename(log_file)}")
    print("="*70)
    
    try:
        with open(log_file, 'r', encoding='utf-8') as f:
            lineas = f.readlines()
        
        # Contadores
        info_count = sum(1 for l in lineas if ' - INFO - ' in l)
        warning_count = sum(1 for l in lineas if ' - WARNING - ' in l)
        error_count = sum(1 for l in lineas if ' - ERROR - ' in l)
        debug_count = sum(1 for l in lineas if ' - DEBUG - ' in l)
        
        # Registros guardados
        guardados = sum(1 for l in lineas if '✅ Narrativa guardada' in l)
        omitidos = sum(1 for l in lineas if 'Omitiendo -' in l)
        
        print(f"\n📊 Resumen de Eventos:")
        print(f"   📝 INFO:    {info_count}")
        print(f"   ⚠️  WARNING: {warning_count}")
        print(f"   ❌ ERROR:   {error_count}")
        print(f"   🔍 DEBUG:   {debug_count}")
        
        print(f"\n🎯 Resultados:")
        print(f"   ✅ Narrativas guardadas: {guardados}")
        print(f"   ⏭️  Omitidas: {omitidos}")
        
        # Errores
        if error_count > 0:
            print(f"\n🔴 ERRORES DETECTADOS ({error_count}):")
            for linea in lineas:
                if ' - ERROR - ' in linea:
                    print(f"   {linea.strip()[:100]}...")
        
        # Últimas líneas
        print(f"\n📄 Últimas 5 líneas del log:")
        for linea in lineas[-5:]:
            print(f"   {linea.strip()[:80]}...")
        
    except Exception as e:
        print(f"❌ Error leyendo log: {e}")
    
    print("\n" + "="*70)

def main():
    print("\n🔍 ANALIZADOR DE LOGS DE SCRAPING")
    
    logs = listar_logs()
    
    if not logs:
        print("\nℹ️  Ejecuta el scraper para generar logs")
        return
    
    # Analizar el más reciente
    print("\n📍 Analizando log más reciente...")
    analizar_log(logs[0])

if __name__ == "__main__":
    main()
