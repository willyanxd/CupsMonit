import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  onClose: () => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ dateRange, onDateRangeChange, onClose }) => {
  const [localDateRange, setLocalDateRange] = useState(dateRange);

  const handleApply = () => {
    onDateRangeChange(localDateRange);
    onClose();
  };

  const handleClear = () => {
    const clearedRange = { startDate: '', endDate: '' };
    setLocalDateRange(clearedRange);
    onDateRangeChange(clearedRange);
    onClose();
  };

  const setQuickRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const range = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
    
    setLocalDateRange(range);
  };

  const setCurrentMonth = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const range = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
    
    setLocalDateRange(range);
  };

  const setLastMonth = () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const range = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
    
    setLocalDateRange(range);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md mx-4 border border-gray-600">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-neon-blue" />
            <h3 className="text-lg font-semibold text-white">Filtro de Data</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-neon-red transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Quick Ranges */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Períodos Rápidos
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Últimos 7 dias', action: () => setQuickRange(7) },
                { label: 'Últimos 30 dias', action: () => setQuickRange(30) },
                { label: 'Este mês', action: setCurrentMonth },
                { label: 'Mês passado', action: setLastMonth },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className="px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 hover:border-neon-cyan hover:text-neon-cyan transition-all duration-300 text-gray-300"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Período Personalizado
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={localDateRange.startDate}
                  onChange={(e) => setLocalDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data Final</label>
                <input
                  type="date"
                  value={localDateRange.endDate}
                  onChange={(e) => setLocalDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 hover:border-neon-red hover:text-neon-red transition-all duration-300"
            >
              Limpar
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-neon-blue rounded-lg hover:shadow-neon hover:shadow-blue-500/50 transition-all duration-300"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateFilter;