import React, { useState, useEffect } from 'react';
import { User, Printer, FileText, Download } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface UserStatsProps {
  dateRange: DateRange;
}

interface UserData {
  name: string;
  totalPrints: number;
  jobs: number;
  printers: string[];
}

// Get the correct API base URL based on current protocol
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Always use HTTP for backend connection
  return `http://${hostname}:3001`;
};

const UserStats: React.FC<UserStatsProps> = ({ dateRange }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [dateRange]);

  const fetchUsers = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const params = new URLSearchParams();
      
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await fetch(`${apiBaseUrl}/api/users?${params}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadUsers = () => {
    const apiBaseUrl = getApiBaseUrl();
    const params = new URLSearchParams();
    
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    const url = `${apiBaseUrl}/api/export/users?${params}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <h2 className="text-2xl font-bold text-gray-900">Estatísticas por Usuário</h2>
          <p className="text-gray-600">Visualize o uso de impressão por usuário do sistema</p>
        </div>
        <button
          onClick={downloadUsers}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Usuários</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.name} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">Usuário do sistema</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Total de Impressões</span>
                </div>
                <span className="font-bold text-lg text-gray-900">{user.totalPrints}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Jobs Enviados</span>
                </div>
                <span className="font-semibold text-gray-700">{user.jobs}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Printer className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Impressoras Utilizadas</span>
                </div>
                <span className="font-semibold text-gray-700">{user.printers.length}</span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Impressoras:</p>
                <div className="flex flex-wrap gap-1">
                  {user.printers.map((printer) => (
                    <span
                      key={printer}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {printer}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (user.totalPrints / Math.max(...users.map(u => u.totalPrints))) * 100)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((user.totalPrints / users.reduce((sum, u) => sum + u.totalPrints, 0)) * 100).toFixed(1)}% do total
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-500">Não há dados de usuários para exibir no momento.</p>
        </div>
      )}
    </div>
  );
};

export default UserStats;