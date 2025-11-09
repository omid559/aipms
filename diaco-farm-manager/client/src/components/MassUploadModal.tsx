import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Printer } from '../types';
import { moonrakerApi } from '../services/api';

interface MassUploadModalProps {
  printers: Printer[];
  onClose: () => void;
}

export default function MassUploadModal({ printers, onClose }: MassUploadModalProps) {
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<Array<{ printer: string; success: boolean; error?: string }>>([]);

  const handlePrinterToggle = (printerId: string) => {
    setSelectedPrinters(prev =>
      prev.includes(printerId)
        ? prev.filter(id => id !== printerId)
        : [...prev, printerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPrinters.length === printers.length) {
      setSelectedPrinters([]);
    } else {
      setSelectedPrinters(printers.map(p => p.id));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.gcode')) {
      setFile(selectedFile);
    } else {
      alert('Please select a G-code file (.gcode)');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    if (selectedPrinters.length === 0) {
      alert('Please select at least one printer');
      return;
    }

    setUploading(true);
    setResults([]);

    const fileContent = await file.text();
    const uploadResults: Array<{ printer: string; success: boolean; error?: string }> = [];

    for (const printerId of selectedPrinters) {
      const printer = printers.find(p => p.id === printerId);
      if (!printer) continue;

      try {
        await moonrakerApi.uploadFile(printerId, file.name, fileContent);
        uploadResults.push({ printer: printer.name, success: true });
      } catch (err: any) {
        uploadResults.push({
          printer: printer.name,
          success: false,
          error: err.message || 'Upload failed'
        });
      }
    }

    setResults(uploadResults);
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="glass-dark rounded-xl max-w-2xl w-full p-6 modal-enter max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Upload G-code to Multiple Printers</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-smooth"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* File Selection */}
        <div className="mb-6">
          <label className="text-white/70 text-sm block mb-2">Select G-code File</label>
          <div className="relative">
            <input
              type="file"
              accept=".gcode"
              onChange={handleFileChange}
              className="hidden"
              id="gcode-file-input"
              disabled={uploading}
            />
            <label
              htmlFor="gcode-file-input"
              className="flex items-center justify-center gap-3 w-full bg-white/10 text-white rounded px-4 py-3 border-2 border-dashed border-white/20 hover:border-cyan-500 cursor-pointer transition-smooth"
            >
              <Upload className="w-5 h-5" />
              <span>{file ? file.name : 'Click to select G-code file'}</span>
            </label>
          </div>
        </div>

        {/* Printer Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-white/70 text-sm">Select Target Printers</label>
            <button
              onClick={handleSelectAll}
              className="text-cyan-400 text-sm hover:text-cyan-300 transition-smooth"
              disabled={uploading}
            >
              {selectedPrinters.length === printers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="glass rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
            {printers.map(printer => (
              <label
                key={printer.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer transition-smooth"
              >
                <input
                  type="checkbox"
                  checked={selectedPrinters.includes(printer.id)}
                  onChange={() => handlePrinterToggle(printer.id)}
                  disabled={uploading}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="text-white font-medium">{printer.name}</p>
                  <p className="text-white/50 text-xs font-mono">{printer.ip}</p>
                </div>
              </label>
            ))}
          </div>

          <p className="text-white/50 text-sm mt-2">
            Selected: {selectedPrinters.length} / {printers.length}
          </p>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-6 glass rounded-lg p-4 max-h-48 overflow-y-auto">
            <h3 className="text-white font-semibold mb-3">Upload Results</h3>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded ${
                    result.success ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  <span className="text-white text-sm">{result.printer}</span>
                  <span className={`text-sm ${result.success ? 'text-green-300' : 'text-red-300'}`}>
                    {result.success ? '✓ Success' : `✗ ${result.error}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-smooth disabled:opacity-50"
          >
            {results.length > 0 ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !file || selectedPrinters.length === 0}
            className="flex-1 px-4 py-2 bg-cyan-500/30 text-cyan-200 rounded hover:bg-cyan-500/40 transition-smooth font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload to {selectedPrinters.length} Printer{selectedPrinters.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
