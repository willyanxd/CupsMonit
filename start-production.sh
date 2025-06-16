#!/bin/bash
echo "🚀 Iniciando CUPS Log Analyzer em modo produção..."

# Obter IP da máquina
LOCAL_IP=$(hostname -I | awk '{print $1}')

# Build do frontend
echo "🔨 Construindo frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro ao construir frontend"
    exit 1
fi

echo "📊 Servidor será acessível em:"
echo "   - Local: http://localhost:3001"
echo "   - Rede: http://$LOCAL_IP:3001"
echo ""

# Iniciar backend com servir arquivos estáticos
echo "🚀 Iniciando servidor..."
npm run server
