# CUPS Log Analyzer

Sistema completo para análise e monitoramento de logs de impressão do CUPS (Common Unix Printing System) com acesso via rede local e exportação de relatórios.

## 🚀 Características

- **Dashboard em Tempo Real**: Monitoramento ao vivo das impressões
- **Análise por Usuário**: Estatísticas detalhadas de uso por usuário
- **Monitoramento de Impressoras**: Performance e utilização das impressoras
- **Histórico Completo**: Registro detalhado de todos os jobs de impressão
- **Export CSV**: Download de relatórios em formato CSV
- **Acesso via Rede**: Interface acessível por qualquer dispositivo na rede local
- **Interface Moderna**: Design responsivo e intuitivo
- **API RESTful**: Backend robusto com Node.js e Express

## 📊 Funcionalidades

### Dashboard Principal
- Total de impressões, usuários e impressoras
- Gráficos de impressões por dia e por hora
- Top usuários e impressoras mais utilizadas
- Estatísticas em tempo real
- Botões de export para CSV

### Análise de Usuários
- Ranking de usuários por volume de impressão
- Número de jobs enviados por usuário
- Impressoras utilizadas por cada usuário
- Percentual de uso individual
- Export de dados de usuários

### Monitoramento de Impressoras
- Status de utilização das impressoras
- Total de impressões e jobs por impressora
- Usuários que mais utilizam cada impressora
- Média de páginas por job
- Export de dados de impressoras

### Histórico de Jobs
- Lista completa de todas as impressões
- Filtros por usuário e impressora
- Paginação e busca avançada
- Detalhes completos de cada job
- Export de histórico filtrado

### Relatórios CSV
- **Relatório Completo**: Todos os dados em um arquivo
- **Relatório Diário**: Estatísticas por dia
- **Relatório por Hora**: Distribuição horária
- **Relatório de Usuários**: Dados detalhados por usuário
- **Relatório de Impressoras**: Dados detalhados por impressora
- **Histórico de Jobs**: Lista completa com filtros

## 🛠️ Instalação

### Instalação Automática (Recomendada)

#### Como Root (Instala dependências do sistema):
```bash
sudo chmod +x install.sh
sudo ./install.sh
```

#### Como Usuário Normal (Configura aplicação):
```bash
./install.sh
```

### Pré-requisitos
- Sistema Linux (Ubuntu, Debian, CentOS, RHEL, Fedora, Arch, openSUSE)
- Acesso root para instalação de dependências
- CUPS instalado e configurado

### O que a instalação faz:

#### Execução como Root:
- Instala Node.js 18.x LTS automaticamente
- Instala CUPS se não estiver presente
- Configura permissões do arquivo de log
- Inicia e habilita o serviço CUPS
- Configura firewall (UFW/firewalld)
- Libera portas 3001 e 5173

#### Execução como Usuário:
- Instala dependências npm
- Cria scripts de inicialização
- Configura arquivos de exemplo
- Prepara ambiente de desenvolvimento

## 🚀 Como Usar

### Modo Desenvolvimento
```bash
./start-dev.sh
```
- Frontend: http://IP_DA_MAQUINA:5173
- Backend: http://IP_DA_MAQUINA:3001
- Acessível via rede local

### Modo Produção
```bash
./start-production.sh
```

### Apenas Backend
```bash
./start-backend.sh
```

### Apenas Frontend
```bash
./start-frontend.sh
```

## 🌐 Acesso via Rede

O sistema é configurado automaticamente para aceitar conexões de qualquer dispositivo na rede local:

- **Frontend**: `http://IP_DA_MAQUINA:5173`
- **Backend**: `http://IP_DA_MAQUINA:3001`

Para descobrir o IP da máquina:
```bash
hostname -I
```

## 📋 API Endpoints

### Estatísticas Gerais
- `GET /api/stats` - Estatísticas gerais do sistema

### Usuários
- `GET /api/users` - Lista de usuários com estatísticas

### Impressoras
- `GET /api/printers` - Lista de impressoras com estatísticas

### Jobs
- `GET /api/jobs` - Histórico de jobs de impressão
  - Parâmetros: `page`, `limit`, `user`, `printer`

### Estatísticas Temporais
- `GET /api/daily-stats` - Estatísticas por dia
- `GET /api/hourly-stats` - Estatísticas por hora

### Export CSV
- `GET /api/export/complete` - Relatório completo
- `GET /api/export/jobs` - Histórico de jobs
- `GET /api/export/users` - Dados de usuários
- `GET /api/export/printers` - Dados de impressoras
- `GET /api/export/daily` - Estatísticas diárias
- `GET /api/export/hourly` - Estatísticas horárias

