# 📊 Dashboard de Narrativas - Guía de Instalación y Ejecución

## Estructura del Proyecto

```
Tesis/
├── scraper/                 # Scripts de scraping de redes sociales
├── back/                    # API Backend (Express.js + Node.js)
│   ├── server.js           # Servidor principal
│   └── package.json
├── front/                   # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── UniversidadTabs.tsx
│   │   │   ├── PieChartCard.tsx
│   │   │   └── StatCard.tsx
│   │   └── index.css
│   └── package.json
└── .env                     # Configuración (credenciales BD, etc)
```

## Requisitos

- **Node.js**: v16+ ([Descargar](https://nodejs.org/))
- **Python**: 3.9+ (para scraping)
- **PostgreSQL**: Con base de datos `tesis_bienestar` creada
- **npm**: Gestor de paquetes (viene con Node.js)

## Instalación

### 1. Backend (Express API)

```bash
cd back
npm install
```

### 2. Frontend (React Dashboard)

```bash
cd front
npm install
```

## Ejecución

### Opción 1: Ejecutar todo manualmente

**Terminal 1 - Backend:**
```bash
cd back
npm start
# Servidor en http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd front
npm run dev
# Dashboard en http://localhost:5173
```

### Opción 2: Script de ejecución (Windows PowerShell)

```powershell
# Desde la carpeta Tesis
.\run-dashboard.ps1
```

## Flujo de Trabajo

1. **Scraping** (Ejecutar primero)
   ```bash
   cd scraper
   python .\venv\Scripts\python.exe master_scraper_refactored.py
   ```

2. **Limpieza de datos**
   ```bash
   python .\venv\Scripts\python.exe limpiar_datos.py
   ```

3. **Análisis semántico**
   ```bash
   python .\venv\Scripts\python.exe analizar_narrativas.py
   ```

4. **Dashboard**
   ```bash
   # Backend
   cd back && npm start
   
   # Frontend (otra terminal)
   cd front && npm run dev
   ```

## Solución de Problemas

### Error: "Cannot find module 'express'"
```bash
cd back
npm install
```

### Error: "ECONNREFUSED" al cargar el dashboard
- Verifica que el backend esté ejecutándose en `http://localhost:5000`
- Abre http://localhost:5000/api/health en el navegador
- Si falla, revisa las variables de entorno en `.env`

### Error: "No hay universidades registradas"
- Ejecuta primero el scraper para obtener datos
- Verifica que los datos se guardaron en la BD:
  ```bash
  python verificar_fechas.py
  ```

### Error: "Cannot GET /api/universidades"
- Backend no está corriendo
- Ejecuta: `cd back && npm start`

## Variables de Entorno (.env)

Asegúrate de tener estas variables configuradas en la raíz del proyecto:

```env
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tesis_bienestar

# Para el backend
PORT=5000

# Para Groq API (análisis de narrativas)
GROQ_API_KEY=tu_clave_groq
```

## Acceso al Dashboard

Una vez todo esté ejecutándose:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Características

✅ Pestañas por universidad (UPS, UCACUE, UDA, UCUENCA)
✅ Gráficos circulares (pie charts) para:
  - Nivel de riesgo (Crítico, Alto, Medio, Bajo)
  - Emoción principal (Miedo, Tristeza, Ansiedad, etc)
  - Factor de estrés (Académico, Económico, Familiar, Social)
  - Fuente de datos (TikTok, Instagram, Facebook)
✅ Estadísticas generales por universidad
✅ Interfaz responsive y moderna
✅ Carga en tiempo real desde la BD

## Desarrollo

### Agregar nuevos gráficos

Modifica `UniversidadTabs.tsx` y añade nuevas rutas en `back/server.js`

### Personalizar colores

Edita los diccionarios `COLORS_*` en `UniversidadTabs.tsx`

### Cambiar puerto del backend

Modifica `back/server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Cambiar a otro puerto
```

Y actualiza la configuración en `front/vite.config.ts`

## Mantenimiento

Ejecuta diariamente para mantener datos frescos:

```bash
cd scraper
python limpiar_narrativas_antiguas.py  # Elimina datos > 4 semanas
```

## Soporte

Para más información sobre el scraping y procesamiento de datos, ver:
- `scraper/README.md`
- `scraper/master_scraper_refactored.py` (documentación inline)
