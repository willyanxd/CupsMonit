#!/bin/bash

# Script de instalação do CUPS Log Analyzer
echo "🚀 CUPS Log Analyzer - Script de Instalação"
echo "=========================================="

# Função para detectar distribuição Linux
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo $ID
    elif type lsb_release >/dev/null 2>&1; then
        lsb_release -si | tr '[:upper:]' '[:lower:]'
    elif [ -f /etc/lsb-release ]; then
        . /etc/lsb-release
        echo $DISTRIB_ID | tr '[:upper:]' '[:lower:]'
    elif [ -f /etc/debian_version ]; then
        echo "debian"
    elif [ -f /etc/redhat-release ]; then
        echo "rhel"
    else
        echo "unknown"
    fi
}

# Função para instalar Node.js
install_nodejs() {
    local distro=$(detect_distro)
    echo "📦 Instalando Node.js..."
    
    case $distro in
        ubuntu|debian)
            # Atualizar repositórios
            apt-get update
            
            # Instalar curl se não estiver instalado
            if ! command -v curl &> /dev/null; then
                echo "📥 Instalando curl..."
                apt-get install -y curl
            fi
            
            # Instalar Node.js 18.x LTS
            echo "📥 Adicionando repositório NodeSource..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
            ;;
            
        centos|rhel|fedora)
            # Instalar curl se não estiver instalado
            if ! command -v curl &> /dev/null; then
                echo "📥 Instalando curl..."
                if command -v dnf &> /dev/null; then
                    dnf install -y curl
                else
                    yum install -y curl
                fi
            fi
            
            # Instalar Node.js 18.x LTS
            echo "📥 Adicionando repositório NodeSource..."
            curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
            if command -v dnf &> /dev/null; then
                dnf install -y nodejs
            else
                yum install -y nodejs
            fi
            ;;
            
        arch)
            pacman -Sy --noconfirm nodejs npm
            ;;
            
        opensuse*)
            zypper install -y nodejs18 npm18
            ;;
            
        *)
            echo "❌ Distribuição não suportada: $distro"
            echo "   Por favor, instale Node.js 16+ manualmente"
            echo "   Visite: https://nodejs.org/"
            exit 1
            ;;
    esac
}

# Função para instalar CUPS
install_cups() {
    local distro=$(detect_distro)
    echo "🖨️  Instalando CUPS..."
    
    case $distro in
        ubuntu|debian)
            apt-get install -y cups cups-client
            ;;
        centos|rhel|fedora)
            if command -v dnf &> /dev/null; then
                dnf install -y cups cups-client
            else
                yum install -y cups cups-client
            fi
            ;;
        arch)
            pacman -Sy --noconfirm cups
            ;;
        opensuse*)
            zypper install -y cups
            ;;
        *)
            echo "⚠️  Não foi possível instalar CUPS automaticamente"
            echo "   Por favor, instale CUPS manualmente"
            ;;
    esac
}

# Verificar se está rodando como root para instalação de sistema
if [[ $EUID -eq 0 ]]; then
    echo "🔧 Executando como root - instalando dependências do sistema..."
    
    # Verificar se o Node.js está instalado
    if ! command -v node &> /dev/null; then
        echo "📦 Node.js não encontrado, instalando..."
        install_nodejs
    else
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 16 ]; then
            echo "📦 Node.js versão $NODE_VERSION é muito antiga, atualizando..."
            install_nodejs
        else
            echo "✅ Node.js $(node --version) já instalado"
        fi
    fi
    
    # Verificar se o CUPS está instalado
    if ! command -v cupsd &> /dev/null; then
        echo "🖨️  CUPS não encontrado, instalando..."
        install_cups
    else
        echo "✅ CUPS já instalado"
    fi
    
    # Configurar permissões do log do CUPS
    CUPS_LOG="/var/log/cups/page_log"
    if [ -f "$CUPS_LOG" ]; then
        echo "🔐 Configurando permissões do log do CUPS..."
        chmod +r "$CUPS_LOG"
        echo "✅ Permissões configuradas"
    else
        echo "⚠️  Arquivo de log do CUPS não encontrado"
        echo "   Será criado automaticamente quando houver impressões"
    fi
    
    # Iniciar e habilitar CUPS
    echo "🚀 Iniciando serviço CUPS..."
    systemctl start cups
    systemctl enable cups
    echo "✅ CUPS configurado e iniciado"
    
    # Configurar firewall se necessário
    if command -v ufw &> /dev/null; then
        echo "🔥 Configurando firewall (UFW)..."
        ufw allow 3001/tcp
        ufw allow 5173/tcp
        echo "✅ Portas liberadas no firewall"
    elif command -v firewall-cmd &> /dev/null; then
        echo "🔥 Configurando firewall (firewalld)..."
        firewall-cmd --permanent --add-port=3001/tcp
        firewall-cmd --permanent --add-port=5173/tcp
        firewall-cmd --reload
        echo "✅ Portas liberadas no firewall"
    fi
    
