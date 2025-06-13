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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

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
          <h2 className="text-2xl font-bold text-gray-900">Análise de Custos</h2>
          <p className="text-gray-600">Controle de gastos com impressão por impressora e usuário</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar Custos</span>
          </button>
          <button
            onClick={downloadCosts}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Custos</span>
          </button>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Configurar Custos por Impressora</h3>
              <button
                onClick={() => setShowConfig(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {Object.keys(tempConfig).map(printer => (
                <div key={printer} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <Printer className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">{printer}</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={tempConfig[printer]}
                      onChange={(e) => handlePrinterCostChange(printer, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.0000"
                    />
                    <span className="text-sm text-gray-500">por página</span>
                  </div>
                </div>
              ))}

              <button
                onClick={addNewPrinter}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                + Adicionar Nova Impressora
              </button>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowConfig(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveCostConfig}
                disabled={saving}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Custo Total</p>
                  <p className="text-3xl font-bold">R$ {costData.totalCost.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total de Páginas</p>
                  <p className="text-3xl font-bold">{costData.totalPrints.toLocaleString()}</p>
                </div>
                <Calculator className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Printer Costs Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Custos por Impressora</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costData.printerCosts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: R$ ${value.toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalCost"
                  >
                    {costData.printerCosts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Custo']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* User Costs Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Usuários por Custo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData.userCosts.slice(0, 8)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Custo']}
                  />
                  <Bar dataKey="totalCost" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Printer Costs Table */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Detalhes por Impressora</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impressora</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Páginas</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Custo/Pág</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {costData.printerCosts.map((printer, index) => (
                      <tr key={printer.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium text-gray-900">{printer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          {printer.totalPrints.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          R$ {printer.costPerPage.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                          R$ {printer.totalCost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Costs Table */}
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Detalhes por Usuário</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Páginas</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jobs</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Custo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {costData.userCosts.slice(0, 10).map((user) => (
                      <tr key={user.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          {user.totalPrints.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          {user.jobs}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
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
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado de custo encontrado</h3>
          <p className="text-gray-500">Configure os custos por impressora para ver a análise.</p>
        </div>
      )}
    </div>
  );
};

export default CostAnalysis;