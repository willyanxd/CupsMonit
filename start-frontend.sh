#!/bin/bash
echo "🚀 Iniciando servidor frontend..."
echo "📊 Dashboard será acessível em:"
echo "   - Local: http://localhost:5173"
echo "   - Rede: http://$(hostname -I | awk '{print $1}'):5173"
echo ""
npm run dev -- --host 0.0.0.0
