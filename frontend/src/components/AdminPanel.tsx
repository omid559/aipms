import { useState } from 'react';
import { Settings, Printer, Package, Layers, X } from 'lucide-react';
import PrinterManager from './admin/PrinterManager';
import MaterialManager from './admin/MaterialManager';
import SlicerSettingsManager from './admin/SlicerSettingsManager';

interface AdminPanelProps {
  onClose: () => void;
}

type TabType = 'printers' | 'materials' | 'settings';

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('printers');

  const tabs = [
    { id: 'printers' as TabType, label: 'مدیریت پرینترها', icon: Printer },
    { id: 'materials' as TabType, label: 'مدیریت متریال‌ها', icon: Package },
    { id: 'settings' as TabType, label: 'تنظیمات اسلایسر', icon: Layers },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">پنل مدیریت</h2>
              <p className="text-sm text-gray-500">مدیریت پرینترها، متریال‌ها و تنظیمات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="بستن"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'printers' && <PrinterManager />}
          {activeTab === 'materials' && <MaterialManager />}
          {activeTab === 'settings' && <SlicerSettingsManager />}
        </div>
      </div>
    </div>
  );
}
