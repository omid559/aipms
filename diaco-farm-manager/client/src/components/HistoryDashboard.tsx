import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Table, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Printer, PrintJob } from '../types';
import { historyApi } from '../services/api';

interface HistoryDashboardProps {
  printers: Printer[];
}

const STATUS_COLORS = {
  completed: '#10b981',
  cancelled: '#eab308',
  error: '#ef4444',
};

export default function HistoryDashboard({ printers }: HistoryDashboardProps) {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await historyApi.getAll();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await historyApi.sync();
      alert(`Synced ${result.syncedJobs} new jobs. Total: ${result.totalJobs}`);
      await fetchHistory();
    } catch (err) {
      console.error('Failed to sync history:', err);
      alert('Failed to sync history from printers');
    } finally {
      setSyncing(false);
    }
  };

  const handlePrinterToggle = (printerId: string) => {
    setSelectedPrinters(prev =>
      prev.includes(printerId)
        ? prev.filter(id => id !== printerId)
        : [...prev, printerId]
    );
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Filter by selected printers
      if (selectedPrinters.length > 0 && !selectedPrinters.includes(job.printerId)) {
        return false;
      }

      // Filter by date range
      if (startDate) {
        const jobDate = new Date(job.startTime * 1000);
        const start = new Date(startDate);
        if (jobDate < start) return false;
      }

      if (endDate) {
        const jobDate = new Date(job.startTime * 1000);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        if (jobDate > end) return false;
      }

      return true;
    });
  }, [jobs, selectedPrinters, startDate, endDate]);

  const analytics = useMemo(() => {
    const totalTime = filteredJobs.reduce((sum, job) => sum + (job.printDuration || 0), 0);
    const totalFilament = filteredJobs.reduce((sum, job) => sum + (job.filamentUsed || 0), 0);

    const statusDistribution = filteredJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const printerStats = filteredJobs.reduce((acc, job) => {
      if (!acc[job.printerName]) {
        acc[job.printerName] = {
          completed: 0,
          cancelled: 0,
          error: 0,
          totalTime: 0
        };
      }

      acc[job.printerName][job.status] += 1;
      acc[job.printerName].totalTime += job.printDuration || 0;

      return acc;
    }, {} as Record<string, any>);

    return {
      totalTime,
      totalFilament,
      statusDistribution,
      printerStats
    };
  }, [filteredJobs]);

  const statusData = Object.entries(analytics.statusDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: STATUS_COLORS[name as keyof typeof STATUS_COLORS]
  }));

  const printerTimeData = Object.entries(analytics.printerStats).map(([name, stats]: [string, any]) => ({
    name,
    Completed: Math.round(stats.totalTime / 3600),
    Cancelled: stats.cancelled,
    Error: stats.error
  }));

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-dark p-3 rounded-lg border border-white/20">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-white/70">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="glass-dark rounded-xl p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="glass-dark rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Printer Selection */}
          <div>
            <label className="text-white/70 text-sm block mb-2">Printers</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {printers.map(printer => (
                <label key={printer.id} className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPrinters.includes(printer.id)}
                    onChange={() => handlePrinterToggle(printer.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{printer.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-white/70 text-sm block mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white/10 text-white rounded px-3 py-2 border border-white/20"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white/10 text-white rounded px-3 py-2 border border-white/20"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded hover:bg-cyan-500/30 transition-smooth disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync History'}
            </button>

            <button
              onClick={() => setShowRawData(!showRawData)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-smooth"
            >
              {showRawData ? <BarChart3 className="w-4 h-4" /> : <Table className="w-4 h-4" />}
              {showRawData ? 'Show Charts' : 'Show Table'}
            </button>
          </div>
        </div>
      </div>

      {!showRawData ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-dark rounded-xl p-6">
              <h3 className="text-white/70 text-sm mb-2">Total Completed Print Time</h3>
              <p className="text-4xl font-bold text-white">
                {formatDuration(analytics.totalTime)}
              </p>
            </div>

            <div className="glass-dark rounded-xl p-6">
              <h3 className="text-white/70 text-sm mb-2">Total Filament Used</h3>
              <p className="text-4xl font-bold text-white">
                {(analytics.totalFilament / 1000).toFixed(2)} g
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="glass-dark rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Jobs by Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Printer Time Distribution */}
            <div className="glass-dark rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Time by Printer (hours)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={printerTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        /* Raw Data Table */
        <div className="glass-dark rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Job History ({filteredJobs.length} jobs)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/70 py-3 px-4">Printer</th>
                  <th className="text-left text-white/70 py-3 px-4">Filename</th>
                  <th className="text-left text-white/70 py-3 px-4">Status</th>
                  <th className="text-left text-white/70 py-3 px-4">Start Time</th>
                  <th className="text-left text-white/70 py-3 px-4">Duration</th>
                  <th className="text-left text-white/70 py-3 px-4">Filament</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => (
                  <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-smooth">
                    <td className="py-3 px-4 text-white">{job.printerName}</td>
                    <td className="py-3 px-4 text-white/70 font-mono text-sm">{job.filename}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        job.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        job.status === 'cancelled' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/70 text-sm">
                      {new Date(job.startTime * 1000).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white/70">{formatDuration(job.printDuration || 0)}</td>
                    <td className="py-3 px-4 text-white/70">{((job.filamentUsed || 0) / 1000).toFixed(2)} g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
