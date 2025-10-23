import { useState } from 'react'
import { FileText, Download, Package, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { generateGCode, downloadGCode, download3MF } from '../api/client'
import './GCodeGenerator.css'

export default function GCodeGenerator() {
  const { uploadedFile, slicingSettings, selectedPrinter } = useStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const handleGenerate = async () => {
    if (!uploadedFile || !slicingSettings || !selectedPrinter) {
      setError('لطفاً فایل، تنظیمات و پرینتر را انتخاب کنید')
      return
    }

    setIsGenerating(true)
    setError('')
    setResult(null)

    try {
      const response = await generateGCode({
        filePath: uploadedFile.path,
        settings: slicingSettings,
        printerProfile: selectedPrinter,
        generate3MF: true,
      })

      setResult(response)
    } catch (err) {
      console.error('G-code generation error:', err)
      setError('خطا در تولید G-code. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadGCode = () => {
    if (result?.gcodePath) {
      const filename = result.gcodePath.split('/').pop()
      downloadGCode(filename)
    }
  }

  const handleDownload3MF = () => {
    if (result?.threeMFPath) {
      const filename = result.threeMFPath.split('/').pop()
      download3MF(filename)
    }
  }

  return (
    <div className="gcode-generator">
      <h2>پیش‌نمایش و تولید G-Code</h2>

      <div className="settings-summary">
        <h3>خلاصه تنظیمات</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span>ارتفاع لایه:</span>
            <strong>{slicingSettings?.layerHeight || 0.2} mm</strong>
          </div>
          <div className="summary-item">
            <span>پر شدگی:</span>
            <strong>{slicingSettings?.infillDensity || 20}%</strong>
          </div>
          <div className="summary-item">
            <span>الگوی پرشدگی:</span>
            <strong>{slicingSettings?.infillPattern || 'grid'}</strong>
          </div>
          <div className="summary-item">
            <span>سرعت پرینت:</span>
            <strong>{slicingSettings?.printSpeed || 50} mm/s</strong>
          </div>
          <div className="summary-item">
            <span>دمای نازل:</span>
            <strong>{slicingSettings?.printingTemperature || 200}°C</strong>
          </div>
          <div className="summary-item">
            <span>دمای صفحه:</span>
            <strong>{slicingSettings?.buildPlateTemperature || 60}°C</strong>
          </div>
          <div className="summary-item">
            <span>ساپورت:</span>
            <strong>{slicingSettings?.supportEnabled ? 'فعال' : 'غیرفعال'}</strong>
          </div>
          <div className="summary-item">
            <span>پرینتر:</span>
            <strong>{selectedPrinter?.name || 'نامشخص'}</strong>
          </div>
        </div>
      </div>

      {!result && !isGenerating && (
        <button
          className="btn btn-success generate-btn"
          onClick={handleGenerate}
          disabled={!uploadedFile || !slicingSettings || !selectedPrinter}
        >
          <FileText size={20} />
          تولید G-Code و 3MF
        </button>
      )}

      {isGenerating && (
        <div className="generating">
          <Loader2 size={48} className="spinner-icon" />
          <h3>در حال تولید G-Code با OrcaSlicer...</h3>
          <p>این کار ممکن است چند لحظه طول بکشد</p>
        </div>
      )}

      {result && (
        <div className="result-section">
          <div className="success-message">
            <FileText size={32} color="#10b981" />
            <div>
              <h3>G-Code با موفقیت تولید شد!</h3>
              <p>فایل‌های شما آماده دانلود هستند</p>
            </div>
          </div>

          <div className="metadata-grid">
            <div className="metadata-item">
              <span>تعداد لایه:</span>
              <strong>{result.metadata.layerCount}</strong>
            </div>
            <div className="metadata-item">
              <span>زمان تقریبی:</span>
              <strong>{result.metadata.estimatedTime}</strong>
            </div>
            <div className="metadata-item">
              <span>طول فیلامنت:</span>
              <strong>{result.metadata.filamentLength}</strong>
            </div>
            <div className="metadata-item">
              <span>وزن فیلامنت:</span>
              <strong>{result.metadata.filamentWeight}</strong>
            </div>
          </div>

          <div className="download-buttons">
            <button className="btn btn-primary" onClick={handleDownloadGCode}>
              <Download size={20} />
              دانلود G-Code
            </button>

            {result.threeMFPath && (
              <button className="btn btn-secondary" onClick={handleDownload3MF}>
                <Package size={20} />
                دانلود فایل پروژه (3MF)
              </button>
            )}
          </div>

          <button
            className="btn btn-success generate-btn"
            onClick={handleGenerate}
            style={{ marginTop: '16px' }}
          >
            <FileText size={20} />
            تولید مجدد
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  )
}
