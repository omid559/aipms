import { useState } from 'react'
import { X, Star, Image as ImageIcon, Settings, MessageSquare } from 'lucide-react'
import { api } from '../api/client'
import './FeedbackModal.css'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  historyId: string
  onSubmitted: () => void
}

export default function FeedbackModal({
  isOpen,
  onClose,
  historyId,
  onSubmitted
}: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<'quick' | 'detailed' | 'image' | 'settings'>('quick')
  const [rating, setRating] = useState(0)
  const [comments, setComments] = useState('')
  const [printQuality, setPrintQuality] = useState<string>('')
  const [issues, setIssues] = useState<string[]>([])
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const commonIssues = [
    'stringing',
    'warping',
    'layer_shifts',
    'under_extrusion',
    'over_extrusion',
    'poor_bridging',
    'support_marks',
    'surface_defects',
    'dimensional_inaccuracy',
    'first_layer_issues'
  ]

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      if (feedbackType === 'quick') {
        await api.post('/learning/feedback/quick', {
          historyId,
          rating,
          comments
        })
      } else if (feedbackType === 'detailed') {
        await api.post('/learning/feedback/detailed', {
          historyId,
          printQuality,
          issues,
          comments
        })
      } else if (feedbackType === 'image') {
        const formData = new FormData()
        formData.append('historyId', historyId)
        formData.append('printSuccessful', rating >= 4 ? 'true' : 'false')
        formData.append('comments', comments)
        images.forEach(img => formData.append('images', img))

        await api.post('/learning/feedback/images', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      alert('فیدبک با موفقیت ثبت شد! از کمک شما متشکریم 🙏')
      onSubmitted()
      onClose()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('خطا در ثبت فیدبک')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImages(prev => [...prev, ...files].slice(0, 5))
  }

  const toggleIssue = (issue: string) => {
    setIssues(prev =>
      prev.includes(issue)
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    )
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ثبت فیدبک و کمک به یادگیری AI</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="feedback-types">
          <button
            className={`type-btn ${feedbackType === 'quick' ? 'active' : ''}`}
            onClick={() => setFeedbackType('quick')}
          >
            <Star size={20} />
            امتیازدهی سریع
          </button>
          <button
            className={`type-btn ${feedbackType === 'detailed' ? 'active' : ''}`}
            onClick={() => setFeedbackType('detailed')}
          >
            <MessageSquare size={20} />
            فیدبک دقیق
          </button>
          <button
            className={`type-btn ${feedbackType === 'image' ? 'active' : ''}`}
            onClick={() => setFeedbackType('image')}
          >
            <ImageIcon size={20} />
            آپلود عکس
          </button>
        </div>

        <div className="modal-body">
          {feedbackType === 'quick' && (
            <div className="quick-feedback">
              <p>کیفیت پرینت را امتیاز دهید:</p>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    className={`star ${rating >= star ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    <Star size={32} />
                  </button>
                ))}
              </div>
              <textarea
                className="feedback-textarea"
                placeholder="نظرات اضافی (اختیاری)..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {feedbackType === 'detailed' && (
            <div className="detailed-feedback">
              <div className="form-group">
                <label>کیفیت کلی پرینت:</label>
                <select
                  className="select"
                  value={printQuality}
                  onChange={e => setPrintQuality(e.target.value)}
                >
                  <option value="">انتخاب کنید...</option>
                  <option value="excellent">عالی</option>
                  <option value="good">خوب</option>
                  <option value="fair">متوسط</option>
                  <option value="poor">ضعیف</option>
                </select>
              </div>

              <div className="form-group">
                <label>مشکلات مشاهده شده:</label>
                <div className="issues-grid">
                  {commonIssues.map(issue => (
                    <button
                      key={issue}
                      className={`issue-chip ${issues.includes(issue) ? 'selected' : ''}`}
                      onClick={() => toggleIssue(issue)}
                    >
                      {issue.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="feedback-textarea"
                placeholder="توضیحات بیشتر..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {feedbackType === 'image' && (
            <div className="image-feedback">
              <div className="upload-info">
                <ImageIcon size={48} color="#667eea" />
                <h3>عکس قطعه پرینت شده را آپلود کنید</h3>
                <p>هوش مصنوعی عکس را تحلیل کرده و مشکلات را شناسایی می‌کند</p>
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                style={{ display: 'none' }}
                id="image-upload"
              />

              <label htmlFor="image-upload" className="btn btn-primary">
                <ImageIcon size={20} />
                انتخاب عکس‌ها (حداکثر 5)
              </label>

              {images.length > 0 && (
                <div className="selected-images">
                  <p>{images.length} عکس انتخاب شده</p>
                  <div className="image-list">
                    {images.map((img, index) => (
                      <div key={index} className="image-item">
                        <span>{img.name}</span>
                        <button
                          className="remove-btn"
                          onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rating-stars" style={{ marginTop: '16px' }}>
                <p>نتیجه کلی:</p>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    className={`star ${rating >= star ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    <Star size={28} />
                  </button>
                ))}
              </div>

              <textarea
                className="feedback-textarea"
                placeholder="توضیحات اضافی..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            انصراف
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || (feedbackType === 'quick' && rating === 0)}
          >
            {isSubmitting ? 'در حال ارسال...' : 'ثبت فیدبک'}
          </button>
        </div>
      </div>
    </div>
  )
}
