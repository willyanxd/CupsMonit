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

  const NEON_COLORS = ['#00ff88', '#00d4ff', '#b347ff', '#ff47b3', '#ffff00', '#ff8800', '#ff4747', '#47ffff'];

  // Custom tooltip for dark theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom label for pie charts
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="p-6 space-y-8">
      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { type: 'complete', label: 'Relatório Completo', color: 'from-blue-600 to-neon-blue' },
          { type: 'daily', label: 'Relatório Diário', color: 'from-green-600 to-neon-green' },
          { type: 'hourly', label: 'Relatório por Hora', color: 'from-purple-600 to-neon-purple' },
          { type: 'users', label: 'Relatório de Usuários', color: 'from-orange-600 to-neon-orange' },
          { type: 'printers', label: 'Relatório de Impressoras', color: 'from-red-600 to-neon-red' },
          { type: 'costs', label: 'Relatório de Custos', color: 'from-indigo-600 to-neon-cyan' },
        ].map((btn) => (
          <button
            key={btn.type}
            onClick={() => downloadReport(btn.type)}
            className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${btn.color} text-white rounded-lg hover:shadow-neon transition-all duration-300 transform hover:scale-105`}
          >
            <Download className="w-4 h-4" />
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Daily Prints Chart */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600 hover:border-neon-blue transition-all duration-300">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <div className="w-3 h-3 bg-neon-blue rounded-full mr-2 animate-pulse"></div>
            Impressões por Dia
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  stroke="#6B7280"
                />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#6B7280" />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="prints" 
                  stroke="#00d4ff" 
                  strokeWidth={3}
                  name="Impressões"
                  dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#00d4ff', strokeWidth: 2, fill: '#00d4ff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600 hover:border-neon-green transition-all duration-300">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <div className="w-3 h-3 bg-neon-green rounded-full mr-2 animate-pulse"></div>
            Distribuição por Hora
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  tickFormatter={(value) => `${value}h`}
                  stroke="#6B7280"
                />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#6B7280" />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="prints" 
                  fill="url(#greenGradient)" 
                  radius={[4, 4, 0, 0]}
                  name="Impressões"
                />
                <defs>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff88" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users Pie Chart */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600 hover:border-neon-purple transition-all duration-300">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <div className="w-3 h-3 bg-neon-purple rounded-full mr-2 animate-pulse"></div>
            Top Usuários
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topUsers}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="totalPrints"
                  stroke="#1f2937"
                  strokeWidth={2}
                >
                  {topUsers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Printers Bar Chart */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600 hover:border-neon-yellow transition-all duration-300">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <div className="w-3 h-3 bg-neon-yellow rounded-full mr-2 animate-pulse"></div>
            Impressoras Mais Utilizadas
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPrinters} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#6B7280" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  width={120}
                  stroke="#6B7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="totalPrints" 
                  fill="url(#yellowGradient)" 
                  radius={[0, 4, 4, 0]}
                  name="Impressões"
                />
                <defs>
                  <linearGradient id="yellowGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffff00" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users Summary */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">Resumo de Usuários</h3>
          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Usuário</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">Impressões</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">Jobs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {topUsers.map((user, index) => (
                  <tr key={user.name} className="hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-neon-sm"
                          style={{ backgroundColor: NEON_COLORS[index % NEON_COLORS.length] }}
                        />
                        <span className="font-medium text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-right text-gray-300">{user.totalPrints}</td>
                    <td className="py-3 text-sm text-right text-gray-300">{user.jobs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printers Summary */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">Resumo de Impressoras</h3>
          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 text-sm font-medium text-gray-400">Impressora</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">Impressões</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-400">Usuários</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {topPrinters.map((printer, index) => (
                  <tr key={printer.name} className="hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-neon-sm"
                          style={{ backgroundColor: NEON_COLORS[index % NEON_COLORS.length] }}
                        />
                        <span className="font-medium text-white">{printer.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-right text-gray-300">{printer.totalPrints}</td>
                    <td className="py-3 text-sm text-right text-gray-300">{printer.users.length}</td>
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