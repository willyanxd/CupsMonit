import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // Permite acesso de qualquer origem para desenvolvimento
  credentials: true
}));
app.use(express.json());

// Store para dados dos logs
let logData = {
  totalPrints: 0,
  users: {},
  printers: {},
  jobs: [],
  dailyStats: {},
  hourlyStats: {},
  lastUpdate: new Date()
};

// Store para configurações de custos
let costsConfig = {
  printers: {},
  lastUpdate: new Date()
};

// Carregar configurações de custos
function loadCostsConfig() {
  try {
    if (fs.existsSync('./costs-config.json')) {
      const data = fs.readFileSync('./costs-config.json', 'utf8');
      costsConfig = JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar configurações de custos:', error);
  }
}

// Salvar configurações de custos
function saveCostsConfig() {
  try {
    fs.writeFileSync('./costs-config.json', JSON.stringify(costsConfig, null, 2));
  } catch (error) {
    console.error('Erro ao salvar configurações de custos:', error);
  }
}

// Função para parsear uma linha do log CUPS
function parseLogLine(line) {
  if (!line.trim() || line.includes('total')) return null;
  
  const parts = line.trim().split(/\s+/);
  if (parts.length < 10) return null;
  
  try {
    const printer = parts[0];
    const user = parts[1];
    const jobId = parts[2];
    const dateTimeMatch = line.match(/\[(.*?)\]/);
    const dateTime = dateTimeMatch ? dateTimeMatch[1] : null;
    const pageNumber = parseInt(parts[4]) || 1;
    const numCopies = parseInt(parts[5]) || 1;
    const jobBilling = parts[6] || '-';
    const hostName = parts[7] || '-';
    const jobName = parts[8] || '-';
    const media = parts[9] || '-';
    const sides = parts[10] || '-';
    
    return {
      printer,
      user,
      jobId,
      dateTime: dateTime ? new Date(dateTime) : new Date(),
      pageNumber,
      numCopies,
      jobBilling,
      hostName,
      jobName,
      media,
      sides,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Erro ao parsear linha:', line, error);
    return null;
  }
}

// Função para filtrar dados por data
function filterByDateRange(data, startDate, endDate) {
  if (!startDate && !endDate) return data;
  
  const start = startDate ? new Date(startDate) : new Date('1970-01-01');
  const end = endDate ? new Date(endDate) : new Date();
  
  // Ajustar para incluir o dia inteiro
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return data.filter(item => {
    const itemDate = new Date(item.dateTime);
    return itemDate >= start && itemDate <= end;
  });
}

// Função para processar logs
function processLogs(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`Arquivo de log não encontrado: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Reset dados
    logData = {
      totalPrints: 0,
      users: {},
      printers: {},
      jobs: [],
      dailyStats: {},
      hourlyStats: {},
      lastUpdate: new Date()
    };

    lines.forEach(line => {
      const parsed = parseLogLine(line);
      if (!parsed) return;

      logData.totalPrints += parsed.numCopies;
      logData.jobs.push(parsed);

      // Estatísticas por usuário
      if (!logData.users[parsed.user]) {
        logData.users[parsed.user] = {
          name: parsed.user,
          totalPrints: 0,
          jobs: 0,
          printers: new Set()
        };
      }
      logData.users[parsed.user].totalPrints += parsed.numCopies;
      logData.users[parsed.user].jobs++;
      logData.users[parsed.user].printers.add(parsed.printer);

      // Estatísticas por impressora
      if (!logData.printers[parsed.printer]) {
        logData.printers[parsed.printer] = {
          name: parsed.printer,
          totalPrints: 0,
          jobs: 0,
          users: new Set()
        };
      }
      logData.printers[parsed.printer].totalPrints += parsed.numCopies;
      logData.printers[parsed.printer].jobs++;
      logData.printers[parsed.printer].users.add(parsed.user);

      // Estatísticas diárias
      const dateKey = parsed.dateTime.toISOString().split('T')[0];
      if (!logData.dailyStats[dateKey]) {
        logData.dailyStats[dateKey] = { date: dateKey, prints: 0, jobs: 0 };
      }
      logData.dailyStats[dateKey].prints += parsed.numCopies;
      logData.dailyStats[dateKey].jobs++;

      // Estatísticas por hora
      const hour = parsed.dateTime.getHours();
      if (!logData.hourlyStats[hour]) {
        logData.hourlyStats[hour] = { hour, prints: 0, jobs: 0 };
      }
      logData.hourlyStats[hour].prints += parsed.numCopies;
      logData.hourlyStats[hour].jobs++;
    });

    // Converter Sets para arrays para serialização JSON
    Object.values(logData.users).forEach(user => {
      user.printers = Array.from(user.printers);
    });
    Object.values(logData.printers).forEach(printer => {
      printer.users = Array.from(printer.users);
    });

    console.log(`Processados ${logData.jobs.length} jobs, ${logData.totalPrints} impressões`);
  } catch (error) {
    console.error('Erro ao processar logs:', error);
  }
}

// Função para gerar CSV
function generateCSV(data, type) {
  let csv = '';
  
  switch (type) {
    case 'jobs':
      csv = 'Job ID,Usuario,Impressora,Data/Hora,Paginas,Copias,Nome do Job,Midia,Lados\n';
      data.forEach(job => {
        const dateTime = job.dateTime ? new Date(job.dateTime).toLocaleString('pt-BR') : '';
        csv += `${job.jobId},"${job.user}","${job.printer}","${dateTime}",${job.pageNumber},${job.numCopies},"${job.jobName}","${job.media}","${job.sides}"\n`;
      });
      break;
      
    case 'users':
      csv = 'Usuario,Total Impressoes,Total Jobs,Impressoras Utilizadas\n';
      Object.values(data).forEach(user => {
        csv += `"${user.name}",${user.totalPrints},${user.jobs},"${user.printers.join(', ')}"\n`;
      });
      break;
      
    case 'printers':
      csv = 'Impressora,Total Impressoes,Total Jobs,Usuarios\n';
      Object.values(data).forEach(printer => {
        csv += `"${printer.name}",${printer.totalPrints},${printer.jobs},"${printer.users.join(', ')}"\n`;
      });
      break;
      
    case 'daily':
      csv = 'Data,Impressoes,Jobs\n';
      Object.values(data).forEach(day => {
        csv += `${day.date},${day.prints},${day.jobs}\n`;
      });
      break;
      
    case 'hourly':
      csv = 'Hora,Impressoes,Jobs\n';
      Array.from({ length: 24 }, (_, i) => {
        const hourData = data[i] || { hour: i, prints: 0, jobs: 0 };
        csv += `${hourData.hour}:00,${hourData.prints},${hourData.jobs}\n`;
      });
      break;

    case 'costs':
      csv = 'Impressora,Total Impressoes,Custo por Pagina,Custo Total\n';
      Object.values(data).forEach(printer => {
        const costPerPage = costsConfig.printers[printer.name]?.costPerPage || 0;
        const totalCost = printer.totalPrints * costPerPage;
        csv += `"${printer.name}",${printer.totalPrints},${costPerPage.toFixed(4)},${totalCost.toFixed(2)}\n`;
      });
      break;
      
    default:
      csv = 'Tipo de relatorio nao suportado\n';
  }
  
  return csv;
}

// Rotas da API
app.get('/api/stats', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  // Recalcular estatísticas para o período filtrado
  const stats = {
    totalPrints: filteredJobs.reduce((sum, job) => sum + job.numCopies, 0),
    totalUsers: new Set(filteredJobs.map(job => job.user)).size,
    totalPrinters: new Set(filteredJobs.map(job => job.printer)).size,
    totalJobs: filteredJobs.length,
    lastUpdate: logData.lastUpdate
  };

  res.json(stats);
});

app.get('/api/users', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  // Recalcular estatísticas de usuários para o período
  const users = {};
  filteredJobs.forEach(job => {
    if (!users[job.user]) {
      users[job.user] = {
        name: job.user,
        totalPrints: 0,
        jobs: 0,
        printers: new Set()
      };
    }
    users[job.user].totalPrints += job.numCopies;
    users[job.user].jobs++;
    users[job.user].printers.add(job.printer);
  });

  // Converter Sets para arrays
  Object.values(users).forEach(user => {
    user.printers = Array.from(user.printers);
  });

  const sortedUsers = Object.values(users).sort((a, b) => b.totalPrints - a.totalPrints);
  res.json(sortedUsers);
});

app.get('/api/printers', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  // Recalcular estatísticas de impressoras para o período
  const printers = {};
  filteredJobs.forEach(job => {
    if (!printers[job.printer]) {
      printers[job.printer] = {
        name: job.printer,
        totalPrints: 0,
        jobs: 0,
        users: new Set()
      };
    }
    printers[job.printer].totalPrints += job.numCopies;
    printers[job.printer].jobs++;
    printers[job.printer].users.add(job.user);
  });

  // Converter Sets para arrays
  Object.values(printers).forEach(printer => {
    printer.users = Array.from(printer.users);
  });

  const sortedPrinters = Object.values(printers).sort((a, b) => b.totalPrints - a.totalPrints);
  res.json(sortedPrinters);
});

app.get('/api/jobs', (req, res) => {
  const { page = 1, limit = 50, user, printer, startDate, endDate } = req.query;
  let jobs = [...logData.jobs];

  // Filtrar por data primeiro
  if (startDate || endDate) {
    jobs = filterByDateRange(jobs, startDate, endDate);
  }

  // Filtrar por usuário e impressora
  if (user) {
    jobs = jobs.filter(job => job.user === user);
  }
  if (printer) {
    jobs = jobs.filter(job => job.printer === printer);
  }

  jobs.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedJobs = jobs.slice(startIndex, endIndex);

  res.json({
    jobs: paginatedJobs,
    total: jobs.length,
    page: parseInt(page),
    totalPages: Math.ceil(jobs.length / limit)
  });
});

app.get('/api/daily-stats', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  // Recalcular estatísticas diárias
  const dailyStats = {};
  filteredJobs.forEach(job => {
    const dateKey = job.dateTime.toISOString().split('T')[0];
    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = { date: dateKey, prints: 0, jobs: 0 };
    }
    dailyStats[dateKey].prints += job.numCopies;
    dailyStats[dateKey].jobs++;
  });

  const stats = Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(stats);
});

app.get('/api/hourly-stats', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  // Recalcular estatísticas horárias
  const hourlyStats = {};
  filteredJobs.forEach(job => {
    const hour = job.dateTime.getHours();
    if (!hourlyStats[hour]) {
      hourlyStats[hour] = { hour, prints: 0, jobs: 0 };
    }
    hourlyStats[hour].prints += job.numCopies;
    hourlyStats[hour].jobs++;
  });

  const stats = Array.from({ length: 24 }, (_, i) => 
    hourlyStats[i] || { hour: i, prints: 0, jobs: 0 }
  );
  res.json(stats);
});

// Rotas para custos
app.get('/api/costs/config', (req, res) => {
  res.json(costsConfig);
});

app.post('/api/costs/config', (req, res) => {
  const { printers } = req.body;
  
  costsConfig.printers = printers;
  costsConfig.lastUpdate = new Date();
  
  saveCostsConfig();
  res.json({ success: true });
});

app.get('/api/costs/analysis', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  // Calcular custos por impressora
  const printerCosts = {};
  const userCosts = {};
  let totalCost = 0;

  filteredJobs.forEach(job => {
    const costPerPage = costsConfig.printers[job.printer]?.costPerPage || 0;
    const jobCost = job.numCopies * costPerPage;
    
    // Custos por impressora
    if (!printerCosts[job.printer]) {
      printerCosts[job.printer] = {
        name: job.printer,
        totalPrints: 0,
        totalCost: 0,
        costPerPage: costPerPage,
        jobs: 0
      };
    }
    printerCosts[job.printer].totalPrints += job.numCopies;
    printerCosts[job.printer].totalCost += jobCost;
    printerCosts[job.printer].jobs++;

    // Custos por usuário
    if (!userCosts[job.user]) {
      userCosts[job.user] = {
        name: job.user,
        totalPrints: 0,
        totalCost: 0,
        jobs: 0,
        printers: new Set()
      };
    }
    userCosts[job.user].totalPrints += job.numCopies;
    userCosts[job.user].totalCost += jobCost;
    userCosts[job.user].jobs++;
    userCosts[job.user].printers.add(job.printer);

    totalCost += jobCost;
  });

  // Converter Sets para arrays
  Object.values(userCosts).forEach(user => {
    user.printers = Array.from(user.printers);
  });

  res.json({
    totalCost,
    totalPrints: filteredJobs.reduce((sum, job) => sum + job.numCopies, 0),
    printerCosts: Object.values(printerCosts).sort((a, b) => b.totalCost - a.totalCost),
    userCosts: Object.values(userCosts).sort((a, b) => b.totalCost - a.totalCost),
    period: { startDate, endDate }
  });
});

// Rotas para download de CSV
app.get('/api/export/jobs', (req, res) => {
  const { user, printer, startDate, endDate } = req.query;
  let jobs = [...logData.jobs];

  // Filtrar por data
  if (startDate || endDate) {
    jobs = filterByDateRange(jobs, startDate, endDate);
  }

  if (user) {
    jobs = jobs.filter(job => job.user === user);
  }
  if (printer) {
    jobs = jobs.filter(job => job.printer === printer);
  }

  jobs.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  
  const csv = generateCSV(jobs, 'jobs');
  const filename = `jobs_${new Date().toISOString().split('T')[0]}.csv`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + csv); // BOM para UTF-8
});

app.get('/api/export/users', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  // Recalcular dados de usuários
  const users = {};
  filteredJobs.forEach(job => {
    if (!users[job.user]) {
      users[job.user] = {
        name: job.user,
        totalPrints: 0,
        jobs: 0,
        printers: new Set()
      };
    }
    users[job.user].totalPrints += job.numCopies;
    users[job.user].jobs++;
    users[job.user].printers.add(job.printer);
  });

  Object.values(users).forEach(user => {
    user.printers = Array.from(user.printers);
  });

  const csv = generateCSV(users, 'users');
  const filename = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + csv);
});

app.get('/api/export/printers', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  // Recalcular dados de impressoras
  const printers = {};
  filteredJobs.forEach(job => {
    if (!printers[job.printer]) {
      printers[job.printer] = {
        name: job.printer,
        totalPrints: 0,
        jobs: 0,
        users: new Set()
      };
    }
    printers[job.printer].totalPrints += job.numCopies;
    printers[job.printer].jobs++;
    printers[job.printer].users.add(job.user);
  });

  Object.values(printers).forEach(printer => {
    printer.users = Array.from(printer.users);
  });

  const csv = generateCSV(printers, 'printers');
  const filename = `impressoras_${new Date().toISOString().split('T')[0]}.csv`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + csv);
});

app.get('/api/export/daily', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  // Recalcular estatísticas diárias
  const dailyStats = {};
  filteredJobs.forEach(job => {
    const dateKey = job.dateTime.toISOString().split('T')[0];
    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = { date: dateKey, prints: 0, jobs: 0 };
    }
    dailyStats[dateKey].prints += job.numCopies;
    dailyStats[dateKey].jobs++;
  });

  const csv = generateCSV(dailyStats, 'daily');
  const filename = `relatorio_diario_${new Date().toISOString().split('T')[0]}.csv`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + csv);
});

app.get('/api/export/hourly', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  // Recalcular estatísticas horárias
  const hourlyStats = {};
  filteredJobs.forEach(job => {
    const hour = job.dateTime.getHours();
    if (!hourlyStats[hour]) {
      hourlyStats[hour] = { hour, prints: 0, jobs: 0 };
    }
    hourlyStats[hour].prints += job.numCopies;
    hourlyStats[hour].jobs++;
  });

  const csv = generateCSV(hourlyStats, 'hourly');
  const filename = `relatorio_horario_${new Date().toISOString().split('T')[0]}.csv`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + csv);
});

app.get('/api/export/costs', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  // Recalcular dados de impressoras para custos
  const printers = {};
  filteredJobs.forEach(job => {
    if (!printers[job.printer]) {
      printers[job.printer] = {
        name: job.printer,
        totalPrints: 0,
        jobs: 0,
        users: new Set()
      };
    }
    printers[job.printer].totalPrints += job.numCopies;
    printers[job.printer].jobs++;
    printers[job.printer].users.add(job.user);
  });

  Object.values(printers).forEach(printer => {
    printer.users = Array.from(printer.users);
  });

  const csv = generateCSV(printers, 'costs');
  const filename = `relatorio_custos_${new Date().toISOString().split('T')[0]}.csv`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + csv);
});

// Rota para relatório completo
app.get('/api/export/complete', (req, res) => {
  const { startDate, endDate } = req.query;
  
  let csv = '=== RELATORIO COMPLETO CUPS LOG ANALYZER ===\n';
  csv += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
  if (startDate || endDate) {
    csv += `Periodo: ${startDate || 'Inicio'} ate ${endDate || 'Hoje'}\n`;
  }
  csv += '\n';
  
  // Filtrar dados se necessário
  let filteredJobs = logData.jobs;
  if (startDate || endDate) {
    filteredJobs = filterByDateRange(logData.jobs, startDate, endDate);
  }

  csv += '=== RESUMO GERAL ===\n';
  csv += `Total de Impressoes,${filteredJobs.reduce((sum, job) => sum + job.numCopies, 0)}\n`;
  csv += `Total de Usuarios,${new Set(filteredJobs.map(job => job.user)).size}\n`;
  csv += `Total de Impressoras,${new Set(filteredJobs.map(job => job.printer)).size}\n`;
  csv += `Total de Jobs,${filteredJobs.length}\n\n`;
  
  // Recalcular dados para o período
  const users = {};
  const printers = {};
  const dailyStats = {};
  const hourlyStats = {};

  filteredJobs.forEach(job => {
    // Usuários
    if (!users[job.user]) {
      users[job.user] = { name: job.user, totalPrints: 0, jobs: 0, printers: new Set() };
    }
    users[job.user].totalPrints += job.numCopies;
    users[job.user].jobs++;
    users[job.user].printers.add(job.printer);

    // Impressoras
    if (!printers[job.printer]) {
      printers[job.printer] = { name: job.printer, totalPrints: 0, jobs: 0, users: new Set() };
    }
    printers[job.printer].totalPrints += job.numCopies;
    printers[job.printer].jobs++;
    printers[job.printer].users.add(job.user);

    // Estatísticas diárias
    const dateKey = job.dateTime.toISOString().split('T')[0];
    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = { date: dateKey, prints: 0, jobs: 0 };
    }
    dailyStats[dateKey].prints += job.numCopies;
    dailyStats[dateKey].jobs++;

    // Estatísticas horárias
    const hour = job.dateTime.getHours();
    if (!hourlyStats[hour]) {
      hourlyStats[hour] = { hour, prints: 0, jobs: 0 };
    }
    hourlyStats[hour].prints += job.numCopies;
    hourlyStats[hour].jobs++;
  });

  // Converter Sets para arrays
  Object.values(users).forEach(user => {
    user.printers = Array.from(user.printers);
  });
  Object.values(printers).forEach(printer => {
    printer.users = Array.from(printer.users);
  });
  
  csv += '=== USUARIOS ===\n';
  csv += generateCSV(users, 'users') + '\n';
  
  csv += '=== IMPRESSORAS ===\n';
  csv += generateCSV(printers, 'printers') + '\n';
  
  csv += '=== ESTATISTICAS DIARIAS ===\n';
  csv += generateCSV(dailyStats, 'daily') + '\n';
  
  csv += '=== ESTATISTICAS POR HORA ===\n';
  csv += generateCSV(hourlyStats, 'hourly') + '\n';

  csv += '=== CUSTOS ===\n';
  csv += generateCSV(printers, 'costs') + '\n';
  
  const filename = `relatorio_completo_${new Date().toISOString().split('T')[0]}.csv`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + csv);
});

// Caminho do arquivo de log do CUPS
const LOG_PATH = '/var/log/cups/page_log';
const FALLBACK_LOG_PATH = './sample_cups.log';

// Carregar configurações de custos na inicialização
loadCostsConfig();

// Processar logs iniciais
if (fs.existsSync(LOG_PATH)) {
  processLogs(LOG_PATH);
  
  // Monitorar mudanças no arquivo de log
  const watcher = chokidar.watch(LOG_PATH);
  watcher.on('change', () => {
    console.log('Arquivo de log modificado, reprocessando...');
    processLogs(LOG_PATH);
  });
} else {
  console.log('Arquivo de log do CUPS não encontrado, usando arquivo de exemplo');
  if (fs.existsSync(FALLBACK_LOG_PATH)) {
    processLogs(FALLBACK_LOG_PATH);
  } else {
    console.log('Criando dados de exemplo...');
    // Criar dados de exemplo para demonstração
    logData = {
      totalPrints: 150,
      users: {
        'admin': { name: 'admin', totalPrints: 45, jobs: 15, printers: ['HP-LaserJet', 'Canon-Pixma'] },
        'user1': { name: 'user1', totalPrints: 32, jobs: 12, printers: ['HP-LaserJet'] },
        'user2': { name: 'user2', totalPrints: 28, jobs: 10, printers: ['Canon-Pixma'] },
        'guest': { name: 'guest', totalPrints: 45, jobs: 20, printers: ['HP-LaserJet', 'Canon-Pixma'] }
      },
      printers: {
        'HP-LaserJet': { name: 'HP-LaserJet', totalPrints: 85, jobs: 35, users: ['admin', 'user1', 'guest'] },
        'Canon-Pixma': { name: 'Canon-Pixma', totalPrints: 65, jobs: 22, users: ['admin', 'user2', 'guest'] }
      },
      jobs: [],
      dailyStats: {},
      hourlyStats: {},
      lastUpdate: new Date()
    };
  }
}

// Iniciar servidor em todas as interfaces de rede
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://0.0.0.0:${PORT}`);
  console.log(`🔌 API: http://0.0.0.0:${PORT}/api`);
  console.log(`📁 Monitorando logs em: ${LOG_PATH}`);
  console.log(`🌐 Acessível na rede local`);
});