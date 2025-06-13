import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DashboardProps {
  dateRange: DateRange;
}

interface DailyStats {
  date: string;
  prints: number;
  jobs: number;
}

interface HourlyStats {
  hour: number;
  prints: number;
  jobs: number;
}

// Get the correct API base URL based on current protocol
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Always use HTTP for backend connection
  return `http://${hostname}:3001`;
};

const Dashboard: React.FC<DashboardProps> = ({ dateRange }) => {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [topPrinters, setTopPrinters] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const params = new URLSearchParams();
      
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const [dailyRes, hourlyRes, usersRes, printersRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/daily-stats?${params}`),
        fetch(`${apiBaseUrl}/api/hourly-stats?${params}`),
        fetch(`${apiBaseUrl}/api/users?${params}`),
        fetch(`${apiBaseUrl}/api/printers?${params}`)
      ]);

      const [daily, hourly, users, printers] = await Promise.all([
        dailyRes.json(),
        hourlyRes.json(),
        usersRes.json(),
        printersRes.json()
      ]);

      setDailyStats(daily.slice(-30)); // Últimos 30 dias
      setHourlyStats(hourly);
      setTopUsers(users.slice(0, 5));
      setTopPrinters(printers.slice(0, 5));
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const downloadReport = (type: string) => {
    const apiBaseUrl = getApiBaseUrl();
    const params = new URLSearchParams();
    
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    
    const url = `${apiBaseUrl}/api/export/${type}?${params}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="p-6 space-y-8">
      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => downloadReport('complete')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Relatório Completo</span>
        </button>
        <button
          onClick={() => downloadReport('daily')}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Relatório Diário</span>
        </button>
        <button
          onClick={() => downloadReport('hourly')}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Relatório por Hora</span>
        </button>
        <button
          onClick={() => downloadReport('users')}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Relatório de Usuários</span>
        </button>
        <button
          onClick={() => downloadReport('printers')}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Relatório de Impressoras</span>
        </button>
        <button
          onClick={() => downloadReport('costs')}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Relatório de Custos</span>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Prints Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Impressões por Dia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                formatter={(value: number, name: string) => [value, name === 'prints' ? 'Impressões' : 'Jobs']}
              />
              <Line 
                type="monotone" 
                dataKey="prints" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="prints"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Hora</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}h`}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => `${value}:00`}
                formatter={(value: number) => [value, 'Impressões']}
              />
              <Bar dataKey="prints" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Users */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Usuários</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topUsers}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalPrints"
              >
                {topUsers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Printers */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Impressoras Mais Utilizadas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPrinters} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Impressões']}
              />
              <Bar dataKey="totalPrints" fill="#F59E0B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users Summary */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Usuários</h3>
          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Usuário</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">Impressões</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">Jobs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topUsers.map((user, index) => (
                  <tr key={user.name} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-right text-gray-600">{user.totalPrints}</td>
                    <td className="py-3 text-sm text-right text-gray-600">{user.jobs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printers Summary */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Impressoras</h3>
          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Impressora</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">Impressões</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">Usuários</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topPrinters.map((printer, index) => (
                  <tr key={printer.name} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium text-gray-900">{printer.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-right text-gray-600">{printer.totalPrints}</td>
                    <td className="py-3 text-sm text-right text-gray-600">{printer.users.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;