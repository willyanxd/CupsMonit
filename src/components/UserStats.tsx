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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Estatísticas por Usuário</h2>
          <p className="text-gray-400">Visualize o uso de impressão por usuário do sistema</p>
        </div>
        <button
          onClick={downloadUsers}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-neon-green text-white rounded-lg hover:shadow-neon hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Usuários</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => {
          const maxPrints = Math.max(...users.map(u => u.totalPrints));
          const utilizationPercentage = maxPrints > 0 ? (user.totalPrints / maxPrints) * 100 : 0;
          const totalPrints = users.reduce((sum, u) => sum + u.totalPrints, 0);
          const userPercentage = totalPrints > 0 ? (user.totalPrints / totalPrints) * 100 : 0;

          return (
            <div 
              key={user.name} 
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-xl p-6 hover:shadow-lg hover:border-neon-green transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-green-600 to-neon-green p-2 rounded-lg shadow-neon shadow-green-500/50">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{user.name}</h3>
                  <p className="text-sm text-gray-400">Usuário do sistema</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Total de Impressões</span>
                  </div>
                  <span className="font-bold text-lg text-neon-blue">{user.totalPrints}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Jobs Enviados</span>
                  </div>
                  <span className="font-semibold text-neon-cyan">{user.jobs}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Printer className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Impressoras Utilizadas</span>
                  </div>
                  <span className="font-semibold text-neon-purple">{user.printers.length}</span>
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Impressoras:</p>
                  <div className="flex flex-wrap gap-1">
                    {user.printers.map((printer) => (
                      <span
                        key={printer}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600"
                      >
                        {printer}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Utilização relativa</span>
                    <span>{utilizationPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-neon-green h-3 rounded-full transition-all duration-1000 shadow-neon shadow-green-500/50"
                      style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">% do total:</span>
                      <div className="text-neon-green font-semibold">
                        {userPercentage.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Média por job:</span>
                      <div className="text-neon-blue font-semibold">
                        {(user.totalPrints / user.jobs).toFixed(1)} páginas
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-400">Não há dados de usuários para exibir no momento.</p>
        </div>
      )}
    </div>
  );
};

export default UserStats;