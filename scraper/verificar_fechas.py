import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    database=os.getenv('DB_NAME')
)

cur = conn.cursor()

# Ver distribución de fechas guardadas
cur.execute("""
    SELECT fecha_publicacion, COUNT(*) as cantidad, institucion
    FROM narrativas_crudas
    GROUP BY fecha_publicacion, institucion
    ORDER BY cantidad DESC
""")

print("\n" + "="*80)
print("DISTRIBUCIÓN DE FECHAS EN BD")
print("="*80)

for fecha, cant, inst in cur.fetchall():
    print(f"{fecha[:50]:50} | {cant:3} | {inst}")

# Resumen general
cur.execute("SELECT COUNT(*) FROM narrativas_crudas WHERE fecha_publicacion = 'Desconocida'")
desc_count = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM narrativas_crudas WHERE fecha_publicacion = 'Reciente'")
rec_count = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM narrativas_crudas")
total_count = cur.fetchone()[0]

print("\n" + "="*80)
print(f"Total narrativas: {total_count}")
print(f"Con fecha 'Desconocida': {desc_count} ({desc_count/total_count*100:.1f}%)")
print(f"Con fecha 'Reciente': {rec_count} ({rec_count/total_count*100:.1f}%)")
print(f"Con fecha real: {total_count - desc_count - rec_count} ({(total_count - desc_count - rec_count)/total_count*100:.1f}%)")
print("="*80 + "\n")

cur.close()
conn.close()
