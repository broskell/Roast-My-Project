'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '../../../utils/apiClient'
import { FileText, Upload, Send, AlertTriangle } from 'lucide-react'

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      
      // Limit file size to 5MB
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Resume PDF size must be less than 5MB')
        return
      }

      // Check file type
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file')
        return
      }

      setFile(selectedFile)
      setError('')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0]
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Resume PDF size must be less than 5MB')
        return
      }
      if (selectedFile.type !== 'application/pdf') {
        setError('Please drop a PDF file')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select or drop a resume PDF first')
      return
    }

    setLoading(true)
    setError('')
    try {
      // 1. Upload PDF to Cloudinary folder 'resumes'
      setUploading(true)
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'resumes')

      const uploadResponse = await apiClient.post('/api/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (!uploadResponse.data.success) {
        throw new Error('PDF upload failed')
      }

      const { url, publicId } = uploadResponse.data
      setUploading(false)

      // 2. Trigger Gemini Resume review API
      setAnalyzing(true)
      const reviewResponse = await apiClient.post('/api/ai/resume-review', {
        resumeUrl: url,
        resumePublicId: publicId,
      })

      if (reviewResponse.data.success) {
        const resumeReview = reviewResponse.data.resumeReview
        // Redirect to resume results page
        router.push(`/results/resume/${resumeReview.id}`)
      } else {
        throw new Error('AI resume analysis failed')
      }

    } catch (err: any) {
      console.error('Resume submission error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to analyze resume. Please try again.')
      setUploading(false)
      setAnalyzing(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Roast My Resume</h1>
        <p className="text-sm text-white/50">Upload your professional resume in PDF format to get graded, roasted, and optimized by Gemini</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm text-orange-400 flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel rounded-3xl p-6 border-white/5">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              file 
                ? 'border-purple-500/40 bg-purple-500/5' 
                : 'border-white/10 hover:border-purple-500/30 hover:bg-white/1'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 relative animate-bounce">
                  <FileText className="h-10 w-10 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-white/40 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB - Click to replace</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="p-4 rounded-full bg-white/5 border border-white/10 mb-4">
                  <Upload className="h-6 w-6 text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">Drag and drop resume PDF here</p>
                <p className="text-xs text-white/40 mb-2">or click to browse local files</p>
                <p className="text-[10px] text-white/20">Supports PDF format (Max 5MB)</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-4 transition-colors cursor-pointer shadow-lg shadow-purple-600/10"
        >
          <Send className="h-5 w-5" />
          {loading 
            ? uploading 
              ? 'Uploading PDF to Cloudinary...' 
              : analyzing 
                ? 'Gemini AI is reading your resume (please wait)...' 
                : 'Processing...'
            : 'Submit & Get Graded'}
        </button>
      </form>
    </div>
  )
}
