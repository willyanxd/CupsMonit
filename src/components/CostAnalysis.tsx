import React, { useState, useEffect } from 'react';
import { DollarSign, Printer, User, Settings, Download, Save, Calculator } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface CostAnalysisProps {
  dateRange: DateRange;
}

interface PrinterCost {
  name: string;
  totalPrints: number;
  totalCost: number;
  costPerPage: number;
  jobs: number;
}

interface UserCost {
  name: string;
  totalPrints: number;
  totalCost: number;
  jobs: number;
  printers: string[];
}

interface CostData {
  totalCost: number;
  totalPrints: number;
  printerCosts: PrinterCost[];
  userCosts: UserCost[];
  period: {
    startDate?: string;
    endDate?: string;
  };
}

interface CostConfig {
  printers: Record<string, { costPerPage: number }>;
  lastUpdate: string;
}

// Get the correct API base URL based on current protocol
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Always use HTTP for backend connection
  return `http://${hostname}:3001`;
};

const CostAnalysis: React.FC<CostAnalysisProps> = ({ dateRange }) => {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [costConfig, setCostConfig] = useState<CostConfig>({ printers: {}, lastUpdate: '' });
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCostData();
    fetchCostConfig();
  }, [dateRange]);

  const fetchCostData = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const params = new URLSearchParams();
      
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await fetch(`${apiBaseUrl}/api/costs/analysis?${params}`);
      const data = await response.json();
      setCostData(data);
    } catch (error) {
      console.error('Erro ao buscar dados de custos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCostConfig = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/costs/config`);
      const data = await response.json();
      setCostConfig(data);
      
      // Inicializar configuração temporária
      const temp: Record<string, number> = {};
      Object.keys(data.printers || {}).forEach(printer => {
        temp[printer] = data.printers[printer].costPerPage || 0;
      });
      setTempConfig(temp);
    } catch (error) {
      console.error('Erro ao buscar configuração de custos:', error);
    }
  };

  const saveCostConfig = async () => {
    setSaving(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const printers: Record<string, { costPerPage: number }> = {};
      
      Object.keys(tempConfig).forEach(printer => {
        printers[printer] = { costPerPage: tempConfig[printer] || 0 };
      });

      await fetch(`${apiBaseUrl}/api/costs/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printers }),
      });

      setCostConfig({ printers, lastUpdate: new Date().toISOString() });
      setShowConfig(false);
      fetchCostData(); // Recarregar dados com novos custos
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    } finally {
      setSaving(false);
    }
  };

  const downloadCosts = () => {
    const apiBaseUrl = getApiBaseUrl();
    const params = new URLSearchParams();
    
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);

    const url = `${apiBaseUrl}/api/export/costs?${params}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrinterCostChange = (printer: string, cost: number) => {
    setTempConfig(prev => ({ ...prev, [printer]: cost }));
  };

  const addNewPrinter = () => {
    const printerName = prompt('Nome da impressora:');
    if (printerName && !tempConfig[printerName]) {
      setTempConfig(prev => ({ ...prev, [printerName]: 0 }));
    }
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
              {`${entry.name}: R$ ${entry.value.toFixed(2)}`}
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

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-yellow"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Análise de Custos</h2>
          <p className="text-gray-400">Controle de gastos com impressão por impressora e usuário</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:shadow-neon hover:shadow-gray-500/50 transition-all duration-300"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar Custos</span>
          </button>
          <button
            onClick={downloadCosts}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-neon-yellow text-black rounded-lg hover:shadow-neon hover:shadow-yellow-500/50 transition-all duration-300 transform hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Custos</span>
          </button>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto border border-gray-600">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Configurar Custos por Impressora</h3>
              <button
                onClick={() => setShowConfig(false)}
                className="text-gray-400 hover:text-neon-red transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {Object.keys(tempConfig).map(printer => (
                <div key={printer} className="flex items-center space-x-4 p-4 border border-gray-600 rounded-lg bg-gray-700/30">
                  <Printer className="w-5 h-5 text-neon-purple" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-white">{printer}</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">R$</span>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={tempConfig[printer]}
                      onChange={(e) => handlePrinterCostChange(printer, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-neon-yellow focus:border-neon-yellow"
                      placeholder="0.0000"
                    />
                    <span className="text-sm text-gray-400">por página</span>
                  </div>
                </div>
              ))}

              <button
                onClick={addNewPrinter}
                className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-neon-cyan hover:text-neon-cyan transition-all duration-300"
              >
                + Adicionar Nova Impressora
              </button>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowConfig(false)}
                className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveCostConfig}
                disabled={saving}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-neon-yellow text-black rounded-lg hover:shadow-neon hover:shadow-yellow-500/50 transition-all duration-300 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {costData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-600 to-neon-green rounded-xl p-6 text-white shadow-neon shadow-green-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Custo Total</p>
                  <p className="text-3xl font-bold">R$ {costData.totalCost.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-neon-blue rounded-xl p-6 text-white shadow-neon shadow-blue-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total de Páginas</p>
                  <p className="text-3xl font-bold">{costData.totalPrints.toLocaleString()}</p>
                </div>
                <Calculator className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-neon-purple rounded-xl p-6 text-white shadow-neon shadow-purple-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Custo Médio por Página</p>
                  <p className="text-3xl font-bold">
                    R$ {costData.totalPrints > 0 ? (costData.totalCost / costData.totalPrints).toFixed(4) : '0.0000'}
                  </p>
                </div>
                <Printer className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Printer Costs Chart */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600 hover:border-neon-yellow transition-all duration-300">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <div className="w-3 h-3 bg-neon-yellow rounded-full mr-2 animate-pulse"></div>
                Custos por Impressora
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costData.printerCosts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="totalCost"
                      stroke="#1f2937"
                      strokeWidth={2}
                    >
                      {costData.printerCosts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* User Costs Chart */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600 hover:border-neon-green transition-all duration-300">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <div className="w-3 h-3 bg-neon-green rounded-full mr-2 animate-pulse"></div>
                Top Usuários por Custo
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData.userCosts.slice(0, 8)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#9CA3AF' }} stroke="#6B7280" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      width={100}
                      stroke="#6B7280"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="totalCost" 
                      fill="url(#greenGradient)" 
                      radius={[0, 4, 4, 0]}
                      name="Custo"
                    />
                    <defs>
                      <linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#00ff88" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Printer Costs Table */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-600">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Detalhes por Impressora</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Impressora</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Páginas</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Custo/Pág</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {costData.printerCosts.map((printer, index) => (
                      <tr key={printer.name} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full shadow-neon-sm"
                              style={{ backgroundColor: NEON_COLORS[index % NEON_COLORS.length] }}
                            />
                            <span className="font-medium text-white">{printer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-300">
                          {printer.totalPrints.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-300">
                          R$ {printer.costPerPage.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-neon-green">
                          R$ {printer.totalCost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Costs Table */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-600">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Detalhes por Usuário</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Páginas</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Jobs</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Custo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {costData.userCosts.slice(0, 10).map((user) => (
                      <tr key={user.name} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-neon-blue" />
                            <span className="font-medium text-white">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-300">
                          {user.totalPrints.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-300">
                          {user.jobs}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-neon-green">
                          R$ {user.totalCost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {!costData && !loading && (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhum dado de custo encontrado</h3>
          <p className="text-gray-400">Configure os custos por impressora para ver a análise.</p>
        </div>
      )}
    </div>
  );
};

export default CostAnalysis;