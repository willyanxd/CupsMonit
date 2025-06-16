import React, { useState, useEffect } from 'react';
import { Printer, Users, FileText, Activity, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface PrinterStatsProps {
  dateRange: DateRange;
}

interface PrinterData {
  name: string;
  totalPrints: number;
  jobs: number;
  users: string[];
}

// Get the correct API base URL based on current protocol
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Always use HTTP for backend connection
  return `http://${hostname}:3001`;
};

const PrinterStats: React.FC<PrinterStatsProps> = ({ dateRange }) => {
  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrinters();
  }, [dateRange]);

  const fetchPrinters = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const params = new URLSearchParams();
      
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await fetch(`${apiBaseUrl}/api/printers?${params}`);
      const data = await response.json();
      setPrinters(data);
    } catch (error) {
      console.error('Erro ao buscar impressoras:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPrinters = () => {
    const apiBaseUrl = getApiBaseUrl();
    const params = new URLSearchParams();
    
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    const url = `${apiBaseUrl}/api/export/printers?${params}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate usage levels based on total prints distribution
  const getUsageLevel = (totalPrints: number) => {
    if (printers.length === 0) return 'low';
    
    const totalPrintsArray = printers.map(p => p.totalPrints).sort((a, b) => b - a);
    const maxPrints = totalPrintsArray[0] || 0;
    const avgPrints = totalPrintsArray.reduce((sum, prints) => sum + prints, 0) / totalPrintsArray.length;
    
    // High usage: above 75% of max or above 150% of average
    if (totalPrints >= maxPrints * 0.75 || totalPrints >= avgPrints * 1.5) {
      return 'high';
    }
    // Medium usage: above 40% of max or above 75% of average
    if (totalPrints >= maxPrints * 0.4 || totalPrints >= avgPrints * 0.75) {
      return 'medium';
    }
    // Low usage: everything else
    return 'low';
  };

  const getStatusConfig = (level: string) => {
    switch (level) {
      case 'high':
        return {
          color: 'text-neon-green bg-green-900/30 border-neon-green',
          icon: TrendingUp,
          text: 'Alta Utilização',
          glowColor: 'shadow-green-500/50'
        };
      case 'medium':
        return {
          color: 'text-neon-yellow bg-yellow-900/30 border-neon-yellow',
          icon: Minus,
          text: 'Média Utilização',
          glowColor: 'shadow-yellow-500/50'
        };
      default:
        return {
          color: 'text-neon-red bg-red-900/30 border-neon-red',
          icon: TrendingDown,
          text: 'Baixa Utilização',
          glowColor: 'shadow-red-500/50'
        };
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Estatísticas por Impressora</h2>
          <p className="text-gray-400">Monitoramento de uso e performance das impressoras</p>
        </div>
        <button
          onClick={downloadPrinters}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-neon-purple text-white rounded-lg hover:shadow-neon hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Impressoras</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {printers.map((printer) => {
          const usageLevel = getUsageLevel(printer.totalPrints);
          const statusConfig = getStatusConfig(usageLevel);
          const StatusIcon = statusConfig.icon;
          const maxPrints = Math.max(...printers.map(p => p.totalPrints));
          const utilizationPercentage = maxPrints > 0 ? (printer.totalPrints / maxPrints) * 100 : 0;

          return (
            <div 
              key={printer.name} 
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-xl p-6 hover:shadow-lg hover:border-neon-purple transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-600 to-neon-purple p-2 rounded-lg shadow-neon shadow-purple-500/50">
                    <Printer className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{printer.name}</h3>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig.text}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="text-2xl font-bold text-neon-blue">{printer.totalPrints}</div>
                    <div className="text-sm text-gray-400">Impressões</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="text-2xl font-bold text-neon-green">{printer.jobs}</div>
                    <div className="text-sm text-gray-400">Jobs</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Usuários Únicos</span>
                  </div>
                  <span className="font-semibold text-neon-cyan">{printer.users.length}</span>
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Usuários mais ativos:</p>
                  <div className="flex flex-wrap gap-1">
                    {printer.users.slice(0, 5).map((user) => (
                      <span
                        key={user}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-900/30 text-neon-purple border border-purple-500/30"
                      >
                        {user}
                      </span>
                    ))}
                    {printer.users.length > 5 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-700/50 text-gray-400 border border-gray-600">
                        +{printer.users.length - 5} mais
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Utilização relativa</span>
                    <span>{utilizationPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        usageLevel === 'high' ? 'bg-gradient-to-r from-green-500 to-neon-green shadow-neon shadow-green-500/50' :
                        usageLevel === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-neon-yellow shadow-neon shadow-yellow-500/50' :
                        'bg-gradient-to-r from-red-500 to-neon-red shadow-neon shadow-red-500/50'
                      }`}
                      style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                    <div>
                      <span className="text-gray-500">Média por job:</span>
                      <div className="text-white font-semibold">
                        {(printer.totalPrints / printer.jobs).toFixed(1)} páginas
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Eficiência:</span>
                      <div className={`font-semibold ${
                        usageLevel === 'high' ? 'text-neon-green' :
                        usageLevel === 'medium' ? 'text-neon-yellow' :
                        'text-neon-red'
                      }`}>
                        {usageLevel === 'high' ? 'Excelente' :
                         usageLevel === 'medium' ? 'Boa' : 'Baixa'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {printers.length === 0 && (
        <div className="text-center py-12">
          <Printer className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhuma impressora encontrada</h3>
          <p className="text-gray-400">Não há dados de impressoras para exibir no momento.</p>
        </div>
      )}
    </div>
  );
};

export default PrinterStats;