#    echo ""
 #   echo "✅ Instalação do sistema concluída!"
  #  echo "   Agora execute este script novamente como usuário normal para configurar a aplicação"
   # echo ""
   # exit 0
fi

# Verificar se o Node.js está instalado (execução como usuário normal)
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado."
    echo "   Execute este script como root primeiro: sudo ./install.sh"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js versão 16 ou superior é necessário. Versão atual: $(node --version)"
    echo "   Execute este script como root para atualizar: sudo ./install.sh"
    exit 1
fi

echo "✅ Node.js $(node --version) encontrado"

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado"
    exit 1
fi

echo "✅ npm $(npm --version) encontrado"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✅ Dependências instaladas com sucesso"

# Criar diretório de logs se não existir
echo "📁 Verificando diretórios..."
mkdir -p logs

# Verificar permissões do arquivo de log do CUPS
CUPS_LOG="/var/log/cups/page_log"
if [ -f "$CUPS_LOG" ]; then
    if [ -r "$CUPS_LOG" ]; then
        echo "✅ Arquivo de log do CUPS encontrado e acessível: $CUPS_LOG"
    else
        echo "⚠️  Arquivo de log do CUPS encontrado mas sem permissão de leitura: $CUPS_LOG"
        echo "   Para resolver, execute: sudo chmod +r $CUPS_LOG"
        echo "   Ou execute este script como root: sudo ./install.sh"
    fi
else
    echo "⚠️  Arquivo de log do CUPS não encontrado: $CUPS_LOG"
    echo "   O sistema funcionará com dados de exemplo"
    
    # Criar arquivo de exemplo
    echo "📝 Criando arquivo de log de exemplo..."
    cat > sample_cups.log << 'EOF'
HP-LaserJet admin 1 [01/Jan/2024:09:15:32 +0000] 1 1 - localhost documento1.pdf na_letter_8.5x11in one-sided
HP-LaserJet admin 1 [01/Jan/2024:09:15:32 +0000] 2 1 - localhost documento1.pdf na_letter_8.5x11in one-sided
Canon-Pixma user1 2 [01/Jan/2024:10:30:15 +0000] 1 2 - localhost relatorio.docx na_letter_8.5x11in one-sided
HP-LaserJet user2 3 [01/Jan/2024:11:45:20 +0000] 1 1 - localhost apresentacao.pptx na_letter_8.5x11in one-sided
Canon-Pixma guest 4 [01/Jan/2024:14:20:45 +0000] 1 3 - localhost foto.jpg 4x6in one-sided
HP-LaserJet admin 5 [01/Jan/2024:15:30:10 +0000] 1 1 - localhost manual.pdf na_letter_8.5x11in duplex
Canon-Pixma user1 6 [02/Jan/2024:08:30:15 +0000] 1 1 - localhost planilha.xlsx na_letter_8.5x11in one-sided
HP-LaserJet user2 7 [02/Jan/2024:09:45:20 +0000] 1 2 - localhost contrato.pdf na_letter_8.5x11in duplex
Canon-Pixma admin 8 [02/Jan/2024:11:20:45 +0000] 1 1 - localhost imagem.png 4x6in one-sided
HP-LaserJet guest 9 [02/Jan/2024:14:30:10 +0000] 1 1 - localhost texto.txt na_letter_8.5x11in one-sided
EOF
fi

