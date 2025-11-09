import { useState, useEffect, useCallback } from 'react';
import { Printer, PrinterStatus } from '../types';
import { printersApi, moonrakerApi } from '../services/api';

export function usePrinters() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [printerStatuses, setPrinterStatuses] = useState<Record<string, PrinterStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrinters = useCallback(async () => {
    try {
      const data = await printersApi.getAll();
      setPrinters(data.printers);
      setError(null);
    } catch (err) {
      setError('Failed to fetch printers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrinterStatus = useCallback(async (printerId: string) => {
    try {
      const status = await moonrakerApi.getStatus(printerId);

      // Parse Moonraker response
      const result = status.result?.status || {};
      const printStats = result.print_stats || {};
      const extruder = result.extruder || {};
      const heaterBed = result.heater_bed || {};

      const printerStatus: PrinterStatus = {
        state: printStats.state || 'offline',
        progress: printStats.info?.progress || 0,
        filename: printStats.filename,
        extruder: {
          temperature: extruder.temperature || 0,
          target: extruder.target || 0
        },
        bed: {
          temperature: heaterBed.temperature || 0,
          target: heaterBed.target || 0
        },
        zOffset: result.gcode_move?.homing_origin?.[2] || 0
      };

      setPrinterStatuses(prev => ({
        ...prev,
        [printerId]: printerStatus
      }));
    } catch (err) {
      // Printer offline or error
      setPrinterStatuses(prev => ({
        ...prev,
        [printerId]: {
          state: 'offline',
          extruder: { temperature: 0, target: 0 },
          bed: { temperature: 0, target: 0 }
        }
      }));
    }
  }, []);

  const addPrinter = useCallback(async (printer: Omit<Printer, 'id'>) => {
    try {
      const newPrinter = await printersApi.add(printer);
      setPrinters(prev => [...prev, newPrinter]);
      return newPrinter;
    } catch (err) {
      throw new Error('Failed to add printer');
    }
  }, []);

  const updatePrinter = useCallback(async (id: string, updates: Partial<Printer>) => {
    try {
      const updated = await printersApi.update(id, updates);
      setPrinters(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      throw new Error('Failed to update printer');
    }
  }, []);

  const deletePrinter = useCallback(async (id: string) => {
    try {
      await printersApi.delete(id);
      setPrinters(prev => prev.filter(p => p.id !== id));
      setPrinterStatuses(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      throw new Error('Failed to delete printer');
    }
  }, []);

  const reorderPrinters = useCallback(async (orderedIds: string[]) => {
    try {
      await printersApi.reorder(orderedIds);
      setPrinters(prev => {
        const ordered = orderedIds.map(id => prev.find(p => p.id === id)).filter(Boolean) as Printer[];
        return ordered;
      });
    } catch (err) {
      throw new Error('Failed to reorder printers');
    }
  }, []);

  useEffect(() => {
    fetchPrinters();
  }, [fetchPrinters]);

  // Poll printer statuses every 2 seconds
  useEffect(() => {
    if (printers.length === 0) return;

    const interval = setInterval(() => {
      printers.forEach(printer => {
        fetchPrinterStatus(printer.id);
      });
    }, 2000);

    // Initial fetch
    printers.forEach(printer => {
      fetchPrinterStatus(printer.id);
    });

    return () => clearInterval(interval);
  }, [printers, fetchPrinterStatus]);

  return {
    printers,
    printerStatuses,
    loading,
    error,
    addPrinter,
    updatePrinter,
    deletePrinter,
    reorderPrinters,
    refreshPrinters: fetchPrinters,
    refreshStatus: fetchPrinterStatus
  };
}
