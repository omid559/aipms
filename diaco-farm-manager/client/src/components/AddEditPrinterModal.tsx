import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Printer } from '../types';

interface AddEditPrinterModalProps {
  printer?: Printer;
  onClose: () => void;
  onSave: (printer: Omit<Printer, 'id'>) => void;
}

export default function AddEditPrinterModal({ printer, onClose, onSave }: AddEditPrinterModalProps) {
  const [name, setName] = useState(printer?.name || '');
  const [ip, setIp] = useState(printer?.ip || '');
  const [status, setStatus] = useState<'Healthy' | 'Has Issue' | 'Maintenance'>(printer?.status || 'Healthy');
  const [nozzleSize, setNozzleSize] = useState(printer?.nozzleSize || '0.4mm');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !ip) {
      alert('Name and IP address are required');
      return;
    }

    onSave({ name, ip, status, nozzleSize });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="glass-dark rounded-xl max-w-md w-full p-6 modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {printer ? 'Edit Printer' : 'Add New Printer'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-smooth"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm block mb-2">Printer Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Printer 1"
              className="w-full bg-white/10 text-white rounded px-4 py-2 border border-white/20 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-2">IP Address *</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g., 192.168.1.100"
              pattern="^(\d{1,3}\.){3}\d{1,3}$"
              className="w-full bg-white/10 text-white rounded px-4 py-2 border border-white/20 focus:border-cyan-500 focus:outline-none font-mono"
              required
            />
            <p className="text-white/50 text-xs mt-1">Format: xxx.xxx.xxx.xxx</p>
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-2">Maintenance Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-white/10 text-white rounded px-4 py-2 border border-white/20 focus:border-cyan-500 focus:outline-none"
            >
              <option value="Healthy">Healthy</option>
              <option value="Has Issue">Has Issue</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="text-white/70 text-sm block mb-2">Nozzle Size</label>
            <select
              value={nozzleSize}
              onChange={(e) => setNozzleSize(e.target.value)}
              className="w-full bg-white/10 text-white rounded px-4 py-2 border border-white/20 focus:border-cyan-500 focus:outline-none"
            >
              <option value="0.2mm">0.2mm</option>
              <option value="0.4mm">0.4mm</option>
              <option value="0.6mm">0.6mm</option>
              <option value="0.8mm">0.8mm</option>
              <option value="1.0mm">1.0mm</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-smooth"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-cyan-500/30 text-cyan-200 rounded hover:bg-cyan-500/40 transition-smooth font-semibold"
            >
              {printer ? 'Save Changes' : 'Add Printer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
