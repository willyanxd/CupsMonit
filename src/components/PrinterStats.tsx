import React, { useState, useEffect } from 'react';
import { Printer, Users, FileText, Activity, Download } from 'lucide-react';

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

  const getStatusColor = (totalPrints: number) => {
    if (totalPrints > 100) return 'text-green-600 bg-green-100';
    if (totalPrints > 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusText = (totalPrints: number) => {
    if (totalPrints > 100) return 'Alta Utilização';
    if (totalPrints > 50) return 'Média Utilização';
    return 'Baixa Utilização';
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Estatísticas por Impressora</h2>
          <p className="text-gray-600">Monitoramento de uso e performance das impressoras</p>
        </div>
        <button
          onClick={downloadPrinters}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Impressoras</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {printers.map((printer) => (
          <div key={printer.name} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Printer className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{printer.name}</h3>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(printer.totalPrints)}`}>
                    <Activity className="w-3 h-3 mr-1" />
                    {getStatusText(printer.totalPrints)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{printer.totalPrints}</div>
                  <div className="text-sm text-gray-600">Impressões</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{printer.jobs}</div>
                  <div className="text-sm text-gray-600">Jobs</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Usuários Únicos</span>
                </div>
                <span className="font-semibold text-gray-700">{printer.users.length}</span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Usuários mais ativos:</p>
                <div className="flex flex-wrap gap-1">
                  {printer.users.slice(0, 5).map((user) => (
                    <span
                      key={user}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800"
                    >
                      {user}
                    </span>
                  ))}
                  {printer.users.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                      +{printer.users.length - 5} mais
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Utilização relativa</span>
                  <span>{((printer.totalPrints / printers.reduce((sum, p) => sum + p.totalPrints, 0)) * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (printer.totalPrints / Math.max(...printers.map(p => p.totalPrints))) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Média: {(printer.totalPrints / printer.jobs).toFixed(1)} páginas por job
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {printers.length === 0 && (
        <div className="text-center py-12">
          <Printer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma impressora encontrada</h3>
          <p className="text-gray-500">Não há dados de impressoras para exibir no momento.</p>
        </div>
      )}
    </div>
  );
};

export default PrinterStats;