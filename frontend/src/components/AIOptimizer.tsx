import { useState } from 'react'
import { Sparkles, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'
import { optimizeWithAI } from '../api/client'
import './AIOptimizer.css'

export default function AIOptimizer() {
  const {
    modelAnalysis,
    selectedMaterial,
    selectedPrinter,
    setSlicingSettings,
    setIsOptimizing,
    isOptimizing,
  } = useStore()

  const [optimizationResult, setOptimizationResult] = useState<string>('')

  const handleOptimize = async () => {
    if (!modelAnalysis || !selectedMaterial || !selectedPrinter) {
      alert('لطفاً ابتدا فایل را آپلود کرده و پروفایل‌ها را انتخاب کنید')
      return
    }

    setIsOptimizing(true)
    setOptimizationResult('')

    try {
      const response = await optimizeWithAI({
        modelAnalysis,
        materialProfile: selectedMaterial,
        printerProfile: selectedPrinter,
      })

      setSlicingSettings(response.settings)
      setOptimizationResult(response.message || 'تنظیمات با موفقیت بهینه‌سازی شد')
    } catch (error) {
      console.error('Optimization error:', error)
      setOptimizationResult('خطا در بهینه‌سازی. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <div className="card ai-optimizer">
      <div className="ai-header">
        <Sparkles size={24} color="#8b5cf6" />
        <h3>بهینه‌سازی با هوش مصنوعی</h3>
      </div>

      <p className="ai-description">
        هوش مصنوعی مدل سه‌بعدی شما را تحلیل کرده و بهترین تنظیمات اسلایس را پیشنهاد می‌دهد.
        این بهینه‌سازی شامل تنظیم خودکار سرعت، دما، پرشدگی و سایر پارامترهای حیاتی است.
      </p>

      <div className="ai-features">
        <div className="feature">
          <Zap size={16} />
          <span>تحلیل هوشمند مدل</span>
        </div>
        <div className="feature">
          <Zap size={16} />
          <span>بهینه‌سازی سرعت و کیفیت</span>
        </div>
        <div className="feature">
          <Zap size={16} />
          <span>تشخیص خودکار نیاز به ساپورت</span>
        </div>
        <div className="feature">
          <Zap size={16} />
          <span>تنظیم دما بر اساس مواد</span>
        </div>
      </div>

      <button
        className="btn btn-secondary"
        onClick={handleOptimize}
        disabled={isOptimizing || !modelAnalysis || !selectedMaterial || !selectedPrinter}
        style={{ width: '100%', marginTop: '16px' }}
      >
        {isOptimizing ? (
          <>
            <div className="spinner-small"></div>
            در حال بهینه‌سازی...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            بهینه‌سازی با AI
          </>
        )}
      </button>

      {optimizationResult && (
        <div className={`optimization-result ${optimizationResult.includes('خطا') ? 'error' : 'success'}`}>
          {optimizationResult}
        </div>
      )}
    </div>
  )
}
