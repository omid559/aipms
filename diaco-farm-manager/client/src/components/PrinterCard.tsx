import { useState, useRef, useEffect } from 'react';
import {
  MoreVertical, RefreshCw, Edit, Trash2, AlertTriangle,
  Home, Power, Play, Pause, Square, Plus, Minus, Flame, Wind
} from 'lucide-react';
import { Printer, PrinterStatus } from '../types';
import { moonrakerApi, printerCommands } from '../services/api';

interface PrinterCardProps {
  printer: Printer;
  status: PrinterStatus | undefined;
  onUpdate: (id: string, updates: Partial<Printer>) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onRefresh: (id: string) => void;
}

export default function PrinterCard({
  printer,
  status,
  onUpdate,
  onDelete,
  onEdit,
  onRefresh
}: PrinterCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [targetExtruderTemp, setTargetExtruderTemp] = useState(0);
  const [targetBedTemp, setTargetBedTemp] = useState(0);
  const [lastFile, setLastFile] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (status) {
      setTargetExtruderTemp(status.extruder.target);
      setTargetBedTemp(status.bed.target);
      if (status.filename) {
        setLastFile(status.filename);
      }
    }
  }, [status]);

  const sendCommand = async (gcode: string) => {
    try {
      await moonrakerApi.sendCommand(printer.id, gcode);
      setTimeout(() => onRefresh(printer.id), 500);
    } catch (err) {
      console.error('Failed to send command:', err);
      alert('Failed to send command to printer');
    }
  };

  const handleEmergencyStop = () => {
    if (confirm('⚠️ EMERGENCY STOP - This will immediately halt all printer operations. Continue?')) {
      sendCommand(printerCommands.emergencyStop());
    }
  };

  const handlePause = () => {
    sendCommand(printerCommands.pausePrint());
  };

  const handleResume = () => {
    sendCommand(printerCommands.resumePrint());
  };

  const handleCancel = () => {
    if (confirm('Cancel the current print? This cannot be undone.')) {
      sendCommand(printerCommands.cancelPrint());
    }
  };

  const handleHome = (axis: 'X' | 'Y' | 'Z' | 'all') => {
    sendCommand(printerCommands.home(axis));
  };

  const handleMotorsOff = () => {
    sendCommand(printerCommands.motorsOff());
  };

  const handleSetTemp = (heater: 'extruder' | 'bed', temp: number) => {
    sendCommand(printerCommands.setTemp(heater, temp));
  };

  const handleZOffset = (adjustment: number) => {
    sendCommand(printerCommands.adjustZOffset(adjustment));
  };

  const handlePrintLastFile = () => {
    if (lastFile) {
      if (confirm(`Start printing ${lastFile}?`)) {
        sendCommand(printerCommands.printFile(lastFile));
      }
    } else {
      alert('No previous file found');
    }
  };

  const handlePreset = (material: 'PLA' | 'PETG' | 'ABS' | 'COOL') => {
    const presets = {
      PLA: { extruder: 200, bed: 60 },
      PETG: { extruder: 230, bed: 80 },
      ABS: { extruder: 240, bed: 100 },
      COOL: { extruder: 0, bed: 0 }
    };
    const preset = presets[material];
    handleSetTemp('extruder', preset.extruder);
    handleSetTemp('bed', preset.bed);
  };

  // Long press handlers for fullscreen
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsFullscreen(true);
    }, 1000);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const isOffline = !status || status.state === 'offline';
  const isPrinting = status?.state === 'printing';
  const isPaused = status?.state === 'paused';
  const isIdle = status?.state === 'ready' || status?.state === 'standby';

  const cardContent = (
    <div className="glass-dark rounded-xl p-4 transition-smooth hover:shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <a
            href={`http://${printer.ip}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-white hover:text-cyan-400 transition-smooth"
          >
            {printer.name}
          </a>
          <div className="flex items-center gap-2 mt-1">
            <select
              value={printer.status}
              onChange={(e) => onUpdate(printer.id, { status: e.target.value as any })}
              className={`text-xs px-2 py-1 rounded ${
                printer.status === 'Healthy' ? 'bg-green-500/20 text-green-300' :
                printer.status === 'Has Issue' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300'
              }`}
            >
              <option value="Healthy">Healthy</option>
              <option value="Has Issue">Has Issue</option>
              <option value="Maintenance">Maintenance</option>
            </select>
            <input
              type="text"
              value={printer.nozzleSize}
              onChange={(e) => onUpdate(printer.id, { nozzleSize: e.target.value })}
              className="text-xs px-2 py-1 rounded bg-white/10 text-white border border-white/20 w-16"
            />
          </div>
        </div>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-white/10 rounded transition-smooth"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 glass-dark rounded-lg overflow-hidden shadow-xl z-10 dropdown-enter">
              <button
                onClick={() => { onRefresh(printer.id); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => { onEdit(printer.id); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-white/10"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this printer?')) {
                    onDelete(printer.id);
                  }
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className={`mb-4 px-3 py-2 rounded-lg ${
        isOffline ? 'bg-gray-500/20 text-gray-300' :
        isPrinting ? 'bg-blue-500/20 text-blue-300' :
        isPaused ? 'bg-yellow-500/20 text-yellow-300' :
        'bg-green-500/20 text-green-300'
      }`}>
        <div className="text-sm font-medium">
          {isOffline ? '⚫ Offline' :
           isPrinting ? '🔵 Printing' :
           isPaused ? '🟡 Paused' :
           '🟢 Ready'}
        </div>
      </div>

      {/* Temperatures */}
      <div className="space-y-3 mb-4">
        {/* Extruder */}
        <div className="glass rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-white text-sm font-medium">Nozzle</span>
            </div>
            <div className="text-white font-mono">
              {status?.extruder.temperature.toFixed(1) || 0}° / {status?.extruder.target.toFixed(0) || 0}°
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={targetExtruderTemp}
              onChange={(e) => setTargetExtruderTemp(Number(e.target.value))}
              className="flex-1 bg-white/10 text-white rounded px-2 py-1 text-sm border border-white/20"
              disabled={isOffline}
            />
            <button
              onClick={() => handleSetTemp('extruder', targetExtruderTemp)}
              className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded text-sm hover:bg-orange-500/30 disabled:opacity-50"
              disabled={isOffline}
            >
              Set
            </button>
          </div>
          <div className="flex gap-1 mt-2">
            <button onClick={() => handlePreset('PLA')} className="flex-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs hover:bg-blue-500/30 disabled:opacity-50" disabled={isOffline}>PLA</button>
            <button onClick={() => handlePreset('PETG')} className="flex-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs hover:bg-purple-500/30 disabled:opacity-50" disabled={isOffline}>PETG</button>
            <button onClick={() => handlePreset('ABS')} className="flex-1 px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30 disabled:opacity-50" disabled={isOffline}>ABS</button>
            <button onClick={() => handlePreset('COOL')} className="flex-1 px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs hover:bg-cyan-500/30 disabled:opacity-50" disabled={isOffline}>Cool</button>
          </div>
        </div>

        {/* Bed */}
        <div className="glass rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              <span className="text-white text-sm font-medium">Bed</span>
            </div>
            <div className="text-white font-mono">
              {status?.bed.temperature.toFixed(1) || 0}° / {status?.bed.target.toFixed(0) || 0}°
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={targetBedTemp}
              onChange={(e) => setTargetBedTemp(Number(e.target.value))}
              className="flex-1 bg-white/10 text-white rounded px-2 py-1 text-sm border border-white/20"
              disabled={isOffline}
            />
            <button
              onClick={() => handleSetTemp('bed', targetBedTemp)}
              className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded text-sm hover:bg-cyan-500/30 disabled:opacity-50"
              disabled={isOffline}
            >
              Set
            </button>
          </div>
        </div>
      </div>

      {/* Print Progress */}
      {(isPrinting || isPaused) && status && (
        <div className="mb-4 glass rounded-lg p-3">
          <div className="flex justify-between text-sm text-white mb-2">
            <span className="truncate flex-1">{status.filename}</span>
            <span className="font-mono ml-2">{Math.round(status.progress || 0)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-smooth"
              style={{ width: `${status.progress || 0}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-2">
        {/* Idle Controls */}
        {isIdle && (
          <>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => handleHome('all')} className="px-2 py-2 bg-white/10 text-white rounded text-xs hover:bg-white/20 disabled:opacity-50" disabled={isOffline}>
                <Home className="w-4 h-4 mx-auto mb-1" />
                All
              </button>
              <button onClick={() => handleHome('X')} className="px-2 py-2 bg-white/10 text-white rounded text-xs hover:bg-white/20 disabled:opacity-50" disabled={isOffline}>X</button>
              <button onClick={() => handleHome('Y')} className="px-2 py-2 bg-white/10 text-white rounded text-xs hover:bg-white/20 disabled:opacity-50" disabled={isOffline}>Y</button>
              <button onClick={() => handleHome('Z')} className="px-2 py-2 bg-white/10 text-white rounded text-xs hover:bg-white/20 disabled:opacity-50" disabled={isOffline}>Z</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleMotorsOff} className="px-3 py-2 bg-white/10 text-white rounded text-sm hover:bg-white/20 disabled:opacity-50 flex items-center justify-center gap-2" disabled={isOffline}>
                <Power className="w-4 h-4" />
                Motors Off
              </button>
              <button onClick={handlePrintLastFile} className="px-3 py-2 bg-green-500/20 text-green-300 rounded text-sm hover:bg-green-500/30 disabled:opacity-50 flex items-center justify-center gap-2" disabled={isOffline || !lastFile}>
                <Play className="w-4 h-4" />
                Print Last
              </button>
            </div>
          </>
        )}

        {/* Printing/Paused Controls */}
        {(isPrinting || isPaused) && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={isPaused ? handleResume : handlePause} className="px-3 py-2 bg-yellow-500/20 text-yellow-300 rounded text-sm hover:bg-yellow-500/30 flex items-center justify-center gap-2">
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button onClick={handleCancel} className="px-3 py-2 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30 flex items-center justify-center gap-2">
                <Square className="w-4 h-4" />
                Cancel
              </button>
              <div className="flex gap-1">
                <button onClick={() => handleZOffset(0.05)} className="flex-1 px-2 py-2 bg-white/10 text-white rounded text-xs hover:bg-white/20">
                  <Plus className="w-4 h-4 mx-auto" />
                </button>
                <button onClick={() => handleZOffset(-0.05)} className="flex-1 px-2 py-2 bg-white/10 text-white rounded text-xs hover:bg-white/20">
                  <Minus className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Emergency Stop */}
        <button
          onClick={handleEmergencyStop}
          className="w-full px-3 py-2 bg-red-600/30 text-red-200 rounded font-semibold hover:bg-red-600/50 disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={isOffline}
        >
          <AlertTriangle className="w-5 h-5" />
          EMERGENCY STOP
        </button>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 text-white text-2xl"
        >
          ✕
        </button>
        <div className="max-w-md w-full">
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {cardContent}
    </div>
  );
}
