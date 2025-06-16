#!/bin/bash
echo "🚀 Iniciando CUPS Log Analyzer em modo desenvolvimento..."
echo ""

# Obter IP da máquina
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "📊 Serviços serão iniciados em:"
echo "   Backend: http://$LOCAL_IP:3001"
echo "   Frontend: http://$LOCAL_IP:5173"
echo ""
echo "🌐 Acessível na rede local!"
echo ""

# Função para cleanup
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap para cleanup quando o script for interrompido
trap cleanup SIGINT SIGTERM

# Iniciar backend em background
npm run server &
BACKEND_PID=$!

# Esperar mais tempo para o backend inicializar completamente
echo "⏳ Aguardando backend inicializar..."
sleep 10

# Iniciar frontend
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo "✅ Serviços iniciados!"
echo "📊 Dashboard: http://$LOCAL_IP:5173"
echo "🔌 API: http://$LOCAL_IP:3001"
echo ""
echo "Pressione Ctrl+C para parar os serviços"

# Aguardar
wait
