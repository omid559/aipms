import { useState, useRef, useEffect } from 'react';
import { Menu, Grid, BarChart3, History, Moon, Sun, Plus, Upload, Download, Filter } from 'lucide-react';
import { ViewMode, PrinterFilters } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onThemeToggle: () => void;
  theme: 'light' | 'dark';
  filters: PrinterFilters;
  onFiltersChange: (filters: PrinterFilters) => void;
  onAddPrinter: () => void;
  onImportPrinters: (file: File) => void;
  onExportPrinters: () => void;
  onMassUpload: () => void;
}

export default function Header({
  viewMode,
  onViewModeChange,
  onThemeToggle,
  theme,
  filters,
  onFiltersChange,
  onAddPrinter,
  onImportPrinters,
  onExportPrinters,
  onMassUpload
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportPrinters(file);
    }
  };

  return (
    <header className="glass-dark sticky top-0 z-50 border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Diaco Farm Manager</h1>
          </div>

          {/* View Switcher */}
          <div className="hidden md:flex items-center gap-2 glass rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-smooth ${
                viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => onViewModeChange('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-smooth ${
                viewMode === 'dashboard' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => onViewModeChange('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-smooth ${
                viewMode === 'history' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Filter Button */}
            <div className="relative" ref={filtersRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="glass p-2 rounded-lg text-white hover:bg-white/20 transition-smooth"
                title="Filters"
              >
                <Filter className="w-5 h-5" />
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-2 w-64 glass-dark rounded-lg p-4 shadow-xl dropdown-enter">
                  <h3 className="text-white font-semibold mb-3">Filters</h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-white/70 text-sm block mb-1">Operational Status</label>
                      <select
                        value={filters.operationalStatus || ''}
                        onChange={(e) => onFiltersChange({ ...filters, operationalStatus: e.target.value || undefined })}
                        className="w-full bg-white/10 text-white rounded px-3 py-2 border border-white/20"
                      >
                        <option value="">All</option>
                        <option value="printing">Printing</option>
                        <option value="standby">Standby</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-white/70 text-sm block mb-1">Maintenance Status</label>
                      <select
                        value={filters.maintenanceStatus || ''}
                        onChange={(e) => onFiltersChange({ ...filters, maintenanceStatus: e.target.value || undefined })}
                        className="w-full bg-white/10 text-white rounded px-3 py-2 border border-white/20"
                      >
                        <option value="">All</option>
                        <option value="Healthy">Healthy</option>
                        <option value="Has Issue">Has Issue</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-white/70 text-sm block mb-1">Nozzle Size</label>
                      <select
                        value={filters.nozzleSize || ''}
                        onChange={(e) => onFiltersChange({ ...filters, nozzleSize: e.target.value || undefined })}
                        className="w-full bg-white/10 text-white rounded px-3 py-2 border border-white/20"
                      >
                        <option value="">All</option>
                        <option value="0.2mm">0.2mm</option>
                        <option value="0.4mm">0.4mm</option>
                        <option value="0.6mm">0.6mm</option>
                        <option value="0.8mm">0.8mm</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        onFiltersChange({});
                        setShowFilters(false);
                      }}
                      className="w-full bg-red-500/20 text-red-300 rounded px-3 py-2 hover:bg-red-500/30 transition-smooth"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="glass p-2 rounded-lg text-white hover:bg-white/20 transition-smooth"
                title="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-64 glass-dark rounded-lg p-2 shadow-xl dropdown-enter">
                  <button
                    onClick={() => {
                      onAddPrinter();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-smooth"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add New Printer</span>
                  </button>

                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-smooth"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Import from JSON</span>
                  </button>

                  <button
                    onClick={() => {
                      onExportPrinters();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-smooth"
                  >
                    <Download className="w-5 h-5" />
                    <span>Export to JSON</span>
                  </button>

                  <div className="border-t border-white/10 my-2"></div>

                  <button
                    onClick={() => {
                      onMassUpload();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-smooth"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Upload G-code to Many</span>
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onThemeToggle}
              className="glass p-2 rounded-lg text-white hover:bg-white/20 transition-smooth"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="md:hidden mt-4 flex gap-2">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-smooth ${
              viewMode === 'grid' ? 'glass-dark text-white' : 'glass text-white/70'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span className="text-sm">Grid</span>
          </button>
          <button
            onClick={() => onViewModeChange('dashboard')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-smooth ${
              viewMode === 'dashboard' ? 'glass-dark text-white' : 'glass text-white/70'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </button>
          <button
            onClick={() => onViewModeChange('history')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-smooth ${
              viewMode === 'history' ? 'glass-dark text-white' : 'glass text-white/70'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="text-sm">History</span>
          </button>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
    </header>
  );
}
