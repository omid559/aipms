import { useCallback, useState } from 'react'
import { Upload, File, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { uploadFile, analyzeModel } from '../api/client'
import './FileUploader.css'

export default function FileUploader() {
  const { uploadedFile, setUploadedFile, setModelAnalysis } = useStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleFileUpload(files[0])
    }
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleFileUpload(files[0])
    }
  }, [])

  const handleFileUpload = async (file: File) => {
    const validExtensions = ['.stl', '.obj', '.3mf']
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

    if (!validExtensions.includes(fileExtension)) {
      alert('فرمت فایل نامعتبر است. فقط فایل‌های STL, OBJ و 3MF پشتیبانی می‌شوند.')
      return
    }

    setIsUploading(true)

    try {
      const uploadResponse = await uploadFile(file)
      setUploadedFile(uploadResponse.file)

      // Analyze the model
      const analysisResponse = await analyzeModel(uploadResponse.file.path)
      setModelAnalysis(analysisResponse.analysis)
    } catch (error) {
      console.error('Upload error:', error)
      alert('خطا در آپلود فایل')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setModelAnalysis(null)
  }

  if (uploadedFile) {
    return (
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>فایل آپلود شده</h3>
        <div className="uploaded-file">
          <File size={40} color="#3b82f6" />
          <div className="file-info">
            <strong>{uploadedFile.originalName}</strong>
            <span>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <button className="btn-remove" onClick={handleRemoveFile}>
            <X size={20} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: '16px' }}>آپلود فایل سه‌بعدی</h3>
      <div
        className={`dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="uploading">
            <div className="spinner"></div>
            <p>در حال آپلود...</p>
          </div>
        ) : (
          <>
            <Upload size={48} color="#9ca3af" />
            <h4>فایل را اینجا بکشید یا کلیک کنید</h4>
            <p>فرمت‌های پشتیبانی شده: STL, OBJ, 3MF</p>
            <input
              type="file"
              accept=".stl,.obj,.3mf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="btn btn-primary" style={{ marginTop: '16px' }}>
              انتخاب فایل
            </label>
          </>
        )}
      </div>
    </div>
  )
}
