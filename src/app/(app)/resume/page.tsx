'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '../../../utils/apiClient'
import { FileText, Upload, Send, AlertTriangle, FileCheck } from 'lucide-react'

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Resume PDF size must be less than 5MB')
        return
      }

      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file')
        return
      }

      setFile(selectedFile)
      setUploadSuccess(false)
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
      setUploadSuccess(false)
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
      setUploading(true)
      setUploadProgress(0)
      setUploadSuccess(false)
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'resumes')

      const uploadResponse = await apiClient.post('/api/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percent)
          }
        }
      })

      if (!uploadResponse.data.success) {
        throw new Error('PDF upload failed')
      }

      const { url, publicId } = uploadResponse.data
      setUploadProgress(100)
      setUploadSuccess(true)
      setUploading(false)

      setAnalyzing(true)
      const reviewFormData = new FormData()
      reviewFormData.append('file', file)
      reviewFormData.append('resumeUrl', url)
      reviewFormData.append('resumePublicId', publicId)

      const reviewResponse = await apiClient.post('/api/ai/resume-review', reviewFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (reviewResponse.data.success) {
        const resumeReview = reviewResponse.data.resumeReview
        router.push(`/results/resume/${resumeReview.id}`)
      } else {
        throw new Error('AI resume analysis failed')
      }

    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any
      console.error('Resume submission error:', errorObj)
      const resData = errorObj.response?.data
      if (resData && resData.requestId) {
        setError(`[Error Stage: ${resData.stage || 'unknown'}][ID: ${resData.requestId.substring(0, 8)}] - ${resData.error || 'Failed to analyze resume'}`)
      } else {
        setError(errorObj.response?.data?.error || errorObj.message || 'Failed to analyze resume. Please try again.')
      }
      setUploading(false)
      setUploadSuccess(false)
      setAnalyzing(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight mb-2">Resume Review Workspace</h1>
        <p className="text-xs text-zinc-500">Upload your professional resume in PDF format to evaluate ATS compatibility, receive structural critiques, and get concrete suggestions</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-zinc-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-6">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              file 
                ? 'border-zinc-700 bg-zinc-900/40' 
                : 'border-zinc-850 bg-zinc-950/20 hover:border-zinc-700 hover:bg-zinc-900/20'
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
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 relative animate-pulse">
                  <FileText className="h-10 w-10 text-zinc-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-200 truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB - Click to replace</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4 text-zinc-400">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-zinc-300 mb-1">Drag and drop resume PDF here</p>
                <p className="text-xs text-zinc-500 mb-2">or click to browse local files</p>
                <p className="text-[10px] text-zinc-600">Supports PDF format (Max 5MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons and Upload Progress Bar */}
        <div className="space-y-4">
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-400 font-medium">
                <span>Uploading resume...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-100 rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
              <FileCheck className="h-4 w-4 text-zinc-300" />
              <span>Resume successfully uploaded to Cloudinary</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold py-4 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <Send className="h-5 w-5" />
            {loading 
              ? uploading 
                ? `Uploading: ${uploadProgress}%` 
                : analyzing
                  ? 'Gemini ATS checking (this takes 4-6s)...'
                  : 'Saving Resume...' 
              : 'Submit & Get Graded'}
          </button>
        </div>
      </form>
    </div>
  )
}
