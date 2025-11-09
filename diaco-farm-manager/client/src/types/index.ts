export interface Printer {
  id: string;
  name: string;
  ip: string;
  status: 'Healthy' | 'Has Issue' | 'Maintenance';
  nozzleSize: string;
}

export interface PrinterStatus {
  state: 'printing' | 'paused' | 'standby' | 'ready' | 'offline' | 'error';
  progress?: number;
  filename?: string;
  extruder: {
    temperature: number;
    target: number;
  };
  bed: {
    temperature: number;
    target: number;
  };
  zOffset?: number;
}

export interface PrintJob {
  id: string;
  printerId: string;
  printerName: string;
  filename: string;
  status: 'completed' | 'cancelled' | 'error';
  startTime: number;
  endTime: number;
  totalDuration: number;
  filamentUsed: number;
  printDuration: number;
}

export interface HistoryData {
  jobs: PrintJob[];
}

export type ViewMode = 'grid' | 'dashboard' | 'history';

export interface PrinterFilters {
  operationalStatus?: string;
  maintenanceStatus?: string;
  nozzleSize?: string;
}