## 📁 Estrutura do Projeto

```
cups-log-analyzer/
├── backend/
│   └── server.js              # Servidor Node.js
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx      # Dashboard principal
│   │   ├── UserStats.tsx      # Estatísticas de usuários
│   │   ├── PrinterStats.tsx   # Estatísticas de impressoras
│   │   └── JobHistory.tsx     # Histórico de jobs
│   └── App.tsx                # Componente principal
├── install.sh                 # Script de instalação
├── start-dev.sh              # Script para desenvolvimento
├── start-production.sh       # Script para produção
├── config.json               # Configurações
└── README.md                 # Esta documentação
```

## 🔧 Configuração

### Arquivo de Log do CUPS
O sistema lê o arquivo padrão do CUPS:
```
/var/log/cups/page_log
```

### Permissões
Para garantir acesso ao log:
```bash
sudo chmod +r /var/log/cups/page_log
```

### Firewall
Para liberar portas manualmente:

**Ubuntu/Debian (UFW):**
```bash
sudo ufw allow 3001
sudo ufw allow 5173
```

**CentOS/RHEL/Fedora (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --reload
```

### Formato do Log CUPS
O sistema processa logs no formato padrão do CUPS:
```
printer user job-id date-time page-number num-copies job-billing job-originating-host-name job-name media sides
```

## 🔍 Monitoramento

O sistema monitora automaticamente:
- Mudanças no arquivo de log do CUPS
- Novos jobs de impressão
- Atualizações em tempo real no dashboard

## 📊 Relatórios CSV

### Tipos de Relatórios Disponíveis:

1. **Relatório Completo**: Contém todas as informações em seções organizadas
2. **Jobs**: Lista detalhada de todas as impressões
3. **Usuários**: Estatísticas por usuário
4. **Impressoras**: Estatísticas por impressora
5. **Diário**: Impressões agrupadas por dia
6. **Horário**: Distribuição de impressões por hora

### Formato dos Arquivos:
- Codificação UTF-8 com BOM
- Separador: vírgula (,)
- Campos com aspas quando necessário
- Nome do arquivo inclui data de geração

## 🎨 Interface

### Design System
- **Cores Principais**: Azul (#3B82F6), Verde (#10B981), Laranja (#F59E0B)
- **Layout Responsivo**: Funciona em desktop, tablet e mobile
- **Animações Suaves**: Micro-interações para melhor UX
- **Iconografia**: Lucide React icons

### Componentes
- Cards informativos com gradientes sutis
- Gráficos interativos com Recharts
- Tabelas com paginação e filtros
- Botões de download para CSV
- Estados de loading e empty states

## 🚨 Solução de Problemas

### Log do CUPS não encontrado
```bash
# Verificar se o CUPS está instalado e rodando
sudo systemctl status cups

# Verificar se o arquivo existe
ls -la /var/log/cups/page_log

# Dar permissão de leitura
sudo chmod +r /var/log/cups/page_log
```

### Não consegue acessar via rede
```bash
# Verificar IP da máquina
hostname -I

# Verificar se as portas estão abertas
sudo netstat -tlnp | grep -E ':(3001|5173)'

# Liberar no firewall
sudo ufw allow 3001
sudo ufw allow 5173
```

### Porta em uso
```bash
# Verificar processos na porta 3001
lsof -i :3001

# Matar processo se necessário
kill -9 <PID>
```

### Dependências
```bash
# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Problemas de Permissão
```bash
# Executar instalação como root
sudo ./install.sh

# Verificar permissões do log
ls -la /var/log/cups/page_log

# Corrigir permissões
sudo chmod +r /var/log/cups/page_log
```

## 📈 Dados de Exemplo

Se o arquivo de log do CUPS não estiver disponível, o sistema criará dados de exemplo para demonstração.

## 🔐 Segurança

⚠️ **ATENÇÃO**: Este sistema foi desenvolvido para uso interno e não inclui autenticação. Para uso em produção, considere implementar:
- Autenticação de usuários
- HTTPS
- Controle de acesso baseado em roles
- Rate limiting
- Firewall configurado adequadamente

## 🤝 Contribuição

Para contribuir com o projeto:
1. Faça um fork
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste thoroughly
5. Submeta um pull request

## 📄 Licença

Este projeto é fornecido como está, sem garantias. Use por sua conta e risco.

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs do sistema
2. Consulte esta documentação
3. Verifique as permissões do CUPS
4. Teste com dados de exemplo primeiro
5. Verifique conectividade de rede
6. Confirme configuração do firewall