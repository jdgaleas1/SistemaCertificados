#!/bin/bash

# Script para migrar imágenes de plantillas al volumen persistente
echo "🔄 Migrando imágenes de plantillas al volumen persistente..."

# Detener el servicio de certificados
echo "⏹️ Deteniendo servicio de certificados..."
docker-compose stop certificados-service

# Crear el directorio de backup si no existe
mkdir -p ./backup-uploads

# Copiar imágenes existentes al directorio de backup
echo "📁 Copiando imágenes existentes..."
docker cp $(docker-compose ps -q certificados-service):/app/uploads ./backup-uploads/ 2>/dev/null || echo "No hay imágenes existentes para migrar"

# Reconstruir el servicio con el nuevo volumen
echo "🔨 Reconstruyendo servicio con volumen persistente..."
docker-compose build certificados-service
docker-compose up -d certificados-service

# Esperar a que el servicio esté listo
echo "⏳ Esperando a que el servicio esté listo..."
sleep 10

# Restaurar imágenes si existen
if [ -d "./backup-uploads/uploads" ]; then
    echo "📤 Restaurando imágenes..."
    docker cp ./backup-uploads/uploads/. $(docker-compose ps -q certificados-service):/app/uploads/
    echo "✅ Imágenes restauradas"
else
    echo "ℹ️ No hay imágenes para restaurar"
fi

# Limpiar backup
rm -rf ./backup-uploads

echo "✅ Migración completada!"
echo "📋 Las imágenes ahora se guardan en un volumen persistente"
echo "🔄 Reinicia el servicio con: docker-compose restart certificados-service"
