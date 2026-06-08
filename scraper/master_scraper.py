"""
MASTER SCRAPER
Scraping específico por universidad con filtrado dinámico

Estructura:
- ejecutar_tiktok_universidad(p, institucion)
- ejecutar_instagram_universidad(page, institucion)
- ejecutar_facebook_universidad(p, institucion)
- main() - Orquestación central
"""

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
import psycopg2
import os
import re
from datetime import datetime, timedelta
import logging
import hashlib
import time
import json
from dotenv import load_dotenv

# ==========================================
# CONFIGURACIÓN Y LOGGING
# ==========================================

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Crear directorio de logs si no existe
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, f"master_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"), encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ==========================================
# DICCIONARIO DE INSTITUCIONES
# ==========================================

INSTITUCIONES = {
    "UPS": {
        "nombre_completo": "Universidad Politécnica Salesiana",
        "abreviatura": "ups",
        "tiktok_user": "upsalesianaec",
        "palabras_clave": ["ups", "upscuenca", "politecnica salesiana", "politécnica salesiana", "salesiana"],
        "hashtags": ["upscuenca"],
        "busqueda_nombre": "UPS Cuenca"
    },
    "UCACUE": {
        "nombre_completo": "Universidad Católica de Cuenca",
        "abreviatura": "ucacue",
        "tiktok_user": "ucatocuenca",
        "palabras_clave": ["ucacue", "universidad católica", "universidad catolica", "católica cuenca", "catolica cuenca"],
        "hashtags": ["catocorazon", "caucue", "universidadcatolica", "ucacue"],
        "busqueda_nombre": "Católica Cuenca"
    },
    "UDA": {
        "nombre_completo": "Universidad del Azuay",
        "abreviatura": "uazuay",
        "tiktok_user": "uazuay",
        "palabras_clave": ["uda", "universidad del azuay", "azuay"],
        "hashtags": ["universidaddelazuay", "uda", "unazuay"],
        "busqueda_nombre": "Universidad del Azuay"
    },
    "UCUENCA": {
        "nombre_completo": "Universidad de Cuenca",
        "abreviatura": "ucuenca",
        "tiktok_user": "ucuenca",
        "palabras_clave": ["universidad de cuenca", "u de cuenca", "ucuenca", "udecu"],
        "hashtags": ["universidaddecuenca", "ucuenca", "udecu"],
        "busqueda_nombre": "Universidad de Cuenca"
    }
}

PALABRAS_CLAVE_AMPLIACION = ["", "alerta", "urgente", "difundir", "denuncia", "ayuda", "viral", "problemas"]

CIUDADES_A_EXCLUIR = [
    "guayaquil", "gye", "quito", "uio", "oaxaca", "canarias", "méxico", "mexico", "españa"
]

palabras_emocionales = [
    # Salud mental - ansiedad, depresión, estrés
    "estrés", "estres", "ansiedad", "depresión", "depresion", "insomnio", "pánico", "panico",
    "trastorno", "crisis", "agobio", "agobiado", "sobrecargado", "sobrecargada",
    "depresivo", "ansioso", "ansiosa", "síndrome", "trastorno de ansiedad", "ataque de pánico",
    
    # Emociones negativas - sufrimiento real
    "llorar", "llorando", "lágrimas", "lagrimas", "colapso", "cansado", "cansada",
    "sufrimiento", "sufrir", "frustración", "frustrado", "frustrada", "desesperado", "desesperada",
    "desesperación", "sin esperanza", "enojado", "enojada", "harto", "harta", "hartazgo",
    "tristeza", "triste", "melancolía", "melancolia", "infeliz", "infelicidad",
    "decepción", "decepcionado", "decepcionada", "vergüenza", "verguenza",
    
    # Violencia, abuso, acoso
    "violencia", "violento", "violenta", "abuso", "abusado", "abusada", "acoso", "acosado",
    "acosada", "agresión", "agresivo", "agresiva", "golpe", "golpizado", "golpizada",
    "herida", "maltrato", "maltratado", "maltratada", "víctima", "victima",
    "robo", "robado", "asalto", "asaltado", "asaltada", "asesino", "crímenes", "crimenes",
    
    # Suicidio y autolesiones - CRÍTICO
    "suicida", "suicidio", "suicidarse", "matarse", "cortarse", "autolesión", "autolesiones",
    "se quitó la vida", "se mató", "muerte", "murió", "fallecido", "fallecida",
    "duelo", "luto", "se cortó", "se cortaba", "se hace daño", "daño a sí mismo",
    "pensamiento suicida", "ideas suicidas", "intento de suicidio",
    
    # Discriminación e injusticia
    "injusticia", "injusto", "injusta", "discriminación", "discriminado", "discriminada",
    "racismo", "racista", "sexismo", "sexista", "clasismo", "clasista", "desigualdad",
    "exclusión", "excluido", "excluida", "marginado", "marginada",
    
    # Problemas económicos - pobreza, deuda
    "pobreza", "miseria", "hambre", "desempleado", "desempleada", "desempleo",
    "deuda", "endeudado", "endeudada", "sin dinero", "sin hogar", "falta de dinero",
    "escasez", "dificultades económicas",
    
    # Relaciones tóxicas - abandono, soledad
    "tóxico", "toxica", "relación tóxica", "manipulado", "manipulada", "controlado",
    "controlada", "dependencia", "abandono", "abandonado", "abandonada",
    "soledad", "solo", "sola", "rechazado", "rechazada", "rechazo", "aislado", "aislada",
    "aislamiento", "incomprendido", "incomprendida", "ruptura",
    
    # Presión y estrés académico - tensión extrema
    "presión", "presion", "tensión", "tension", "nervios", "nerviosismo",
    
    # Enfermedades graves - salud
    "cáncer", "cancer", "tumor", "enfermedad", "enfermo", "enferma",
    "grave", "gravedad", "crítico", "critica", "hospitalizado", "hospitalizada",
    "cirugía", "cirugia", "VIH", "SIDA", "tuberculosis", "diabetes",
    "infarto", "corazón", "corazon", "parálisis", "paralisis",
    
    # Adicciones - drogas, alcohol
    "droga", "drogas", "drogado", "drogada", "adicción", "adicto", "adicta",
    "alcohol", "alcohólico", "alcoholico", "borracho", "borracha",
    "sobredosis", "overdosis", "consumo de drogas", "cocaína", "marihuana",
    
    # Crimen y seguridad - delincuencia
    "inseguridad", "delincuencia", "criminalidad", "banda", "pandillas", "narcotráfico",
    "peligro", "peligroso", "peligrosa", "amenaza", "amenazado", "amenazada",
    
    # Crisis y urgencia
    "crisis", "emergencia", "urgente", "urgencia", "alerta", "alarma", "grave",
    "acidente", "accidente", "tragedia", "tragico", "trágico",
    
    # Intensificadores
    "peor", "terrible", "horrible", "malo", "mala", "malos", "malas",
    "desastroso", "desastrosa", "desgracia", "desgraciado", "desgraciada",
    
    # Variantes y sinónimos
    "ayuda", "necesito", "necesidad", "necesitado", "necesitada",
    "desapareció", "desaparecio", "perdida", "perdido",
    "corrupción", "corrupcion", "impunidad", "caos",
]

