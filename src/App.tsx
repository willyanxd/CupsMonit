import React, { useState, useEffect } from 'react';
import { Printer, Users, FileText, BarChart3, Activity, RefreshCw, DollarSign, Calendar } from 'lucide-react';
import Dashboard from './components/Dashboard';
import UserStats from './components/UserStats';
import PrinterStats from './components/PrinterStats';
import JobHistory from './components/JobHistory';
import CostAnalysis from './components/CostAnalysis';
import DateFilter from './components/DateFilter';

interface AppStats {
  totalPrints: number;
  totalUsers: number;
  totalPrinters: number;
  totalJobs: number;
  lastUpdate: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

// Get the correct API base URL based on current protocol
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Always use HTTP for backend connection
  return `http://${hostname}:3001`;
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [showDateFilter, setShowDateFilter] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const params = new URLSearchParams();
      
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await fetch(`${apiBaseUrl}/api/stats?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, [dateRange]);

  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  const clearDateFilter = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-neon-blue' },
    { id: 'users', label: 'Usuários', icon: Users, color: 'text-neon-green' },
    { id: 'printers', label: 'Impressoras', icon: Printer, color: 'text-neon-purple' },
    { id: 'jobs', label: 'Histórico', icon: FileText, color: 'text-neon-cyan' },
    { id: 'costs', label: 'Custos', icon: DollarSign, color: 'text-neon-yellow' },
  ];

  const getDateRangeText = () => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return 'Todo o período';
    }
    if (dateRange.startDate && dateRange.endDate) {
      return `${new Date(dateRange.startDate).toLocaleDateString('pt-BR')} - ${new Date(dateRange.endDate).toLocaleDateString('pt-BR')}`;
    }
    if (dateRange.startDate) {
      return `Desde ${new Date(dateRange.startDate).toLocaleDateString('pt-BR')}`;
    }
    if (dateRange.endDate) {
      return `Até ${new Date(dateRange.endDate).toLocaleDateString('pt-BR')}`;
    }
    return 'Todo o período';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-dark-800 to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-dark-800 to-dark-700 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-neon-blue to-neon-green p-2 rounded-lg animate-pulse-neon">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CUPS Log Analyzer</h1>
                <p className="text-sm text-neon-green">Monitor de Impressão em Tempo Real</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date Filter */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 bg-dark-700 border border-gray-600 rounded-lg hover:bg-dark-600 hover:border-neon-blue hover:text-neon-blue transition-all duration-300"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{getDateRangeText()}</span>
                </button>
                {(dateRange.startDate || dateRange.endDate) && (
                  <button
                    onClick={clearDateFilter}
                    className="px-2 py-2 text-sm text-gray-400 hover:text-neon-red transition-colors"
                    title="Limpar filtro de data"
                  >
                    ✕
                  </button>
                )}
              </div>

              {stats && (
                <div className="text-sm text-gray-400">
                  Última atualização: {new Date(stats.lastUpdate).toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={fetchStats}
                className="p-2 text-gray-400 hover:text-neon-green transition-colors"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-neon-blue' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Date Filter Modal */}
      {showDateFilter && (
        <DateFilter
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          onClose={() => setShowDateFilter(false)}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 neon-border text-red-400">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-300">
                  Erro de Conexão
                </h3>
                <div className="mt-2 text-sm text-red-200">
                  <p>Não foi possível conectar ao servidor backend.</p>
                  <p className="mt-1">
                    <strong>Possíveis soluções:</strong>
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Verifique se o backend está rodando na porta 3001</li>
                    <li>Execute <code className="bg-red-800 px-1 rounded">./start-dev.sh</code> para iniciar os serviços</li>
                    <li>Verifique se o firewall está liberando a porta 3001</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-dark-700 to-dark-800 rounded-xl shadow-lg p-6 border border-gray-600 hover:border-neon-blue transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total de Impressões</p>
                  <p className="text-3xl font-bold text-white group-hover:text-neon-blue transition-colors">
                    {stats.totalPrints.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-neon-blue p-3 rounded-lg group-hover:shadow-neon group-hover:shadow-blue-500/50 transition-all duration-300">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-dark-700 to-dark-800 rounded-xl shadow-lg p-6 border border-gray-600 hover:border-neon-green transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Usuários Ativos</p>
                  <p className="text-3xl font-bold text-white group-hover:text-neon-green transition-colors">
                    {stats.totalUsers}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-neon-green p-3 rounded-lg group-hover:shadow-neon group-hover:shadow-green-500/50 transition-all duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-dark-700 to-dark-800 rounded-xl shadow-lg p-6 border border-gray-600 hover:border-neon-purple transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Impressoras</p>
                  <p className="text-3xl font-bold text-white group-hover:text-neon-purple transition-colors">
                    {stats.totalPrinters}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-neon-purple p-3 rounded-lg group-hover:shadow-neon group-hover:shadow-purple-500/50 transition-all duration-300">
                  <Printer className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-dark-700 to-dark-800 rounded-xl shadow-lg p-6 border border-gray-600 hover:border-neon-yellow transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Jobs Processados</p>
                  <p className="text-3xl font-bold text-white group-hover:text-neon-yellow transition-colors">
                    {stats.totalJobs}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-neon-yellow p-3 rounded-lg group-hover:shadow-neon group-hover:shadow-orange-500/50 transition-all duration-300">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !stats && !error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-neon-blue animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando dados...</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      {(stats || error) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-700 bg-gradient-to-r from-dark-800 to-dark-700 rounded-t-xl">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.id
                        ? `border-current ${tab.color} shadow-neon-sm`
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-gradient-to-br from-dark-800 to-dark-700 rounded-b-xl shadow-lg border border-gray-700 border-t-0">
            {activeTab === 'dashboard' && <Dashboard dateRange={dateRange} />}
            {activeTab === 'users' && <UserStats dateRange={dateRange} />}
            {activeTab === 'printers' && <PrinterStats dateRange={dateRange} />}
            {activeTab === 'jobs' && <JobHistory dateRange={dateRange} />}
            {activeTab === 'costs' && <CostAnalysis dateRange={dateRange} />}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;