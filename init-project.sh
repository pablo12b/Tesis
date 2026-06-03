#!/bin/bash
# Script de inicialización para el proyecto completo

cd "$(dirname "$0")"

echo "📦 Creando estructura del proyecto..."

# Crear carpetas
mkdir -p front back

# Inicializar backend Express
echo "⚙️  Inicializando backend..."
cd back
npm init -y
npm install express cors dotenv psycopg2-js pg

cat > package.json << 'EOF'
{
  "name": "tesis-api",
  "version": "1.0.0",
  "description": "API para dashboard de narrativas",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "pg": "^8.8.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
EOF

cd ..

# Inicializar frontend React
echo "⚡ Inicializando frontend con Vite..."
npm create vite@latest front -- --template react-ts
cd front
npm install
npm install recharts lucide-react

cd ../..

echo "✅ Estructura creada!"
