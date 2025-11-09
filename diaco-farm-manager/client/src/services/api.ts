import axios from 'axios';
import { Printer, PrinterStatus, HistoryData } from '../types';

const API_BASE = '/api';

// Printers API
export const printersApi = {
  getAll: async (): Promise<{ printers: Printer[] }> => {
    const response = await axios.get(`${API_BASE}/printers`);
    return response.data;
  },

  add: async (printer: Omit<Printer, 'id'>): Promise<Printer> => {
    const response = await axios.post(`${API_BASE}/printers`, printer);
    return response.data;
  },

  update: async (id: string, updates: Partial<Printer>): Promise<Printer> => {
    const response = await axios.put(`${API_BASE}/printers/${id}`, updates);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/printers/${id}`);
  },

  reorder: async (printerIds: string[]): Promise<void> => {
    await axios.post(`${API_BASE}/printers/reorder`, { printerIds });
  },

  import: async (printers: Printer[]): Promise<void> => {
    await axios.post(`${API_BASE}/printers/import`, { printers });
  }
};

// History API
export const historyApi = {
  getAll: async (): Promise<HistoryData> => {
    const response = await axios.get(`${API_BASE}/history`);
    return response.data;
  },

  sync: async (): Promise<{ success: boolean; syncedJobs: number; totalJobs: number }> => {
    const response = await axios.post(`${API_BASE}/history/sync`);
    return response.data;
  }
};

// Moonraker API (via proxy)
export const moonrakerApi = {
  getStatus: async (printerId: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE}/printer/${printerId}/status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  sendCommand: async (printerId: string, gcode: string): Promise<void> => {
    await axios.post(`${API_BASE}/printer/${printerId}/command`, { gcode });
  },

  uploadFile: async (printerId: string, filename: string, fileData: string): Promise<void> => {
    await axios.post(`${API_BASE}/printer/${printerId}/upload`, { filename, fileData });
  }
};

// Helper functions for common Moonraker commands
export const printerCommands = {
  home: (axis: 'X' | 'Y' | 'Z' | 'all') => {
    return axis === 'all' ? 'G28' : `G28 ${axis}`;
  },

  motorsOff: () => 'M84',

  setTemp: (heater: 'extruder' | 'bed', temp: number) => {
    return heater === 'extruder' ? `M104 S${temp}` : `M140 S${temp}`;
  },

  adjustZOffset: (adjustment: number) => {
    return `SET_GCODE_OFFSET Z_ADJUST=${adjustment} MOVE=1`;
  },

  pausePrint: () => 'PAUSE',

  resumePrint: () => 'RESUME',

  cancelPrint: () => 'CANCEL_PRINT',

  emergencyStop: () => 'M112',

  printFile: (filename: string) => `SDCARD_PRINT_FILE FILENAME="${filename}"`
};
