import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Star, Search, Check, X } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

interface Printer {
  _id: string;
  name: string;
  manufacturer: string;
  model: string;
  buildVolume: { x: number; y: number; z: number };
  nozzle: { diameter: number; availableSizes: number[] };
  extruder: { count: number; type: 'bowden' | 'direct' };
  maxSpeed: { x: number; y: number; z: number; e: number };
  maxAcceleration: { x: number; y: number; z: number; e: number };
  bed: { type: 'heated' | 'unheated'; maxTemp: number; shape: string; material: string };
  autoLeveling: boolean;
  levelingType?: string;
  firmware: string;
  firmwareVersion?: string;
  features: {
    filamentSensor: boolean;
    powerRecovery: boolean;
    enclosure: boolean;
    hepa: boolean;
    camera: boolean;
  };
  gcodeFlavor: string;
  startGcode: string;
  endGcode: string;
  isActive: boolean;
  isDefault: boolean;
  description?: string;
}

export default function PrinterManager() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);

  useEffect(() => {
    fetchPrinters();
  }, []);

  const fetchPrinters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/printers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrinters(response.data.printers);
    } catch (error) {
      console.error('Error fetching printers:', error);
      alert('خطا در دریافت لیست پرینترها');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این پرینتر اطمینان دارید؟')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/printers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPrinters();
    } catch (error: any) {
      alert(error.response?.data?.error || 'خطا در حذف پرینتر');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/admin/printers/${id}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPrinters();
    } catch (error) {
      alert('خطا در تغییر وضعیت پرینتر');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/admin/printers/${id}/set-default`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPrinters();
    } catch (error) {
      alert('خطا در تنظیم پرینتر پیش‌فرض');
    }
  };

  const filteredPrinters = printers.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm) {
    return (
      <PrinterForm
        printer={editingPrinter}
        onClose={() => {
          setShowForm(false);
          setEditingPrinter(null);
        }}
        onSave={() => {
          setShowForm(false);
          setEditingPrinter(null);
          fetchPrinters();
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو در پرینترها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          افزودن پرینتر
        </button>
      </div>

      {/* Printers Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
          {filteredPrinters.map((printer) => (
            <div
              key={printer._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{printer.name}</h3>
                  <p className="text-sm text-gray-600">{printer.manufacturer} - {printer.model}</p>
                </div>
                <div className="flex items-center gap-1">
                  {printer.isDefault && (
                    <span className="p-1 bg-yellow-100 text-yellow-600 rounded" title="پیش‌فرض">
                      <Star className="w-4 h-4 fill-current" />
                    </span>
                  )}
                  <span
                    className={`p-1 rounded ${printer.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                    title={printer.isActive ? 'فعال' : 'غیرفعال'}
                  >
                    <Power className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>حجم ساخت:</span>
                  <span className="font-medium">{printer.buildVolume.x}×{printer.buildVolume.y}×{printer.buildVolume.z}mm</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>نازل:</span>
                  <span className="font-medium">{printer.nozzle.diameter}mm</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Extruder:</span>
                  <span className="font-medium">{printer.extruder.type}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Firmware:</span>
                  <span className="font-medium">{printer.firmware}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                {!printer.isDefault && (
                  <button
                    onClick={() => handleSetDefault(printer._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                    title="تنظیم به عنوان پیش‌فرض"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleToggleActive(printer._id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  title={printer.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingPrinter(printer);
                    setShowForm(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {!printer.isDefault && (
                  <button
                    onClick={() => handleDelete(printer._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredPrinters.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="text-lg font-medium">پرینتری یافت نشد</p>
          <p className="text-sm mt-2">پرینتر جدیدی اضافه کنید یا جستجوی دیگری انجام دهید</p>
        </div>
      )}
    </div>
  );
}

// Printer Form Component
interface PrinterFormProps {
  printer: Printer | null;
  onClose: () => void;
  onSave: () => void;
}

function PrinterForm({ printer, onClose, onSave }: PrinterFormProps) {
  const [formData, setFormData] = useState<any>(
    printer || {
      name: '',
      manufacturer: '',
      model: '',
      buildVolume: { x: 220, y: 220, z: 250 },
      nozzle: { diameter: 0.4, availableSizes: [0.4] },
      extruder: { count: 1, type: 'bowden' },
      maxSpeed: { x: 150, y: 150, z: 10, e: 45 },
      maxAcceleration: { x: 500, y: 500, z: 100, e: 1000 },
      bed: { type: 'heated', maxTemp: 100, shape: 'rectangular', material: 'glass' },
      autoLeveling: false,
      firmware: 'Marlin',
      features: {
        filamentSensor: false,
        powerRecovery: false,
        enclosure: false,
        hepa: false,
        camera: false,
      },
      gcodeFlavor: 'marlin',
      startGcode: 'G28 ; Home all axes\nG1 Z15.0 F6000 ; Move the platform down 15mm',
      endGcode: 'M104 S0 ; Turn off extruder\nM140 S0 ; Turn off bed\nG28 X0 ; Home X axis\nM84 ; Disable motors',
    }
  );

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (printer) {
        await axios.put(`${API_URL}/admin/printers/${printer._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/admin/printers`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.error || 'خطا در ذخیره پرینتر');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-bold text-gray-900">
            {printer ? 'ویرایش پرینتر' : 'افزودن پرینتر جدید'}
          </h3>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold mb-4">اطلاعات اصلی</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نام پرینتر *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    سازنده *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    مدل *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firmware
                  </label>
                  <select
                    value={formData.firmware}
                    onChange={(e) => setFormData({ ...formData, firmware: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Marlin">Marlin</option>
                    <option value="Klipper">Klipper</option>
                    <option value="RepRap">RepRap</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Build Volume */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold mb-4">حجم ساخت (mm)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">X</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.buildVolume.x}
                    onChange={(e) => setFormData({
                      ...formData,
                      buildVolume: { ...formData.buildVolume, x: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Y</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.buildVolume.y}
                    onChange={(e) => setFormData({
                      ...formData,
                      buildVolume: { ...formData.buildVolume, y: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Z</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.buildVolume.z}
                    onChange={(e) => setFormData({
                      ...formData,
                      buildVolume: { ...formData.buildVolume, z: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Nozzle & Extruder */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold mb-4">نازل و اکسترودر</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    قطر نازل (mm)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0.1"
                    max="2"
                    value={formData.nozzle.diameter}
                    onChange={(e) => setFormData({
                      ...formData,
                      nozzle: { ...formData.nozzle, diameter: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع اکسترودر
                  </label>
                  <select
                    value={formData.extruder.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      extruder: { ...formData.extruder, type: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bowden">Bowden</option>
                    <option value="direct">Direct Drive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold mb-4">امکانات</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoLeveling}
                    onChange={(e) => setFormData({ ...formData, autoLeveling: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Auto Leveling</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.filamentSensor}
                    onChange={(e) => setFormData({
                      ...formData,
                      features: { ...formData.features, filamentSensor: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Filament Sensor</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.powerRecovery}
                    onChange={(e) => setFormData({
                      ...formData,
                      features: { ...formData.features, powerRecovery: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Power Recovery</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.enclosure}
                    onChange={(e) => setFormData({
                      ...formData,
                      features: { ...formData.features, enclosure: e.target.checked }
                    })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enclosure</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                در حال ذخیره...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                ذخیره
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
