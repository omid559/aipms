import { useStore } from '../store/useStore'
import { Layers, Zap, Thermometer, Fan, Gauge } from 'lucide-react'
import './SettingsPanel.css'

export default function SettingsPanel() {
  const { slicingSettings, updateSetting } = useStore()

  if (!slicingSettings) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: 'var(--gray)' }}>
          لطفاً ابتدا تنظیمات را با استفاده از AI بهینه‌سازی کنید یا به صورت دستی تنظیم نمایید.
        </p>
      </div>
    )
  }

  return (
    <div className="settings-panel">
      {/* Layer Settings */}
      <div className="card">
        <div className="section-header">
          <Layers size={20} />
          <h3>تنظیمات لایه</h3>
        </div>

        <div className="grid grid-3">
          <div className="setting-item">
            <label className="label">ارتفاع لایه (mm)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.layerHeight}
              onChange={(e) => updateSetting('layerHeight', parseFloat(e.target.value))}
              step="0.05"
              min="0.05"
              max="0.4"
            />
          </div>

          <div className="setting-item">
            <label className="label">عرض خط (mm)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.lineWidth}
              onChange={(e) => updateSetting('lineWidth', parseFloat(e.target.value))}
              step="0.1"
            />
          </div>

          <div className="setting-item">
            <label className="label">ضخامت دیوار (mm)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.wallThickness}
              onChange={(e) => updateSetting('wallThickness', parseFloat(e.target.value))}
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Infill Settings */}
      <div className="card">
        <div className="section-header">
          <Gauge size={20} />
          <h3>تنظیمات پرشدگی (Infill)</h3>
        </div>

        <div className="grid grid-3">
          <div className="setting-item">
            <label className="label">درصد پرشدگی (%)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.infillDensity}
              onChange={(e) => updateSetting('infillDensity', parseFloat(e.target.value))}
              min="0"
              max="100"
            />
            <input
              type="range"
              min="0"
              max="100"
              value={slicingSettings.infillDensity}
              onChange={(e) => updateSetting('infillDensity', parseFloat(e.target.value))}
              style={{ marginTop: '8px' }}
            />
          </div>

          <div className="setting-item">
            <label className="label">الگوی پرشدگی</label>
            <select
              className="select"
              value={slicingSettings.infillPattern}
              onChange={(e) => updateSetting('infillPattern', e.target.value)}
            >
              <option value="grid">Grid</option>
              <option value="lines">Lines</option>
              <option value="triangles">Triangles</option>
              <option value="tri-hexagon">Tri-Hexagon</option>
              <option value="cubic">Cubic</option>
              <option value="gyroid">Gyroid</option>
              <option value="honeycomb">Honeycomb</option>
            </select>
          </div>

          <div className="setting-item">
            <label className="label">عرض خط پرشدگی (mm)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.infillLineWidth}
              onChange={(e) => updateSetting('infillLineWidth', parseFloat(e.target.value))}
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Speed Settings */}
      <div className="card">
        <div className="section-header">
          <Zap size={20} />
          <h3>تنظیمات سرعت</h3>
        </div>

        <div className="grid grid-4">
          <div className="setting-item">
            <label className="label">سرعت پرینت (mm/s)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.printSpeed}
              onChange={(e) => updateSetting('printSpeed', parseFloat(e.target.value))}
            />
          </div>

          <div className="setting-item">
            <label className="label">سرعت پرشدگی (mm/s)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.infillSpeed}
              onChange={(e) => updateSetting('infillSpeed', parseFloat(e.target.value))}
            />
          </div>

          <div className="setting-item">
            <label className="label">سرعت دیوار (mm/s)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.wallSpeed}
              onChange={(e) => updateSetting('wallSpeed', parseFloat(e.target.value))}
            />
          </div>

          <div className="setting-item">
            <label className="label">سرعت حرکت (mm/s)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.travelSpeed}
              onChange={(e) => updateSetting('travelSpeed', parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Temperature Settings */}
      <div className="card">
        <div className="section-header">
          <Thermometer size={20} />
          <h3>تنظیمات دما</h3>
        </div>

        <div className="grid grid-3">
          <div className="setting-item">
            <label className="label">دمای نازل (°C)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.printingTemperature}
              onChange={(e) => updateSetting('printingTemperature', parseFloat(e.target.value))}
            />
          </div>

          <div className="setting-item">
            <label className="label">دمای صفحه (°C)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.buildPlateTemperature}
              onChange={(e) => updateSetting('buildPlateTemperature', parseFloat(e.target.value))}
            />
          </div>

          <div className="setting-item">
            <label className="label">دمای لایه اول (°C)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.initialLayerTemperature}
              onChange={(e) => updateSetting('initialLayerTemperature', parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Support Settings */}
      <div className="card">
        <div className="section-header">
          <h3>تنظیمات ساپورت</h3>
        </div>

        <div className="grid grid-3">
          <div className="setting-item">
            <label className="label">
              <input
                type="checkbox"
                checked={slicingSettings.supportEnabled}
                onChange={(e) => updateSetting('supportEnabled', e.target.checked)}
                style={{ marginLeft: '8px' }}
              />
              فعال‌سازی ساپورت
            </label>
          </div>

          {slicingSettings.supportEnabled && (
            <>
              <div className="setting-item">
                <label className="label">درصد ساپورت (%)</label>
                <input
                  type="number"
                  className="input"
                  value={slicingSettings.supportDensity}
                  onChange={(e) => updateSetting('supportDensity', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>

              <div className="setting-item">
                <label className="label">زاویه ساپورت (°)</label>
                <input
                  type="number"
                  className="input"
                  value={slicingSettings.supportOverhangAngle}
                  onChange={(e) => updateSetting('supportOverhangAngle', parseFloat(e.target.value))}
                  min="0"
                  max="90"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cooling Settings */}
      <div className="card">
        <div className="section-header">
          <Fan size={20} />
          <h3>تنظیمات خنک‌کننده</h3>
        </div>

        <div className="grid grid-2">
          <div className="setting-item">
            <label className="label">سرعت فن (%)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.fanSpeed}
              onChange={(e) => updateSetting('fanSpeed', parseFloat(e.target.value))}
              min="0"
              max="100"
            />
            <input
              type="range"
              min="0"
              max="100"
              value={slicingSettings.fanSpeed}
              onChange={(e) => updateSetting('fanSpeed', parseFloat(e.target.value))}
              style={{ marginTop: '8px' }}
            />
          </div>

          <div className="setting-item">
            <label className="label">سرعت فن لایه اول (%)</label>
            <input
              type="number"
              className="input"
              value={slicingSettings.initialLayerFanSpeed}
              onChange={(e) => updateSetting('initialLayerFanSpeed', parseFloat(e.target.value))}
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>

      {/* Retraction Settings */}
      <div className="card">
        <div className="section-header">
          <h3>تنظیمات Retraction</h3>
        </div>

        <div className="grid grid-3">
          <div className="setting-item">
            <label className="label">
              <input
                type="checkbox"
                checked={slicingSettings.retractionEnabled}
                onChange={(e) => updateSetting('retractionEnabled', e.target.checked)}
                style={{ marginLeft: '8px' }}
              />
              فعال‌سازی Retraction
            </label>
          </div>

          {slicingSettings.retractionEnabled && (
            <>
              <div className="setting-item">
                <label className="label">فاصله Retraction (mm)</label>
                <input
                  type="number"
                  className="input"
                  value={slicingSettings.retractionDistance}
                  onChange={(e) => updateSetting('retractionDistance', parseFloat(e.target.value))}
                  step="0.1"
                />
              </div>

              <div className="setting-item">
                <label className="label">سرعت Retraction (mm/s)</label>
                <input
                  type="number"
                  className="input"
                  value={slicingSettings.retractionSpeed}
                  onChange={(e) => updateSetting('retractionSpeed', parseFloat(e.target.value))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
