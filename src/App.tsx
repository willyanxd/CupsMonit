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
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'printers', label: 'Impressoras', icon: Printer },
    { id: 'jobs', label: 'Histórico', icon: FileText },
    { id: 'costs', label: 'Custos', icon: DollarSign },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CUPS Log Analyzer</h1>
                <p className="text-sm text-gray-500">Monitor de Impressão em Tempo Real</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date Filter */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{getDateRangeText()}</span>
                </button>
                {(dateRange.startDate || dateRange.endDate) && (
                  <button
                    onClick={clearDateFilter}
                    className="px-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    title="Limpar filtro de data"
                  >
                    ✕
                  </button>
                )}
              </div>

              {stats && (
                <div className="text-sm text-gray-600">
                  Última atualização: {new Date(stats.lastUpdate).toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={fetchStats}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erro de Conexão
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Não foi possível conectar ao servidor backend.</p>
                  <p className="mt-1">
                    <strong>Possíveis soluções:</strong>
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Verifique se o backend está rodando na porta 3001</li>
                    <li>Execute <code className="bg-red-100 px-1 rounded">./start-dev.sh</code> para iniciar os serviços</li>
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
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Impressões</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPrints.toLocaleString()}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Impressoras</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPrinters}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Printer className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Jobs Processados</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
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
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      {(stats || error) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200 bg-white rounded-t-xl">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          <div className="bg-white rounded-b-xl shadow-sm border border-gray-200 border-t-0">
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