# ==========================================
# FUNCIONES DE BASE DE DATOS
# ==========================================

def obtener_conexion_db():
    """Obtiene conexión a BD usando credenciales del .env"""
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

def detectar_institucion(texto):
    """Detecta a qué institución pertenece una narrativa"""
    texto_lower = texto.lower()
    
    coincidencias = {}
    for inst_clave, inst_data in INSTITUCIONES.items():
        coincidencias[inst_clave] = sum(1 for palabra in inst_data['palabras_clave'] if palabra in texto_lower)
    
    institucion = max(coincidencias, key=coincidencias.get)
    return institucion if coincidencias[institucion] > 0 else "OTRO"

def obtener_palabras_clave_excluir(institucion_objetivo):
    """Retorna palabras clave de las OTRAS instituciones para excluir"""
    palabras_excluir = []
    for inst_clave, inst_data in INSTITUCIONES.items():
        if inst_clave != institucion_objetivo:
            palabras_excluir.extend(inst_data['palabras_clave'])
    return palabras_excluir

def es_duplicado(contenido):
    """Verifica si el contenido ya fue procesado (por hash o contenido similar)"""
    try:
        # Primero: verificar por hash exacto (rápido)
        hash_contenido = hashlib.md5(contenido.encode()).hexdigest()
        conn = obtener_conexion_db()
        if not conn:
            return False
        
        cur = conn.cursor()
        
        # Verificar en tabla de caché de hashes
        cur.execute("SELECT 1 FROM deduplicacion_cache WHERE hash_contenido = %s LIMIT 1", (hash_contenido,))
        if cur.fetchone():
            logger.debug(f"Duplicado encontrado por HASH: {hash_contenido[:8]}...")
            cur.close()
            conn.close()
            return True
        
        # Segundo: verificar en tabla narrativas_crudas (por si falló registro en caché)
        cur.execute(
            "SELECT 1 FROM narrativas_crudas WHERE MD5(contenido_original) = %s LIMIT 1",
            (hash_contenido,)
        )
        if cur.fetchone():
            logger.debug(f"Duplicado encontrado en BD: {hash_contenido[:8]}...")
            cur.close()
            conn.close()
            return True
        
        cur.close()
        conn.close()
        return False
    except Exception as e:
        logger.warning(f"Error verificando duplicado: {str(e)}")
        return False

def registrar_hash_procesado(contenido):
    """Registra el hash de contenido como procesado"""
    try:
        hash_contenido = hashlib.md5(contenido.encode()).hexdigest()
        conn = obtener_conexion_db()
        if not conn:
            return False
        
        cur = conn.cursor()
        # INSERT simple sin ON CONFLICT (tabla no tiene UNIQUE en hash_contenido)
        cur.execute(
            "INSERT INTO deduplicacion_cache (hash_contenido, fecha_visto) VALUES (%s, NOW())",
            (hash_contenido,)
        )
        conn.commit()
        cur.close()
        conn.close()
        return True
    except Exception as e:
        logger.debug(f"Error registrando hash: {str(e)}")
        return False

def es_fecha_reciente(fecha_str, dias=28):
    """Verifica si una fecha es reciente (últimos N días)"""
    try:
        if not fecha_str or str(fecha_str).strip().lower() in ["desconocida", ""]:
            logger.debug("es_fecha_reciente: Sin fecha, rechazando por límite estricto de 4 semanas")
            return False
            
        if str(fecha_str).strip().lower() == "reciente":
            return True
            
        fecha_str_clean = str(fecha_str).strip().lower()
        
        # Patrones obvios de "reciente"
        if any(x in fecha_str_clean for x in ["hora", "horas", "h ago", "hace un momento", "minuto", "segundo", "ayer", "yesterday", "today", "hoy"]):
            return True
            
        # Extraer números seguidos de letras cortas (ej: 3d, 1w, 5h, 2m, 10 s) típicos de redes sociales
        match_corto = re.search(r'^(\d+)\s*([dhwms])\b', fecha_str_clean)
        if match_corto:
            val = int(match_corto.group(1))
            unidad = match_corto.group(2)
            if unidad in ['h', 'm', 's']: return True
            if unidad == 'd': return val <= dias
            if unidad == 'w': return (val * 7) <= dias
            
        # Extraer "hace X días", "X days ago"
        match_dias = re.search(r'(?:hace\s+)?(\d+)\s+(?:d[íi]as?|days?)(?:\s+ago)?', fecha_str_clean)
        if match_dias:
            return int(match_dias.group(1)) <= dias
            
        # Extraer "hace X semanas", "X weeks ago", "X sem"
        match_semanas = re.search(r'(?:hace\s+)?(\d+)\s+(?:semanas?|weeks?|sem)(?:\s+ago)?', fecha_str_clean)
        if match_semanas:
            return (int(match_semanas.group(1)) * 7) <= dias
            
        # Extraer meses (si es 1 mes o más, suele ser > 28 días, rechazamos por seguridad)
        match_meses = re.search(r'(?:hace\s+)?(\d+)\s+(?:mes(?:es)?|months?|mo)(?:\s+ago)?', fecha_str_clean)
        if match_meses:
            return False 
        
        if 'año' in fecha_str_clean or 'year' in fecha_str_clean or ' y ' in fecha_str_clean:
            return False
        
        # Formato ISO YYYY-MM-DD
        match_iso = re.match(r'^(\d{4})-(\d{1,2})-(\d{1,2})', fecha_str_clean)
        if match_iso:
            try:
                year, month, day = map(int, match_iso.groups())
                fecha = datetime(year, month, day)
                return (datetime.now() - fecha).days <= dias
            except: pass
        
        # Formato DD/MM/YYYY
        match_dmy = re.search(r'(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})', fecha_str_clean)
        if match_dmy:
            try:
                day, month, year = map(int, match_dmy.groups())
                fecha = datetime(year, month, day)
                return (datetime.now() - fecha).days <= dias
            except: pass
                
        # Formato textual: "10 de mayo de 2023" o "12 abr" o "May 10"
        meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic", "jan", "apr", "aug", "dec"]
        for i, m in enumerate(meses):
            if m in fecha_str_clean:
                match_dia = re.search(r'(\d{1,2})', fecha_str_clean)
                if match_dia:
                    day = int(match_dia.group(1))
                    # Mapear mes al correcto (1-12)
                    month = i + 1
                    if m == "jan": month = 1
                    if m == "apr": month = 4
                    if m == "aug": month = 8
                    if m == "dec": month = 12
                    
                    match_year = re.search(r'(20\d{2})', fecha_str_clean)
                    year = int(match_year.group(1)) if match_year else datetime.now().year
                    try:
                        fecha = datetime(year, month, day)
                        if fecha > datetime.now():
                            fecha = datetime(year - 1, month, day)
                        return (datetime.now() - fecha).days <= dias
                    except: pass
                    
        # Fallback si encontramos un año viejo
        match_year = re.search(r'(20\d{2})', fecha_str_clean)
        if match_year and int(match_year.group(1)) < datetime.now().year:
            return False
            
        # Si NO podemos entender la fecha en lo absoluto pero no parece vieja (no tiene años ni meses), 
        # para no perder datos en caso de errores de formato web, la dejamos pasar pero avisamos.
        logger.debug(f"es_fecha_reciente: Formato desconocido '{fecha_str_clean}'. Se asumirá RECIENTE para no perder posibles datos válidos.")
        return True
    except Exception as e:
        logger.error(f"Error en es_fecha_reciente: {e}")
        return True

