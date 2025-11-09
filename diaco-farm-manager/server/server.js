import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const PRINTERS_FILE = path.join(DATA_DIR, 'printers.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.log.json');

// Initialize data directory and files
async function initializeData() {
  try {
    if (!existsSync(DATA_DIR)) {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }

    if (!existsSync(PRINTERS_FILE)) {
      const defaultPrinters = {
        printers: [
          {
            id: 'demo-printer-1',
            name: 'Demo Printer 1',
            ip: '192.168.1.100',
            status: 'Healthy',
            nozzleSize: '0.4mm'
          }
        ]
      };
      await fs.writeFile(PRINTERS_FILE, JSON.stringify(defaultPrinters, null, 2));
      console.log('✓ Created printers.json with default data');
    }

    if (!existsSync(HISTORY_FILE)) {
      const defaultHistory = {
        jobs: []
      };
      await fs.writeFile(HISTORY_FILE, JSON.stringify(defaultHistory, null, 2));
      console.log('✓ Created history.log.json with default data');
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Helper function to read JSON file
async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

// Helper function to write JSON file
async function writeJSONFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// ===== PRINTER ENDPOINTS =====

// Get all printers
app.get('/api/printers', async (req, res) => {
  const data = await readJSONFile(PRINTERS_FILE);
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to read printers data' });
  }
});

// Add new printer
app.post('/api/printers', async (req, res) => {
  const { name, ip, status = 'Healthy', nozzleSize = '0.4mm' } = req.body;

  if (!name || !ip) {
    return res.status(400).json({ error: 'Name and IP are required' });
  }

  const data = await readJSONFile(PRINTERS_FILE);
  if (!data) {
    return res.status(500).json({ error: 'Failed to read printers data' });
  }

  const newPrinter = {
    id: `printer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    ip,
    status,
    nozzleSize
  };

  data.printers.push(newPrinter);

  if (await writeJSONFile(PRINTERS_FILE, data)) {
    res.status(201).json(newPrinter);
  } else {
    res.status(500).json({ error: 'Failed to save printer' });
  }
});

// Update printer
app.put('/api/printers/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const data = await readJSONFile(PRINTERS_FILE);
  if (!data) {
    return res.status(500).json({ error: 'Failed to read printers data' });
  }

  const printerIndex = data.printers.findIndex(p => p.id === id);
  if (printerIndex === -1) {
    return res.status(404).json({ error: 'Printer not found' });
  }

  data.printers[printerIndex] = { ...data.printers[printerIndex], ...updates };

  if (await writeJSONFile(PRINTERS_FILE, data)) {
    res.json(data.printers[printerIndex]);
  } else {
    res.status(500).json({ error: 'Failed to update printer' });
  }
});

// Delete printer
app.delete('/api/printers/:id', async (req, res) => {
  const { id } = req.params;

  const data = await readJSONFile(PRINTERS_FILE);
  if (!data) {
    return res.status(500).json({ error: 'Failed to read printers data' });
  }

  const printerIndex = data.printers.findIndex(p => p.id === id);
  if (printerIndex === -1) {
    return res.status(404).json({ error: 'Printer not found' });
  }

  data.printers.splice(printerIndex, 1);

  if (await writeJSONFile(PRINTERS_FILE, data)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to delete printer' });
  }
});

// Reorder printers
app.post('/api/printers/reorder', async (req, res) => {
  const { printerIds } = req.body;

  if (!Array.isArray(printerIds)) {
    return res.status(400).json({ error: 'printerIds must be an array' });
  }

  const data = await readJSONFile(PRINTERS_FILE);
  if (!data) {
    return res.status(500).json({ error: 'Failed to read printers data' });
  }

  // Reorder printers based on provided IDs
  const reordered = printerIds
    .map(id => data.printers.find(p => p.id === id))
    .filter(Boolean);

  data.printers = reordered;

  if (await writeJSONFile(PRINTERS_FILE, data)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to reorder printers' });
  }
});

// Import printers from JSON
app.post('/api/printers/import', async (req, res) => {
  const { printers } = req.body;

  if (!Array.isArray(printers)) {
    return res.status(400).json({ error: 'Invalid printers data' });
  }

  const data = { printers };

  if (await writeJSONFile(PRINTERS_FILE, data)) {
    res.json({ success: true, count: printers.length });
  } else {
    res.status(500).json({ error: 'Failed to import printers' });
  }
});

// ===== HISTORY ENDPOINTS =====

// Get print history
app.get('/api/history', async (req, res) => {
  const data = await readJSONFile(HISTORY_FILE);
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to read history data' });
  }
});

// Sync history from all printers
app.post('/api/history/sync', async (req, res) => {
  const printersData = await readJSONFile(PRINTERS_FILE);
  const historyData = await readJSONFile(HISTORY_FILE);

  if (!printersData || !historyData) {
    return res.status(500).json({ error: 'Failed to read data files' });
  }

  let syncedJobs = 0;
  const errors = [];

  // Fetch history from each printer
  for (const printer of printersData.printers) {
    try {
      // Moonraker API endpoint for job history
      const response = await axios.get(`http://${printer.ip}/server/history/list`, {
        timeout: 5000
      });

      if (response.data && response.data.result && response.data.result.jobs) {
        const jobs = response.data.result.jobs;

        // Add printer info and deduplicate
        for (const job of jobs) {
          const jobId = `${printer.id}-${job.job_id || job.filename}-${job.start_time}`;

          // Check if job already exists
          if (!historyData.jobs.some(j => j.id === jobId)) {
            historyData.jobs.push({
              id: jobId,
              printerId: printer.id,
              printerName: printer.name,
              filename: job.filename,
              status: job.status,
              startTime: job.start_time,
              endTime: job.end_time,
              totalDuration: job.total_duration,
              filamentUsed: job.filament_used,
              printDuration: job.print_duration
            });
            syncedJobs++;
          }
        }
      }
    } catch (error) {
      console.error(`Error syncing from ${printer.name}:`, error.message);
      errors.push({ printer: printer.name, error: error.message });
    }
  }

  // Save updated history
  if (await writeJSONFile(HISTORY_FILE, historyData)) {
    res.json({
      success: true,
      syncedJobs,
      totalJobs: historyData.jobs.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } else {
    res.status(500).json({ error: 'Failed to save history' });
  }
});

// ===== MOONRAKER PROXY ENDPOINTS =====

// Proxy requests to individual printers
app.get('/api/printer/:printerId/status', async (req, res) => {
  const { printerId } = req.params;

  const printersData = await readJSONFile(PRINTERS_FILE);
  if (!printersData) {
    return res.status(500).json({ error: 'Failed to read printers data' });
  }

  const printer = printersData.printers.find(p => p.id === printerId);
  if (!printer) {
    return res.status(404).json({ error: 'Printer not found' });
  }

  try {
    // Fetch printer status from Moonraker
    const response = await axios.get(`http://${printer.ip}/printer/objects/query?print_stats&toolhead&heater_bed&extruder`, {
      timeout: 5000
    });

    res.json(response.data);
  } catch (error) {
    res.status(503).json({ error: 'Failed to connect to printer', details: error.message });
  }
});

// Send command to printer
app.post('/api/printer/:printerId/command', async (req, res) => {
  const { printerId } = req.params;
  const { gcode } = req.body;

  if (!gcode) {
    return res.status(400).json({ error: 'gcode command is required' });
  }

  const printersData = await readJSONFile(PRINTERS_FILE);
  if (!printersData) {
    return res.status(500).json({ error: 'Failed to read printers data' });
  }

  const printer = printersData.printers.find(p => p.id === printerId);
  if (!printer) {
    return res.status(404).json({ error: 'Printer not found' });
  }

  try {
    // Send G-code command via Moonraker
    const response = await axios.post(
      `http://${printer.ip}/printer/gcode/script`,
      { script: gcode },
      { timeout: 5000 }
    );

    res.json(response.data);
  } catch (error) {
    res.status(503).json({ error: 'Failed to send command to printer', details: error.message });
  }
});

// Upload file to printer
app.post('/api/printer/:printerId/upload', async (req, res) => {
  const { printerId } = req.params;
  const { filename, fileData } = req.body;

  if (!filename || !fileData) {
    return res.status(400).json({ error: 'filename and fileData are required' });
  }

  const printersData = await readJSONFile(PRINTERS_FILE);
  if (!printersData) {
    return res.status(500).json({ error: 'Failed to read printers data' });
  }

  const printer = printersData.printers.find(p => p.id === printerId);
  if (!printer) {
    return res.status(404).json({ error: 'Printer not found' });
  }

  try {
    // Upload file via Moonraker
    const formData = new FormData();
    const blob = new Blob([fileData], { type: 'text/plain' });
    formData.append('file', blob, filename);

    const response = await axios.post(
      `http://${printer.ip}/server/files/upload`,
      formData,
      {
        timeout: 30000,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(503).json({ error: 'Failed to upload file to printer', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Diaco Farm Manager Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from React app (production)
const clientBuildPath = path.join(__dirname, '../client/dist');
if (existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Start server
async function startServer() {
  await initializeData();

  app.listen(PORT, () => {
    console.log('\n🚀 Diaco Farm Manager Server');
    console.log('================================');
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ API endpoint: http://localhost:${PORT}/api`);
    console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    console.log('================================\n');
  });
}

startServer();
