import { useState } from 'react';
import { ViewMode, PrinterFilters } from './types';
import { usePrinters } from './hooks/usePrinters';
import Header from './components/Header';
import PrinterGrid from './components/PrinterGrid';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import HistoryDashboard from './components/HistoryDashboard';
import AddEditPrinterModal from './components/AddEditPrinterModal';
import MassUploadModal from './components/MassUploadModal';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<PrinterFilters>({});
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
  const [showMassUploadModal, setShowMassUploadModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<string | null>(null);

  const {
    printers,
    printerStatuses,
    loading,
    error,
    addPrinter,
    updatePrinter,
    deletePrinter,
    reorderPrinters,
    refreshPrinters,
    refreshStatus
  } = usePrinters();

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleImportPrinters = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Import logic would go here
        console.log('Importing printers:', data);
      } catch (err) {
        console.error('Failed to import printers:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleExportPrinters = () => {
    const dataStr = JSON.stringify({ printers }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'printers.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter printers based on filters
  const filteredPrinters = printers.filter(printer => {
    if (filters.maintenanceStatus && printer.status !== filters.maintenanceStatus) {
      return false;
    }
    if (filters.nozzleSize && printer.nozzleSize !== filters.nozzleSize) {
      return false;
    }
    if (filters.operationalStatus) {
      const status = printerStatuses[printer.id];
      if (!status || status.state !== filters.operationalStatus) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className={theme}>
      <div className="animated-gradient min-h-screen">
        <Header
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onThemeToggle={toggleTheme}
          theme={theme}
          filters={filters}
          onFiltersChange={setFilters}
          onAddPrinter={() => setShowAddPrinterModal(true)}
          onImportPrinters={handleImportPrinters}
          onExportPrinters={handleExportPrinters}
          onMassUpload={() => setShowMassUploadModal(true)}
        />

        <main className="container mx-auto px-4 py-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="glass-dark rounded-lg p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="text-white mt-4">Loading printers...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="glass-dark rounded-lg p-4 mb-4 border-red-500">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {viewMode === 'grid' && (
                <PrinterGrid
                  printers={filteredPrinters}
                  printerStatuses={printerStatuses}
                  onUpdatePrinter={updatePrinter}
                  onDeletePrinter={deletePrinter}
                  onReorderPrinters={reorderPrinters}
                  onEditPrinter={setEditingPrinter}
                  onRefreshStatus={refreshStatus}
                />
              )}

              {viewMode === 'dashboard' && (
                <AnalyticsDashboard
                  printers={printers}
                  printerStatuses={printerStatuses}
                />
              )}

              {viewMode === 'history' && (
                <HistoryDashboard printers={printers} />
              )}
            </>
          )}
        </main>

        {/* Modals */}
        {showAddPrinterModal && (
          <AddEditPrinterModal
            onClose={() => setShowAddPrinterModal(false)}
            onSave={async (printer) => {
              await addPrinter(printer);
              setShowAddPrinterModal(false);
            }}
          />
        )}

        {editingPrinter && (
          <AddEditPrinterModal
            printer={printers.find(p => p.id === editingPrinter)}
            onClose={() => setEditingPrinter(null)}
            onSave={async (printer) => {
              await updatePrinter(editingPrinter, printer);
              setEditingPrinter(null);
            }}
          />
        )}

        {showMassUploadModal && (
          <MassUploadModal
            printers={printers}
            onClose={() => setShowMassUploadModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