def guardar_en_db(contenido, fuente_id, url, fecha, institucion="OTRO", likes=0, views=0, tipo_texto="publicacion", reacciones=None):
    """Guarda contenido en BD con validaciones de duplicado e institución"""
    try:
        # Verificar duplicado ANTES de guardar
        if es_duplicado(contenido):
            logger.debug(f"Contenido duplicado, omitiendo: {contenido[:50]}...")
            return False
        
        conn = obtener_conexion_db()
        if not conn:
            logger.error("No se pudo conectar a BD para guardar")
            return False
        
        cur = conn.cursor()
        
        if institucion == "OTRO":
            institucion = detectar_institucion(contenido)
        
        # Ya no usamos la fecha actual si falta. Dejamos como Nulo.
        fecha_final = fecha if fecha not in ["Desconocida", "Reciente", ""] else None
        
        import json
        reacciones_json = json.dumps(reacciones) if reacciones else "{}"
        
        cur.execute(
            "INSERT INTO narrativas_crudas (contenido_original, fuente_id, url_publicacion, fecha_publicacion, confianza_relevancia, timestamp_extraccion, institucion, likes, views, tipo_texto, reacciones) VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s, %s)",
            (contenido, fuente_id, url, fecha_final, 0.75, institucion, likes, views, tipo_texto, reacciones_json)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        # Registrar hash como procesado DESPUÉS de guardar exitosamente
        registrar_hash_procesado(contenido)
        
        logger.info(f"Narrativa guardada [{institucion}] - Fuente {fuente_id}: {contenido[:60]}...")
        return True
    except psycopg2.IntegrityError as e:
        logger.warning(f"Integridad: contenido duplicado en BD: {str(e)[:50]}")
        return False
    except Exception as e:
        logger.error(f"Error guardando en BD: {str(e)}")
        return False

# ==========================================
# PROCESAMIENTO DE TEXTOS
# ==========================================

def anonimizar_texto(texto):
    """Anonimiza datos personales (emails, IDs, nombres)"""
    # Remover emails
    texto = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[EMAIL]', texto)
    
    # Remover IDs de 9-10 dígitos (cédulas ecuatorianas)
    texto = re.sub(r'\b\d{9,10}\b', '[CEDULA]', texto)
    
    # Remover números de teléfono
    texto = re.sub(r'\b\d{7,10}\b', '[TELEFONO]', texto)
    
    return texto

def parse_metric(text):
    """Extrae un entero de textos como '1.5K', '1,200', 'Me gusta 100'"""
    if not text: return 0
    t = text.lower().replace('me gusta', '').replace('likes', '').replace('views', '').replace('reproducciones', '').replace(',', '').strip()
    match = re.search(r'([\d\.]+)([km]?)', t)
    if not match: return 0
    num_str, suffix = match.groups()
    try:
        num = float(num_str)
        if suffix == 'k': num *= 1000
        elif suffix == 'm': num *= 1000000
        return int(num)
    except:
        return 0

def filtrar_y_guardar(textos, url_origen, fuente_id, institucion_objetivo="UPS", fecha="Desconocida", likes=0, views=0, tipo_texto="publicacion", reacciones=None):
    """Filtra, valida y guarda textos en BD"""
    guardados = 0
    textos_limpios = textos[1:] if fuente_id == 2 and len(textos) > 1 else textos
    
    palabras_clave_excluir = obtener_palabras_clave_excluir(institucion_objetivo)
    
    palabras_basura = [
        "asesoría", "servicio garantizado", "cotiza", "envíos", "ventas", 
        "perro", "perrito", "mascota", "adopción", "oportunidad de trabajo", 
        "empleo", "vacante", "requiere contratar", "asambleísta", "hospital",
        "compra", "vendo", "se busca", "se extravió", "se extravio",
        "migrante", "migrantes", "desaparecido", "desaparecida", "desaparecidos",
        "auspicio", "auspiciado", "lasso", "yaku", "correa", "noboa",
        "candidato", "excandidato", "presidente de la república", "pandora papers",
        "veterinaria", "vete ", "veterinario", "inscripción", "inscripciones", "admisiones", 
        "oferta académica", "matrículas", "matricula", "vacuna", "vacunación", "dosis", "paro nacional",
        "estados unidos", "eeuu", "ee.uu.", "viaje irregular",
        "no pierdas esta oportunidad", "prepara tu proyecto", "concurso",
        "estudia ", "dispositivo", "no videntes", "copadonbosco", "torneo", "ambulancia",
        "paronacional", "otavalo", "detenida", "caricaturista", "un estudio", "investigadores",
        "gobierno", "despidos", "homicidios", "hambre", "fundaciones", "donantes",
        "democracia", "autoritaria", "pandorapapers", "carondelet", "boicot", "upc",
        # Términos administrativos/informativos (NO emocionales)
        "proyecto", "proyectos", "trabajo académico", "tarea", "tareas", "plazo", "plazos",
        "deadline", "responsabilidad", "obligación", "horario", "calendario", "período",
        "semestre", "créditos", "calificación", "calificaciones", "nota", "notas",
        "reprobación", "aprobación", "costo", "precio", "beca", "becado", "becada",
        "carrera", "programa", "clase", "clases", "aula", "aulas", "campus", "edificio",
        "laboratorio", "biblioteca", "dirección", "administrativo", "administrativos",
        "sistema", "plataforma", "formulario", "requisito", "requisitos",
        "tercera matrícula", "registro de asignaturas", "se realiza", "se encuentra"
    ]
    
    logger.debug(f"filtrar_y_guardar: Procesando {len(textos_limpios)} textos para {institucion_objetivo}")
    
    for idx, item in enumerate(textos_limpios):
        if isinstance(item, dict):
            texto = item.get("texto", "")
            item_fecha = item.get("fecha", fecha)
        else:
            texto = item
            item_fecha = fecha
            
        t = texto.strip()
        
        if len(t.split()) < 6:
            logger.debug(f"[{idx}] Omitiendo - muy corto ({len(t.split())} palabras): {t[:40]}")
            continue
            
        if len(t) > 10:
            t_lower = t.lower()
            
            # Limpiar emojis ANTES de toda búsqueda
            t_clean = re.sub(r'[^\x00-\x7F]', '', t_lower)
            t_clean_lower = t_clean.lower()
            
            # Excluir narrativas de OTRAS instituciones
            if any(palabra_excluir in t_clean_lower for palabra_excluir in palabras_clave_excluir):
                logger.debug(f"[{idx}] Omitiendo - otra institución")
                continue
            
            # Excluir ciudades
            if any(ciudad in t_clean_lower for ciudad in CIUDADES_A_EXCLUIR):
                logger.debug(f"[{idx}] Omitiendo - ciudad excluida")
                continue
                
            # Contar palabras emocionales (requiere MÍNIMO 1)
            conteo_emocional = 0
            palabras_encontradas = []
            for palabra in palabras_emocionales:
                if re.search(r'\b' + re.escape(palabra) + r'\b', t_clean_lower):
                    conteo_emocional += 1
                    palabras_encontradas.append(palabra)
            
            # Filtro: mínimo 1 palabra emocional encontrada
            if conteo_emocional < 1:
                logger.debug(f"[{idx}] Omitiendo - SIN PALABRA EMOCIONAL: {t[:60]}")
                continue
            
            if any(exc in t_clean_lower for exc in palabras_basura):
                logger.debug(f"[{idx}] Omitiendo - palabra basura encontrada")
                continue
            
            # Si llegó aquí, debería guardarse
            t_seguro = anonimizar_texto(t)
            fue_insertado = guardar_en_db(t_seguro, fuente_id, url_origen, item_fecha, institucion_objetivo, likes, views, tipo_texto, reacciones)
            if fue_insertado:
                # Remover emojis para imprimir (evitar error de encoding)
                t_sin_emojis = re.sub(r'[^\x00-\x7F]+', '', t_seguro)
                print(f"[GUARDADO] [{institucion_objetivo}] ({item_fecha}): {t_sin_emojis[:80]}...")
                guardados += 1
            else:
                logger.debug(f"[{idx}] No se guardó en BD (probablemente duplicado): {t[:60]}")
        else:
            logger.debug(f"[{idx}] Omitiendo - muy corto (len={len(t)}): {t[:40]}")
    
    logger.info(f"filtrar_y_guardar: Guardados {guardados}/{len(textos_limpios)} textos para {institucion_objetivo}")
    return guardados

# ==========================================
# FUNCIONES DE SCRAPING POR UNIVERSIDAD
# ==========================================

def ejecutar_tiktok_universidad(p, institucion="UPS"):
    """Scraping en TikTok específico para una universidad"""
    inst_data = INSTITUCIONES[institucion]
    logger.info(f"\n{'='*60}")
    logger.info(f"INICIANDO TIKTOK PARA: {inst_data['nombre_completo']}")
    logger.info(f"{'='*60}")
    
    browser = p.chromium.launch(headless=False, args=["--disable-blink-features=AutomationControlled"])
    context = browser.new_context()
    page = context.new_page()
    
    total_tiktok = 0
    
    comentarios_interceptados = []
    
    def handle_response(response):
        try:
            if "/api/comment/list/" in response.url or "/api/comment/listreply/" in response.url:
                json_data = response.json()
                if "comments" in json_data and json_data["comments"]:
                    for c in json_data["comments"]:
                        if "text" in c and "create_time" in c:
                            timestamp_s = int(c["create_time"])
                            c_date = datetime.fromtimestamp(timestamp_s).strftime("%Y-%m-%d")
                            comentarios_interceptados.append({
                                "texto": c["text"],
                                "fecha": c_date
                            })
        except: pass
        
    page.on("response", handle_response)
    
    tiktok_user = inst_data.get('tiktok_user')
    if not tiktok_user:
        logger.error(f"No hay usuario de TikTok configurado para {institucion}")
        browser.close()
        return 0
        
    url_perfil = f"https://www.tiktok.com/@{tiktok_user}"
    logger.info(f"Navegando al perfil oficial: {url_perfil}")
    
    try:
        page.goto(url_perfil, timeout=60000)
        time.sleep(5)
    except Exception as e:
        logger.error(f"Error navegando al perfil: {e}")
        browser.close()
        return 0
        
    # Scroll para cargar videos recientes
    for _ in range(4):
        page.evaluate("window.scrollBy(0, 1000);")
        time.sleep(2)
        
    videos_data = []
    try:
        video_elements = page.locator("div[data-e2e='user-post-item']").all()
        for el in video_elements:
            try:
                link = el.locator("a[href*='/video/']").first.get_attribute("href")
                views_text = el.locator("strong[data-e2e='video-views']").first.inner_text()
                if link and link not in [v['url'] for v in videos_data]:
                    videos_data.append({
                        "url": link,
                        "views": parse_metric(views_text)
                    })
            except: continue
    except Exception as e:
        logger.error(f"Error extrayendo videos del perfil: {e}")
        
    # Analizar los últimos 20 videos del perfil
    videos_data = videos_data[:20] 
    logger.info(f"Se encontraron {len(videos_data)} videos del perfil")
    
    # === BÚSQUEDA POR PALABRAS CLAVE ===
    for kw in PALABRAS_CLAVE_AMPLIACION:
        query = f"{inst_data['nombre_completo']} {kw}".strip()
        url_search = f"https://www.tiktok.com/search?q={query.replace(' ', '%20')}"
        logger.info(f"Buscando en TikTok: '{query}'")
        try:
            page.goto(url_search, timeout=40000)
            time.sleep(4)
            # Scroll un par de veces
            for _ in range(3):
                page.evaluate("window.scrollBy(0, 1000);")
                time.sleep(2)
            
            search_elements = page.locator("a[href*='/video/']").all()
            for el in search_elements:
                try:
                    link = el.get_attribute("href")
                    if link and "/video/" in link and not any(v['url'] == link for v in videos_data):
                        # En la búsqueda general asignamos views 0 si no lo tenemos a mano
                        videos_data.append({
                            "url": link,
                            "views": 0
                        })
                except: continue
        except Exception as e:
            logger.error(f"Error en búsqueda TikTok '{query}': {e}")
            
    logger.info(f"Total a analizar (Perfil + Búsqueda): {len(videos_data)} videos")
    
    for v_data in videos_data:
        video_url = v_data["url"]
        views_count = v_data["views"]
        
        comentarios_interceptados.clear()
        
        try:
            page.goto(video_url, timeout=30000)
        except: continue
        time.sleep(5)
        
        # Extraer fecha exacta usando Snowflake ID de TikTok
        fecha_publicacion = "Desconocida"
        match_id = re.search(r'/video/(\d+)', video_url)
        if match_id:
            try:
                vid_id = int(match_id.group(1))
                timestamp_s = vid_id >> 32
                fecha_exacta = datetime.fromtimestamp(timestamp_s)
                fecha_publicacion = fecha_exacta.strftime("%Y-%m-%d")
            except: pass
            
        if not es_fecha_reciente(fecha_publicacion):
            logger.info(f"Omitiendo video antiguo ({fecha_publicacion})")
            continue

        likes_count = 0
        try:
            like_el = page.locator("strong[data-e2e='like-count']").first
            if like_el.count() > 0: likes_count = parse_metric(like_el.inner_text())
        except: pass

        page.evaluate("window.scrollBy(0, 500);")
        
        # Primero: Extraer caption/descripción del video (más importante que comentarios)
        textos_video = []
        try:
            # Intentar extraer la descripción del video (puede estar en varios lugares)
            caption_selectors = [
                "h3 ~ div span[dir='auto']",  # Caption principal
                "[data-e2e='video-desc'] span",  # Descriptor de video
                "h3 ~ div > div span[dir='auto']",  # Variante
                "h3 + div span[dir='auto']"  # Otra variante
            ]
            
            for selector in caption_selectors:
                try:
                    txts = page.locator(selector).all_inner_texts()
                    if txts:
                        textos_video.extend(txts)
                        logger.debug(f"TikTok: Extraída descripción con selector '{selector}': {len(txts)} líneas")
                        break
                except:
                    continue
            
            if textos_video:
                logger.debug(f"TikTok: Caption extraída ({len(textos_video)} líneas): {' '.join(textos_video)[:80]}")
            else:
                logger.debug(f"TikTok: No se encontró caption en selectores estándar")
        except Exception as e:
            logger.warning(f"Error extrayendo caption de TikTok: {e}")
        
        # Segundo: Extraer comentarios si existen
        comentarios_finales = []
        try:
            page.wait_for_selector("[data-e2e='comment-level-1'], .comment-text", timeout=5000)
            time.sleep(2)
            
            # Bucle para cargar la mayor cantidad de comentarios posibles
            for _ in range(10):
                page.evaluate("window.scrollBy(0, 800);")
                time.sleep(1.5)
                try:
                    # Botones típicos de cargar más en TikTok
                    btn = page.locator("text='Ver más respuestas', text='View more replies', text='Cargar más comentarios', text='Load more comments'").first
                    if btn.is_visible(timeout=500):
                        btn.click()
                except: pass
            
            # Priorizamos comentarios interceptados de la red
            if comentarios_interceptados:
                comentarios_finales = comentarios_interceptados.copy()
                logger.debug(f"TikTok: {len(comentarios_finales)} comentarios interceptados vía red con fecha exacta")
            else:
                comentarios_finales = page.locator("[data-e2e='comment-level-1'], .SpanCommentContent, .comment-text").all_inner_texts()
                if comentarios_finales:
                    logger.debug(f"TikTok: {len(comentarios_finales)} comentarios extraídos visualmente")
        except: 
            logger.debug(f"TikTok: No hay comentarios o timeout cargándolos")
        
        # Guardar publicacion
        if textos_video:
            total_tiktok += filtrar_y_guardar(
                textos_video, 
                video_url, 
                fuente_id=1, 
                institucion_objetivo=institucion,
                fecha=fecha_publicacion,
                likes=likes_count,
                views=views_count,
                tipo_texto='publicacion'
            )
        else:
            logger.debug(f"TikTok: Video sin texto extraíble")

        # Guardar comentarios
        if comentarios_finales:
            total_tiktok += filtrar_y_guardar(
                comentarios_finales,
                video_url,
                fuente_id=1,
                institucion_objetivo=institucion,
                fecha=fecha_publicacion,
                likes=0,
                views=0,
                tipo_texto='comentario'
            )
        else:
            logger.debug(f"TikTok: Video sin texto extraíble")
    
    browser.close()
    logger.info(f"TIKTOK {institucion} FINALIZADO: {total_tiktok} narrativas.")
    print(f"\n[OK] TIKTOK {institucion}: {total_tiktok} narrativas guardadas.\n")
    
    return total_tiktok

def ejecutar_instagram_universidad(p, institucion="UPS"):
    """Scraping en Instagram específico para una universidad"""
    inst_data = INSTITUCIONES[institucion]
    logger.info(f"\n{'='*60}")
    logger.info(f"INICIANDO INSTAGRAM PARA: {inst_data['nombre_completo']}")
    logger.info(f"{'='*60}")
    
    # Usar contexto persistente para reutilizar sesiones guardadas
    ruta_perfil = os.path.abspath("./playwright_profile")
    browser = p.chromium.launch_persistent_context(
        user_data_dir=ruta_perfil,
        headless=False,
        args=["--disable-blink-features=AutomationControlled", "--disable-notifications"]
    )
    page = browser.pages[0] if browser.pages else browser.new_page()
    
    logger.info(f"Usando sesión guardada para Instagram ({institucion})...")
    time.sleep(2)
    
    ig_comentarios_interceptados = []
    
    def handle_ig_response(response):
        try:
            if "comments" in response.url or "graphql" in response.url:
                json_data = response.json()
                def extract_comments_ig(obj):
                    if isinstance(obj, dict):
                        if "created_at" in obj and "text" in obj:
                            try:
                                timestamp_s = int(obj["created_at"])
                                c_date = datetime.fromtimestamp(timestamp_s).strftime("%Y-%m-%d")
                                ig_comentarios_interceptados.append({
                                    "texto": obj["text"],
                                    "fecha": c_date
                                })
                            except: pass
                        for k, v in obj.items():
                            extract_comments_ig(v)
                    elif isinstance(obj, list):
                        for item in obj:
                            extract_comments_ig(item)
                extract_comments_ig(json_data)
        except: pass
        
    page.on("response", handle_ig_response)
    
    # Construir lista de hashtags base + ampliados
    hashtags_a_buscar = []
    base_hashtags = inst_data['hashtags'] if isinstance(inst_data['hashtags'], list) else [inst_data['hashtags']]
    
    for base_ht in base_hashtags:
        hashtags_a_buscar.append(base_ht)
        for kw in PALABRAS_CLAVE_AMPLIACION:
            if kw:
                hashtags_a_buscar.append(f"{base_ht}{kw}")
    
    total_ig = 0
    
    for hashtag in hashtags_a_buscar:
        print(f"\n   Buscando #{hashtag} en Instagram...")
        try:
            page.goto(f"https://www.instagram.com/explore/tags/{hashtag}/", timeout=60000)
        except: pass
        
        time.sleep(5)
        
        try:
            primer_post = page.locator("article a[href*='/p/'], a[href*='/reel/'], main a[href*='/p/']").first
            primer_post.click(timeout=10000)
            time.sleep(5)
        except Exception as e:
            print(f"No se encontraron publicaciones accesibles para #{hashtag}.")
            continue

        for i in range(8):
            print(f"   -> Revisando post {i+1}/8 de #{hashtag}...")
            url_actual = page.url
            
            ig_comentarios_interceptados.clear()
            
            fecha_publicacion = "Desconocida"
            omitir_post = False
            try:
                tiempo_loc = page.locator("time").first
                if tiempo_loc.count() > 0:
                    fecha_str = tiempo_loc.get_attribute("datetime") or tiempo_loc.get_attribute("title") or tiempo_loc.get_attribute("aria-label")
                    if fecha_str:
                        match = re.search(r'(\d{4}-\d{2}-\d{2})', fecha_str)
                        if match:
                            fecha_publicacion = match.group(1)
                        else:
                            fecha_publicacion = fecha_str[:10]
                        if not es_fecha_reciente(fecha_publicacion):
                            omitir_post = True
            except: pass

            likes_count = 0
            views_count = 0
            try:
                like_el = page.locator("a[href*='/liked_by/'] span, section span:has-text('Me gusta'), section span:has-text('likes')").first
                if like_el.count() > 0: likes_count = parse_metric(like_el.inner_text())
                view_el = page.locator("section span:has-text('reproducciones'), section span:has-text('views')").first
                if view_el.count() > 0: views_count = parse_metric(view_el.inner_text())
            except: pass
            
            if omitir_post:
                print(f"Omitiendo post antiguo de Instagram ({fecha_publicacion})")
            else:
                textos_post = []
                
                # Primero: Extraer caption/descripción del post (lo más importante)
                try:
                    # La descripción está típicamente después del nombre de usuario
                    caption_selectors = [
                        "h1 + div span[dir='auto']",  # Caption después del nombre
                        "h2 + div span[dir='auto']",  # Variante
                        "article span[dir='auto']",   # Dentro del artículo
                        "div._a6hd > span[dir='auto']",  # Clase Bootstrap de Instagram
                    ]
                    
                    for selector in caption_selectors:
                        try:
                            txts = page.locator(selector).all_inner_texts()
                            if txts:
                                # Filtrar textos cortos y bannales
                                txts_filtrados = [t.strip() for t in txts if len(t.strip()) > 10]
                                if txts_filtrados:
                                    textos_post.extend(txts_filtrados)
                                    logger.debug(f"Instagram: Caption extraída: {len(txts_filtrados)} líneas")
                                    break
                        except:
                            continue
                except Exception as e:
                    logger.warning(f"Error extrayendo caption de Instagram: {e}")
                
                # Segundo: Cargar y extraer comentarios completos
                try:
                    for _ in range(8):
                        btn_mas = page.locator("svg[aria-label='Cargar más comentarios'], text='Ver los', text='Cargar más comentarios', svg[aria-label='Load more comments']").first
                        if btn_mas.is_visible(timeout=1500):
                            btn_mas.click()
                            time.sleep(2)
                        else:
                            # Hacer pequeño scroll por si los comentarios son perezosos
                            page.evaluate("window.scrollBy(0, 500);")
                            time.sleep(1)
                except: pass
                
                # Extraer comentarios con selectores mejorados
                comentarios = []
                try:
                    comentarios_selectors = [
                        "ul div.xdj266r span[dir='auto']",    # Comentarios estándar
                        "div.x1lliihq span[dir='auto']",       # Replies/respuestas
                        "div._a9zs span",                       # Otro formato
                        "article span[dir='auto']"             # Fallback general
                    ]
                    
                    for selector in comentarios_selectors:
                        try:
                            coms = page.locator(selector).all_inner_texts()
                            if coms:
                                # Filtrar comentarios cortos (< 6 palabras)
                                coms_validos = [c.strip() for c in coms if len(c.strip().split()) >= 6]
                                if coms_validos:
                                    comentarios.extend(coms_validos)
                                    logger.debug(f"Instagram: {len(coms_validos)} comentarios extraídos")
                                    break
                        except:
                            continue
                except Exception as e:
                    logger.warning(f"Error extrayendo comentarios de Instagram: {e}")
                
                comentarios_finales = []
                if ig_comentarios_interceptados:
                    comentarios_finales = ig_comentarios_interceptados.copy()
                else:
                    comentarios_finales = comentarios
                
                # Guardar publicacion
                if textos_post:
                    logger.debug(f"Instagram: Post extraido: {len(textos_post)}")
                    total_ig += filtrar_y_guardar(textos_post, url_actual, fuente_id=2, fecha=fecha_publicacion, institucion_objetivo=institucion, likes=likes_count, views=views_count, tipo_texto="publicacion")
                else:
                    logger.debug(f"Instagram: Post sin texto extraíble")

                # Guardar comentarios
                if comentarios_finales:
                    total_ig += filtrar_y_guardar(comentarios_finales, url_actual, fuente_id=2, fecha=fecha_publicacion, institucion_objetivo=institucion, likes=0, views=0, tipo_texto="comentario")

            try:
                page.keyboard.press("ArrowRight")
                time.sleep(4)
            except: break
    
    browser.close()
    logger.info(f"INSTAGRAM {institucion} FINALIZADO: {total_ig} narrativas.")
    print(f"\n[OK] INSTAGRAM {institucion}: {total_ig} narrativas guardadas.\n")
    
    return total_ig

def ejecutar_facebook_universidad(p, institucion="UPS"):
    """Scraping en Facebook específico para una universidad"""
    inst_data = INSTITUCIONES[institucion]
    logger.info(f"\n{'='*60}")
    logger.info(f"INICIANDO FACEBOOK PARA: {inst_data['nombre_completo']}")
    logger.info(f"{'='*60}")
    
    # Usar contexto persistente para reutilizar sesiones guardadas
    ruta_perfil = os.path.abspath("./playwright_profile")
    browser = p.chromium.launch_persistent_context(
        user_data_dir=ruta_perfil,
        headless=False,
        args=["--disable-blink-features=AutomationControlled", "--disable-notifications"]
    )
    page = browser.pages[0] if browser.pages else browser.new_page()
    
    logger.info(f"Usando sesión guardada para Facebook ({institucion})...")
    time.sleep(2)
    
    fb_comentarios_interceptados = []
    
    def handle_fb_response(response):
        try:
            if "graphql" in response.url:
                json_data = response.json()
                def extract_comments_fb(obj):
                    if isinstance(obj, dict):
                        if "created_time" in obj and "body" in obj and isinstance(obj["body"], dict) and "text" in obj["body"]:
                            try:
                                texto_val = obj["body"]["text"]
                                if texto_val and len(str(texto_val).strip()) > 0:
                                    timestamp_s = int(obj["created_time"])
                                    c_date = datetime.fromtimestamp(timestamp_s).strftime("%Y-%m-%d")
                                    fb_comentarios_interceptados.append({
                                        "texto": texto_val,
                                        "fecha": c_date
                                    })
                            except: pass
                        for k, v in obj.items():
                            extract_comments_fb(v)
                    elif isinstance(obj, list):
                        for item in obj:
                            extract_comments_fb(item)
                
                extract_comments_fb(json_data)
        except: pass
        
    page.on("response", handle_fb_response)
    
    total_fb = 0
    # --- FILTRO GEOGRÁFICO Y COMERCIAL DE EXCLUSIÓN PARA FB ---
    palabras_exclusion = [
        "oaxaca", "canarias", "méxico", "mexico", "españa", 
        "envío", "paquetería", "envios", "paqueteria", "envíos",
        "frente a", "ubicados", "whatsapp", "cotiza", "pedidos", 
        "compras", "precio", "vendemos", "venta", "ventas", "fabricamos"
    ]
    
    for keyword in PALABRAS_CLAVE_AMPLIACION:
        # Construir query con nombre de universidad
        query = f"{inst_data['nombre_completo']} {keyword}".strip()
        url_fb = f"https://www.facebook.com/search/posts/?q={query.replace(' ', '%20')}"
        
        print(f"\n   Buscando '{query}' en Facebook...")
        try:
            page.goto(url_fb, timeout=60000)
        except: pass
        time.sleep(8)
        
        try:
            btn_cerrar = page.locator("div[aria-label='Cerrar'], div[aria-label='Close']").first
            if btn_cerrar.is_visible(timeout=2000):
                btn_cerrar.click()
        except: pass
        
        print(f"   Haciendo scroll en los resultados de búsqueda para '{query}'...")
        for _ in range(8):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(4)
            
        try:
            articulos = page.locator("div[role='feed'] > div, div[role='article']").all()
            for articulo in articulos:
                try:
                    txt = articulo.inner_text()
                    if not txt: continue
                    
                    if not es_fecha_reciente(txt[:100]):
                        continue
                        
                    # Filtro de exclusión para noticias de la empresa de paquetería o fuera del contexto local
                    if any(exc in txt.lower() for exc in palabras_exclusion):
                        continue

                    fecha_publicacion = "Desconocida"
                    try:
                        # Extraer Unix timestamp oculto en HTML (data-utime, data-store)
                        unix_ts = articulo.evaluate('''el => {
                            let timeEls = el.querySelectorAll('[data-utime]');
                            if (timeEls.length > 0) return timeEls[0].getAttribute('data-utime');
                            let abbrEls = el.querySelectorAll('abbr[data-store]');
                            if (abbrEls.length > 0) {
                                try {
                                    let store = JSON.parse(abbrEls[0].getAttribute('data-store'));
                                    if (store.time) return store.time;
                                } catch(e){}
                            }
                            return null;
                        }''')
                        if unix_ts:
                            fecha_exacta = datetime.fromtimestamp(int(unix_ts))
                            fecha_publicacion = fecha_exacta.strftime("%Y-%m-%d")
                    except: pass

                    if fecha_publicacion == "Desconocida":
                        try:
                            fecha_el = articulo.locator("a[role='link'][aria-label]").first
                            if fecha_el.count() > 0:
                                f_attr = fecha_el.get_attribute('aria-label')
                                if f_attr and ("202" in f_attr or "hace" in f_attr or "ayer" in f_attr):
                                    fecha_publicacion = f_attr
                        except: pass
                    
                    if not es_fecha_reciente(fecha_publicacion):
                        continue

                    likes_count = 0
                    views_count = 0
                    reacciones_dict = {}
                    try:
                        like_el = articulo.locator("span[toolbar='[object Object]'], div[aria-label*='reacciones'], span[aria-label*='reacciones'], div[role='button']:has(img)").first
                        if like_el.count() > 0:
                            l_text = like_el.inner_text() or like_el.get_attribute("aria-label") or "0"
                            likes_count = parse_metric(l_text)
                            
                            # Intentar abrir modal de reacciones
                            try:
                                like_el.click(timeout=3000)
                                time.sleep(2)
                                tabs = page.locator("div[role='dialog'] div[role='tablist'] div[role='tab']").all()
                                for tab in tabs:
                                    tab_text = tab.get_attribute("aria-label")
                                    if tab_text:
                                        parts = tab_text.split(":")
                                        if len(parts) == 2:
                                            key = parts[0].strip().lower().replace(" ", "_")
                                            val = parse_metric(parts[1].strip())
                                            reacciones_dict[key] = val
                                            if key in ['todas', 'all']:
                                                likes_count = val
                                page.keyboard.press("Escape")
                                time.sleep(1)
                            except: pass
                        
                        view_el = articulo.locator("span:has-text('reproducciones'), span:has-text('views')").first
                        if view_el.count() > 0:
                            views_count = parse_metric(view_el.inner_text())
                    except: pass

                    # EXPANDIR TEXTO LARGO (Ver más)
                    try:
                        btn_ver_mas = articulo.locator("div[role='button']:has-text('Ver más'), div[role='button']:has-text('See more')").first
                        if btn_ver_mas.is_visible(timeout=1000):
                            btn_ver_mas.click()
                            time.sleep(1)
                    except: pass

                    # EXPANDIR COMENTARIOS
                    fb_comentarios_interceptados.clear()
                    try:
                        btn_comentarios = articulo.locator("div[role='button']:has-text('comentario'), div[role='button']:has-text('comment')").first
                        if btn_comentarios.is_visible(timeout=1000):
                            btn_comentarios.click()
                            time.sleep(3)
                            
                        # Cargar más comentarios en Facebook
                        for _ in range(6):
                            btn_mas_comentarios = page.locator("div[role='button']:has-text('Ver más comentarios'), div[role='button']:has-text('Ver comentarios anteriores'), text='Ver más comentarios', text='Ver más respuestas'").first
                            if btn_mas_comentarios.is_visible(timeout=1000):
                                btn_mas_comentarios.click()
                                time.sleep(2.5)
                            else:
                                break
                    except: pass

                    post_url = url_fb
                    try:
                        extracted_url = articulo.evaluate('''el => {
                            let links = Array.from(el.querySelectorAll("a[href]"));
                            let postLink = links.find(a => a.href.includes('/posts/') || a.href.includes('/videos/') || a.href.includes('/permalink/') || a.href.includes('fbid='));
                            return postLink ? postLink.href : null;
                        }''')
                        if extracted_url: post_url = extracted_url
                    except: pass

                    textos = articulo.locator("div[dir='auto']").all_inner_texts()
                    if textos:
                        publicacion = [textos[0]]
                        
                        comentarios_finales = []
                        if fb_comentarios_interceptados:
                            comentarios_finales = fb_comentarios_interceptados.copy()
                        else:
                            comentarios_finales = textos[1:]
                        
                        total_fb += filtrar_y_guardar(publicacion, post_url, fuente_id=3, fecha=fecha_publicacion, institucion_objetivo=institucion, likes=likes_count, views=views_count, tipo_texto="publicacion", reacciones=reacciones_dict)
                        if comentarios_finales:
                            total_fb += filtrar_y_guardar(comentarios_finales, post_url, fuente_id=3, fecha=fecha_publicacion, institucion_objetivo=institucion, likes=0, views=0, tipo_texto="comentario")
                except: continue
            
        except Exception as e:
            logger.warning(f"Error leyendo Facebook: {e}")
        
    logger.info(f"Facebook {institucion}: scraping iniciado")
    
    browser.close()
    logger.info(f"FACEBOOK {institucion} FINALIZADO: {total_fb} narrativas.")
    print(f"\n[OK] FACEBOOK {institucion}: {total_fb} narrativas guardadas.\n")
    
    return total_fb

# ==========================================
# ORQUESTACIÓN PRINCIPAL
# ==========================================

def main():
    """Ejecuta scraping para TODAS las universidades"""
    logger.info("\n" + "="*70)
    logger.info("INICIANDO MASTER SCRAPER")
    logger.info("="*70)
    
    resumen = {}
    
    with sync_playwright() as p:
        # Ejecutar para cada universidad
        for institucion in ["UPS", "UCACUE", "UDA", "UCUENCA"]:
            logger.info(f"\n\n{'#'*70}")
            logger.info(f"# PROCESANDO: {institucion}")
            logger.info(f"{'#'*70}")
            
            total_tiktok = ejecutar_tiktok_universidad(p, institucion)
            total_instagram = ejecutar_instagram_universidad(p, institucion)
            total_facebook = ejecutar_facebook_universidad(p, institucion)
            
            total_inst = total_tiktok + total_instagram + total_facebook
            resumen[institucion] = {
                "tiktok": total_tiktok,
                "instagram": total_instagram,
                "facebook": total_facebook,
                "total": total_inst
            }
    
    # Resumen final
    logger.info("\n" + "="*70)
    logger.info("RESUMEN FINAL DE SCRAPING POR INSTITUCIÓN")
    logger.info("="*70)
    
    total_general = 0
    for inst, datos in resumen.items():
        logger.info(f"\n{inst}:")
        logger.info(f"  TikTok:    {datos['tiktok']:3d}")
        logger.info(f"  Instagram: {datos['instagram']:3d}")
        logger.info(f"  Facebook:  {datos['facebook']:3d}")
        logger.info(f"  SUBTOTAL:  {datos['total']:3d}")
        total_general += datos['total']
    
    logger.info(f"\n{'='*70}")
    logger.info(f"TOTAL GENERAL: {total_general} narrativas")
    logger.info(f"{'='*70}\n")
    
    print("\n" + "="*70)
    print("[OK] SCRAPING COMPLETADO")
    print(f"Total narrativas: {total_general}")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
