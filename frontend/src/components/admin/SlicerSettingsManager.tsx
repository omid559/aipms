import { useState, useEffect } from 'react';
import { Eye, EyeOff, Brain, Search, Save, BarChart3 } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

interface SlicerSetting {
  key: string;
  label: string;
  category: string;
  type: string;
  unit?: string;
  description?: string;
  visibleInUI: boolean;
  useInAIOptimization: boolean;
  advancedOnly: boolean;
  order: number;
}

interface SlicerConfig {
  _id: string;
  name: string;
  version: string;
  settings: SlicerSetting[];
}

export default function SlicerSettingsManager() {
  const [config, setConfig] = useState<SlicerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [changes, setChanges] = useState<Map<string, Partial<SlicerSetting>>>(new Map());
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const categories = [
    { id: 'all', label: 'همه' },
    { id: 'layer', label: 'لایه' },
    { id: 'infill', label: 'Infill' },
    { id: 'speed', label: 'سرعت' },
    { id: 'temperature', label: 'دما' },
    { id: 'support', label: 'ساپورت' },
    { id: 'cooling', label: 'خنک‌کاری' },
    { id: 'retraction', label: 'Retraction' },
    { id: 'advanced', label: 'پیشرفته' },
  ];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      // Get first active config
      const response = await axios.get(`${API_URL}/admin/slicer-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.configs && response.data.configs.length > 0) {
        const firstConfig = response.data.configs[0];
        setConfig(firstConfig);

        // Fetch stats
        const statsResponse = await axios.get(`${API_URL}/admin/slicer-settings/${firstConfig._id}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(statsResponse.data.stats);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      alert('خطا در دریافت تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = (key: string, field: 'visibleInUI' | 'useInAIOptimization') => {
    if (!config) return;

    const setting = config.settings.find(s => s.key === key);
    if (!setting) return;

    const newValue = !setting[field];

    // Update local state
    const updatedSettings = config.settings.map(s =>
      s.key === key ? { ...s, [field]: newValue } : s
    );
    setConfig({ ...config, settings: updatedSettings });

    // Track changes
    const currentChanges = new Map(changes);
    const existingChange = currentChanges.get(key) || {};
    currentChanges.set(key, { ...existingChange, [field]: newValue });
    setChanges(currentChanges);
  };

  const handleSaveChanges = async () => {
    if (!config || changes.size === 0) return;

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const updates = Array.from(changes.entries()).map(([key, values]) => ({
        key,
        ...values,
      }));

      await axios.patch(`${API_URL}/admin/slicer-settings/${config._id}/bulk-update`,
        { updates },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChanges(new Map());
      alert('تغییرات با موفقیت ذخیره شد');
      fetchConfig(); // Refresh data
    } catch (error: any) {
      alert(error.response?.data?.error || 'خطا در ذخیره تغییرات');
    } finally {
      setSaving(false);
    }
  };

  const filteredSettings = config?.settings.filter(s => {
    const matchesSearch = s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>هیچ پیکربندی فعالی یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{config.name}</h3>
            <p className="text-sm text-gray-600">نسخه {config.version} - {config.settings.length} تنظیم</p>
          </div>
          {changes.size > 0 && (
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  ذخیره {changes.size} تغییر
                </>
              )}
            </button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">کل تنظیمات</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.totalSettings}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Eye className="w-5 h-5" />
                <span className="text-sm font-medium">نمایش در UI</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{stats.visibleInUI}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Brain className="w-5 h-5" />
                <span className="text-sm font-medium">بهینه‌سازی AI</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{stats.usedInAI}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <span className="text-sm font-medium">پیشرفته</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{stats.advancedOnly}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو در تنظیمات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-900">تنظیم</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-900">دسته</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-gray-900">نوع</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-gray-900">نمایش در UI</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-gray-900">بهینه‌سازی AI</th>
                <th className="text-center px-6 py-3 text-sm font-semibold text-gray-900">پیشرفته</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettings.map((setting, index) => (
                <tr
                  key={setting.key}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    changes.has(setting.key) ? 'bg-yellow-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{setting.label}</p>
                      <p className="text-xs text-gray-500">{setting.key}</p>
                      {setting.description && (
                        <p className="text-xs text-gray-600 mt-1">{setting.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {setting.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600">
                      {setting.type}
                      {setting.unit && <span className="text-gray-400 ml-1">({setting.unit})</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleSetting(setting.key, 'visibleInUI')}
                      className={`p-2 rounded-lg transition-colors ${
                        setting.visibleInUI
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={setting.visibleInUI ? 'نمایش داده می‌شود' : 'مخفی است'}
                    >
                      {setting.visibleInUI ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleSetting(setting.key, 'useInAIOptimization')}
                      className={`p-2 rounded-lg transition-colors ${
                        setting.useInAIOptimization
                          ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={setting.useInAIOptimization ? 'استفاده می‌شود' : 'استفاده نمی‌شود'}
                    >
                      <Brain className="w-5 h-5" />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block w-3 h-3 rounded-full ${
                      setting.advancedOnly ? 'bg-orange-500' : 'bg-gray-300'
                    }`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredSettings.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>تنظیمی یافت نشد</p>
        </div>
      )}
    </div>
  );
}
