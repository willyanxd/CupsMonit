#!/bin/bash
echo "🚀 Iniciando servidor backend..."
echo "📊 Servidor será acessível em:"
echo "   - Local: http://localhost:3001"
echo "   - Rede: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
npm run server
