import { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Printer, PrinterStatus } from '../types';

interface AnalyticsDashboardProps {
  printers: Printer[];
  printerStatuses: Record<string, PrinterStatus>;
}

const COLORS = {
  printing: '#3b82f6',
  paused: '#eab308',
  standby: '#10b981',
  ready: '#10b981',
  offline: '#6b7280',
  error: '#ef4444',
  Healthy: '#10b981',
  'Has Issue': '#eab308',
  Maintenance: '#ef4444',
};

export default function AnalyticsDashboard({ printers, printerStatuses }: AnalyticsDashboardProps) {
  const operationalData = useMemo(() => {
    const statusCounts: Record<string, number> = {};

    printers.forEach(printer => {
      const status = printerStatuses[printer.id];
      const state = status?.state || 'offline';
      statusCounts[state] = (statusCounts[state] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name as keyof typeof COLORS] || '#6b7280'
    }));
  }, [printers, printerStatuses]);

  const maintenanceData = useMemo(() => {
    const statusCounts: Record<string, number> = {};

    printers.forEach(printer => {
      statusCounts[printer.status] = (statusCounts[printer.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: COLORS[name as keyof typeof COLORS] || '#6b7280'
    }));
  }, [printers]);

  const nozzleData = useMemo(() => {
    const nozzleCounts: Record<string, number> = {};

    printers.forEach(printer => {
      nozzleCounts[printer.nozzleSize] = (nozzleCounts[printer.nozzleSize] || 0) + 1;
    });

    return Object.entries(nozzleCounts).map(([name, value]) => ({
      name,
      value
    }));
  }, [printers]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-dark p-3 rounded-lg border border-white/20">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-white/70">{payload[0].value} printers</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-dark rounded-xl p-6">
          <h3 className="text-white/70 text-sm mb-2">Total Printers</h3>
          <p className="text-4xl font-bold text-white">{printers.length}</p>
        </div>

        <div className="glass-dark rounded-xl p-6">
          <h3 className="text-white/70 text-sm mb-2">Currently Printing</h3>
          <p className="text-4xl font-bold text-blue-400">
            {operationalData.find(d => d.name === 'Printing')?.value || 0}
          </p>
        </div>

        <div className="glass-dark rounded-xl p-6">
          <h3 className="text-white/70 text-sm mb-2">Offline</h3>
          <p className="text-4xl font-bold text-gray-400">
            {operationalData.find(d => d.name === 'Offline')?.value || 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational Status */}
        <div className="glass-dark rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Operational Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={operationalData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {operationalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Maintenance Status */}
        <div className="glass-dark rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Maintenance Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={maintenanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {maintenanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Nozzle Size Distribution */}
        <div className="glass-dark rounded-xl p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-4">Nozzle Size Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={nozzleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
              <YAxis stroke="rgba(255,255,255,0.7)" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#26c6bc" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Printer List Table */}
      <div className="glass-dark rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Printer List</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/70 py-3 px-4">Name</th>
                <th className="text-left text-white/70 py-3 px-4">IP Address</th>
                <th className="text-left text-white/70 py-3 px-4">Status</th>
                <th className="text-left text-white/70 py-3 px-4">Nozzle Size</th>
                <th className="text-left text-white/70 py-3 px-4">State</th>
              </tr>
            </thead>
            <tbody>
              {printers.map(printer => {
                const status = printerStatuses[printer.id];
                return (
                  <tr key={printer.id} className="border-b border-white/5 hover:bg-white/5 transition-smooth">
                    <td className="py-3 px-4">
                      <a
                        href={`http://${printer.ip}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-cyan-400 transition-smooth"
                      >
                        {printer.name}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-white/70 font-mono text-sm">{printer.ip}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        printer.status === 'Healthy' ? 'bg-green-500/20 text-green-300' :
                        printer.status === 'Has Issue' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {printer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/70">{printer.nozzleSize}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        status?.state === 'printing' ? 'bg-blue-500/20 text-blue-300' :
                        status?.state === 'paused' ? 'bg-yellow-500/20 text-yellow-300' :
                        status?.state === 'ready' || status?.state === 'standby' ? 'bg-green-500/20 text-green-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {status?.state || 'offline'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
