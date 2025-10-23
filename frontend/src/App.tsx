import { useState } from 'react'
import { Upload, Settings, Sparkles, FileText, Printer } from 'lucide-react'
import FileUploader from './components/FileUploader'
import ModelViewer from './components/ModelViewer'
import SettingsPanel from './components/SettingsPanel'
import ProfileSelector from './components/ProfileSelector'
import AIOptimizer from './components/AIOptimizer'
import { useStore } from './store/useStore'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'settings' | 'preview'>('upload')
  const { uploadedFile, slicingSettings } = useStore()

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Printer size={32} />
              <div>
                <h1>AIPMS</h1>
                <p>سیستم مدیریت پرینت سه‌بعدی با هوش مصنوعی</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={20} />
            آپلود فایل
          </button>
          <button
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            disabled={!uploadedFile}
          >
            <Settings size={20} />
            تنظیمات اسلایس
          </button>
          <button
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
            disabled={!uploadedFile}
          >
            <FileText size={20} />
            پیش‌نمایش و G-Code
          </button>
        </div>

        <div className="main-content">
          {activeTab === 'upload' && (
            <div className="grid grid-2">
              <div>
                <FileUploader />
                {uploadedFile && (
                  <div className="card" style={{ marginTop: '20px' }}>
                    <h3 style={{ marginBottom: '16px' }}>پروفایل‌ها</h3>
                    <ProfileSelector />
                  </div>
                )}
              </div>
              <div>
                {uploadedFile ? (
                  <>
                    <div className="card">
                      <h3 style={{ marginBottom: '16px' }}>پیش‌نمایش مدل سه‌بعدی</h3>
                      <ModelViewer />
                    </div>
                    <AIOptimizer />
                  </>
                ) : (
                  <div className="card empty-state">
                    <Sparkles size={64} color="#9ca3af" />
                    <h3>هوش مصنوعی آماده کمک است</h3>
                    <p>فایل سه‌بعدی خود را آپلود کنید تا بهترین تنظیمات را پیشنهاد دهیم</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <SettingsPanel />
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="card">
              <h2 style={{ marginBottom: '20px' }}>پیش‌نمایش و تولید G-Code</h2>
              <div className="preview-info">
                <div className="info-item">
                  <span>ارتفاع لایه:</span>
                  <strong>{slicingSettings?.layerHeight || 0.2} mm</strong>
                </div>
                <div className="info-item">
                  <span>پر شدگی:</span>
                  <strong>{slicingSettings?.infillDensity || 20}%</strong>
                </div>
                <div className="info-item">
                  <span>سرعت پرینت:</span>
                  <strong>{slicingSettings?.printSpeed || 50} mm/s</strong>
                </div>
                <div className="info-item">
                  <span>دما:</span>
                  <strong>{slicingSettings?.printingTemperature || 200}°C</strong>
                </div>
              </div>
              <button className="btn btn-success" style={{ marginTop: '20px', width: '100%' }}>
                <FileText size={20} />
                تولید G-Code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
