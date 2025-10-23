import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Star, Search, Check } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

interface Material {
  _id: string;
  name: string;
  type: string;
  manufacturer?: string;
  temperature: {
    nozzle: number;
    nozzleMin: number;
    nozzleMax: number;
    bed: number;
    bedMin: number;
    bedMax: number;
  };
  speed: {
    print: number;
    infill: number;
    wall: number;
  };
  properties: {
    density: number;
    diameter: number;
    flowRate: number;
  };
  isActive: boolean;
  isDefault: boolean;
}

export default function MaterialManager() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMaterials(response.data.materials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      alert('خطا در دریافت لیست متریال‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این متریال اطمینان دارید؟')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/materials/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMaterials();
    } catch (error: any) {
      alert(error.response?.data?.error || 'خطا در حذف متریال');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/admin/materials/${id}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMaterials();
    } catch (error) {
      alert('خطا در تغییر وضعیت متریال');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/admin/materials/${id}/set-default`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMaterials();
    } catch (error) {
      alert('خطا در تنظیم متریال پیش‌فرض');
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showForm) {
    return (
      <MaterialForm
        material={editingMaterial}
        onClose={() => {
          setShowForm(false);
          setEditingMaterial(null);
        }}
        onSave={() => {
          setShowForm(false);
          setEditingMaterial(null);
          fetchMaterials();
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو در متریال‌ها..."
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
          افزودن متریال
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto">
          {filteredMaterials.map((material) => (
            <div
              key={material._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{material.name}</h3>
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded mt-1">
                    {material.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {material.isDefault && (
                    <span className="p-1 bg-yellow-100 text-yellow-600 rounded">
                      <Star className="w-4 h-4 fill-current" />
                    </span>
                  )}
                  <span
                    className={`p-1 rounded ${material.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                  >
                    <Power className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>نازل:</span>
                  <span className="font-medium">{material.temperature.nozzle}°C</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>بد:</span>
                  <span className="font-medium">{material.temperature.bed}°C</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>سرعت چاپ:</span>
                  <span className="font-medium">{material.speed.print}mm/s</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>قطر:</span>
                  <span className="font-medium">{material.properties.diameter}mm</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                {!material.isDefault && (
                  <button
                    onClick={() => handleSetDefault(material._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleToggleActive(material._id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingMaterial(material);
                    setShowForm(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {!material.isDefault && (
                  <button
                    onClick={() => handleDelete(material._id)}
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

      {!loading && filteredMaterials.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="text-lg font-medium">متریالی یافت نشد</p>
        </div>
      )}
    </div>
  );
}

// Material Form Component (simplified)
interface MaterialFormProps {
  material: Material | null;
  onClose: () => void;
  onSave: () => void;
}

function MaterialForm({ material, onClose, onSave }: MaterialFormProps) {
  const [formData, setFormData] = useState<any>(
    material || {
      name: '',
      type: 'PLA',
      temperature: { nozzle: 200, nozzleMin: 190, nozzleMax: 220, bed: 60, bedMin: 50, bedMax: 70 },
      speed: { print: 60, infill: 80, wall: 50, topBottom: 50, support: 60, travel: 150, firstLayer: 20 },
      cooling: { minFanSpeed: 0, maxFanSpeed: 100, regularFanSpeed: 100, bridgeFanSpeed: 100, disableFirstLayers: 1 },
      retraction: { enabled: true, distance: 5, speed: 45, extraRestart: 0, minTravel: 1.5, zHop: 0.2 },
      properties: { density: 1.24, diameter: 1.75, flowRate: 100, shrinkage: 0.3 },
      adhesion: { type: 'skirt' },
      characteristics: { strength: 6, flexibility: 3, durability: 5, printability: 9, supportRemoval: 8, postProcessing: 7 },
      requirements: { enclosure: false, heatbed: true, allMetalHotend: false, dryingRequired: false, ventilation: false },
    }
  );

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (material) {
        await axios.put(`${API_URL}/admin/materials/${material._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/admin/materials`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.error || 'خطا در ذخیره متریال');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-bold text-gray-900">
            {material ? 'ویرایش متریال' : 'افزودن متریال جدید'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold mb-4">اطلاعات اصلی</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نام متریال *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع *</label>
                  <input
                    type="text"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Temperature Settings */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold mb-4">دما (°C)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نازل</label>
                  <input
                    type="number"
                    required
                    value={formData.temperature.nozzle}
                    onChange={(e) => setFormData({
                      ...formData,
                      temperature: { ...formData.temperature, nozzle: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min نازل</label>
                  <input
                    type="number"
                    required
                    value={formData.temperature.nozzleMin}
                    onChange={(e) => setFormData({
                      ...formData,
                      temperature: { ...formData.temperature, nozzleMin: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max نازل</label>
                  <input
                    type="number"
                    required
                    value={formData.temperature.nozzleMax}
                    onChange={(e) => setFormData({
                      ...formData,
                      temperature: { ...formData.temperature, nozzleMax: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">بد</label>
                  <input
                    type="number"
                    required
                    value={formData.temperature.bed}
                    onChange={(e) => setFormData({
                      ...formData,
                      temperature: { ...formData.temperature, bed: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min بد</label>
                  <input
                    type="number"
                    required
                    value={formData.temperature.bedMin}
                    onChange={(e) => setFormData({
                      ...formData,
                      temperature: { ...formData.temperature, bedMin: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max بد</label>
                  <input
                    type="number"
                    required
                    value={formData.temperature.bedMax}
                    onChange={(e) => setFormData({
                      ...formData,
                      temperature: { ...formData.temperature, bedMax: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Speed Settings */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold mb-4">سرعت (mm/s)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">چاپ</label>
                  <input
                    type="number"
                    required
                    value={formData.speed.print}
                    onChange={(e) => setFormData({
                      ...formData,
                      speed: { ...formData.speed, print: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Infill</label>
                  <input
                    type="number"
                    required
                    value={formData.speed.infill}
                    onChange={(e) => setFormData({
                      ...formData,
                      speed: { ...formData.speed, infill: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">دیوار</label>
                  <input
                    type="number"
                    required
                    value={formData.speed.wall}
                    onChange={(e) => setFormData({
                      ...formData,
                      speed: { ...formData.speed, wall: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Properties */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold mb-4">مشخصات</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">چگالی (g/cm³)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.properties.density}
                    onChange={(e) => setFormData({
                      ...formData,
                      properties: { ...formData.properties, density: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">قطر (mm)</label>
                  <select
                    value={formData.properties.diameter}
                    onChange={(e) => setFormData({
                      ...formData,
                      properties: { ...formData.properties, diameter: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1.75">1.75</option>
                    <option value="2.85">2.85</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Flow Rate (%)</label>
                  <input
                    type="number"
                    required
                    value={formData.properties.flowRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      properties: { ...formData.properties, flowRate: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

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