# Criar script de inicialização
echo "📝 Criando scripts de inicialização..."

# Script para iniciar o backend
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando servidor backend..."
echo "📊 Servidor será acessível em:"
echo "   - Local: http://localhost:3001"
echo "   - Rede: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
npm run server
EOF

# Script para iniciar o frontend
cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando servidor frontend..."
echo "📊 Dashboard será acessível em:"
echo "   - Local: http://localhost:5173"
echo "   - Rede: http://$(hostname -I | awk '{print $1}'):5173"
echo ""
npm run dev -- --host 0.0.0.0
EOF

# Script para iniciar ambos (desenvolvimento)
cat > start-dev.sh << 'EOF'
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
EOF

# Script de produção
cat > start-production.sh << 'EOF'
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
EOF

# Tornar scripts executáveis
chmod +x start-backend.sh start-frontend.sh start-dev.sh start-production.sh

# Criar arquivo de configuração
cat > config.json << 'EOF'
{
  "server": {
    "port": 3001,
    "host": "0.0.0.0"
  },
  "cups": {
    "logPath": "/var/log/cups/page_log",
    "watchInterval": 1000
  },
  "database": {
    "type": "memory"
  },
  "features": {
    "realTimeUpdates": true,
    "historyRetention": 30,
    "csvExport": true,
    "networkAccess": true
  }
}
EOF

# Obter IP da máquina
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo "======================================"
echo ""
echo "📋 Comandos disponíveis:"
echo "  ./start-dev.sh         - Iniciar em modo desenvolvimento"
echo "  ./start-production.sh  - Iniciar em modo produção"
echo "  ./start-backend.sh     - Iniciar apenas backend"
echo "  ./start-frontend.sh    - Iniciar apenas frontend"
echo ""
echo "🌐 URLs do sistema:"
echo "  Local:"
echo "    Dashboard: http://localhost:5173"
echo "    API: http://localhost:3001"
echo ""
echo "  Rede Local:"
echo "    Dashboard: http://$LOCAL_IP:5173"
echo "    API: http://$LOCAL_IP:3001"
echo ""
echo "📁 Arquivos importantes:"
echo "  config.json - Configurações do sistema"
echo "  sample_cups.log - Log de exemplo (se necessário)"
echo ""
echo "📊 Funcionalidades:"
echo "  ✅ Dashboard em tempo real"
echo "  ✅ Estatísticas por usuário e impressora"
echo "  ✅ Histórico completo de jobs"
echo "  ✅ Export para CSV"
echo "  ✅ Acesso via rede local"
echo ""
echo "🚀 Para começar, execute: ./start-dev.sh"
echo ""

# Verificar se o CUPS está rodando
if systemctl is-active --quiet cups 2>/dev/null; then
    echo "✅ Serviço CUPS está ativo"
else
    echo "⚠️  Serviço CUPS não está ativo. Para ativar:"
    echo "   sudo systemctl start cups"
    echo "   sudo systemctl enable cups"
fi

echo ""
echo "📖 Documentação adicional:"
echo "   - O sistema monitora automaticamente o arquivo de log do CUPS"
echo "   - Dados são atualizados em tempo real quando houver impressões"
echo "   - Para permissões do log: sudo chmod +r /var/log/cups/page_log"
echo "   - Para instalação completa: sudo ./install.sh"
echo ""
echo "🔧 Solução de problemas:"
echo "   - Se não conseguir acessar via rede, verifique o firewall"
echo "   - Para liberar portas: sudo ufw allow 3001 && sudo ufw allow 5173"
echo "   - Para CentOS/RHEL: sudo firewall-cmd --add-port=3001/tcp --permanent"
echo ""
