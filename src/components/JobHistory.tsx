import React, { useState, useEffect } from 'react';
import { FileText, User, Printer, Calendar, Filter, ChevronLeft, ChevronRight, Download, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface JobHistoryProps {
  dateRange: DateRange;
}

interface Job {
  printer: string;
  user: string;
  jobId: string;
  dateTime: string;
  pageNumber: number;
  numCopies: number;
  jobBilling: string;
  hostName: string;
  jobName: string;
  media: string;
  sides: string;
}

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  totalPages: number;
}

// Get the correct API base URL based on current protocol
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Always use HTTP for backend connection
  return `http://${hostname}:3001`;
};

const JobHistory: React.FC<JobHistoryProps> = ({ dateRange }) => {
  const [jobsData, setJobsData] = useState<JobsResponse>({ jobs: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    user: '',
    printer: ''
  });
  const [users, setUsers] = useState<string[]>([]);
  const [printers, setPrinters] = useState<string[]>([]);

  useEffect(() => {
    fetchJobs();
    fetchFilters();
  }, [currentPage, filters, dateRange]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (filters.user) params.append('user', filters.user);
      if (filters.printer) params.append('printer', filters.printer);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await fetch(`${apiBaseUrl}/api/jobs?${params}`);
      const data = await response.json();
      setJobsData(data);
    } catch (error) {
      console.error('Erro ao buscar jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const params = new URLSearchParams();
      
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const [usersRes, printersRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/users?${params}`),
        fetch(`${apiBaseUrl}/api/printers?${params}`)
      ]);

      const [usersData, printersData] = await Promise.all([
        usersRes.json(),
        printersRes.json()
      ]);

      setUsers(usersData.map((u: any) => u.name));
      setPrinters(printersData.map((p: any) => p.name));
    } catch (error) {
      console.error('Erro ao buscar filtros:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ user: '', printer: '' });
    setCurrentPage(1);
  };

  const downloadJobs = () => {
    const apiBaseUrl = getApiBaseUrl();
    const params = new URLSearchParams();
    
    if (filters.user) params.append('user', filters.user);
    if (filters.printer) params.append('printer', filters.printer);
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);

    const url = `${apiBaseUrl}/api/export/jobs?${params}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Enhanced pagination component
  const renderPagination = () => {
    if (jobsData.totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(jobsData.totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < jobsData.totalPages - 1) {
        rangeWithDots.push('...', jobsData.totalPages);
      } else {
        rangeWithDots.push(jobsData.totalPages);
      }

      return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    return (
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(jobsData.totalPages, prev + 1))}
              disabled={currentPage === jobsData.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Próximo
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-400">
                Mostrando{' '}
                <span className="font-medium text-neon-cyan">{((currentPage - 1) * 20) + 1}</span>
                {' '}até{' '}
                <span className="font-medium text-neon-cyan">
                  {Math.min(currentPage * 20, jobsData.total)}
                </span>
                {' '}de{' '}
                <span className="font-medium text-neon-cyan">{jobsData.total}</span>
                {' '}resultados
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* First page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                title="Primeira página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              
              {/* Previous page */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {visiblePages.map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-500">
                        ...
                      </span>
                    ) : (
                      <button
                        onClick={() => setCurrentPage(page as number)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-300 ${
                          currentPage === page
                            ? 'z-10 bg-gradient-to-r from-neon-blue to-neon-cyan border-neon-blue text-white shadow-neon shadow-blue-500/50'
                            : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-neon-cyan hover:border-neon-cyan'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              {/* Next page */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(jobsData.totalPages, prev + 1))}
                disabled={currentPage === jobsData.totalPages}
                className="relative inline-flex items-center px-2 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* Last page */}
              <button
                onClick={() => setCurrentPage(jobsData.totalPages)}
                disabled={currentPage === jobsData.totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && jobsData.jobs.length === 0) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Histórico de Impressões</h2>
          <p className="text-gray-400">Registro detalhado de todos os jobs de impressão</p>
        </div>
        <button
          onClick={downloadJobs}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-neon-cyan text-white rounded-lg hover:shadow-neon hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Jobs</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 rounded-lg mb-6 border border-gray-600">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-neon-cyan" />
          <span className="font-medium text-white">Filtros</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Usuário
            </label>
            <select
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan transition-all duration-300"
            >
              <option value="">Todos os usuários</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Impressora
            </label>
            <select
              value={filters.printer}
              onChange={(e) => handleFilterChange('printer', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-neon-cyan transition-all duration-300"
            >
              <option value="">Todas as impressoras</option>
              {printers.map(printer => (
                <option key={printer} value={printer}>{printer}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 hover:border-neon-cyan hover:text-neon-cyan focus:outline-none focus:ring-2 focus:ring-neon-cyan transition-all duration-300"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-900/30 to-neon-blue/20 p-4 rounded-lg border border-neon-blue/30">
          <div className="text-2xl font-bold text-neon-blue">{jobsData.total}</div>
          <div className="text-sm text-blue-300">Total de registros</div>
        </div>
        <div className="bg-gradient-to-r from-green-900/30 to-neon-green/20 p-4 rounded-lg border border-neon-green/30">
          <div className="text-2xl font-bold text-neon-green">{jobsData.totalPages}</div>
          <div className="text-sm text-green-300">Total de páginas</div>
        </div>
        <div className="bg-gradient-to-r from-purple-900/30 to-neon-purple/20 p-4 rounded-lg border border-neon-purple/30">
          <div className="text-2xl font-bold text-neon-purple">{currentPage}</div>
          <div className="text-sm text-purple-300">Página atual</div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Impressora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Páginas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Mídia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {jobsData.jobs.map((job, index) => (
                <tr key={`${job.jobId}-${index}`} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-neon-cyan mr-2" />
                      <div>
                        <div className="text-sm font-medium text-white">#{job.jobId}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs" title={job.jobName}>
                          {job.jobName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-neon-green mr-2" />
                      <div className="text-sm text-white">{job.user}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Printer className="w-4 h-4 text-neon-purple mr-2" />
                      <div className="text-sm text-white">{job.printer}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-neon-yellow mr-2" />
                      <div className="text-sm text-white">{formatDateTime(job.dateTime)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-neon-blue border border-blue-500/30">
                      {job.numCopies} cópia{job.numCopies !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {job.media === '-' ? 'N/A' : job.media}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Pagination */}
        {renderPagination()}
      </div>

      {jobsData.jobs.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhum job encontrado</h3>
          <p className="text-gray-400">
            {Object.values(filters).some(f => f) || dateRange.startDate || dateRange.endDate
              ? 'Tente ajustar os filtros para ver mais resultados.'
              : 'Não há histórico de impressões para exibir no momento.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default JobHistory;