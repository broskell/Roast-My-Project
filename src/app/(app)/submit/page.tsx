'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '../../../utils/apiClient'
import { Upload, Link as LinkIcon, Send, AlertTriangle, FileCheck } from 'lucide-react'

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)

export default function SubmitProjectPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot file size must be less than 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, WEBP)')
        return
      }

      setScreenshot(file)
      setUploadSuccess(false)
      setError('')
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot file size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Please drop an image file (PNG, JPG, WEBP)')
        return
      }
      setScreenshot(file)
      setUploadSuccess(false)
      setError('')
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !screenshot) {
      setError('Project Name, Description, and Screenshot are required')
      return
    }

    setLoading(true)
    setError('')
    try {
      setUploading(true)
      setUploadProgress(0)
      setUploadSuccess(false)
      const uploadFormData = new FormData()
      uploadFormData.append('file', screenshot)
      uploadFormData.append('folder', 'project-screenshots')

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
        throw new Error('Image upload failed')
      }

      const { url, publicId } = uploadResponse.data
      setUploadProgress(100)
      setUploadSuccess(true)
      setUploading(false)

      const projectResponse = await apiClient.post('/api/projects', {
        title,
        description,
        screenshotUrl: url,
        screenshotPublicId: publicId,
        githubUrl,
        liveUrl,
      })

      if (projectResponse.data.success) {
        const project = projectResponse.data.project
        router.push(`/results/project/${project.id}`)
      } else {
        throw new Error('Project save failed')
      }

    } catch (err: any) {
      console.error('Project submission failed:', err)
      setError(err.response?.data?.error || err.message || 'Failed to submit project. Please try again.')
      setUploading(false)
      setUploadSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-4 px-2">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Submit Your Project</h1>
        <p className="text-xs text-zinc-500">Provide screenshots and project details to run a visual review report</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-zinc-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-6 space-y-5">
          {/* Project Title */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Dashboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-700 text-sm focus:border-zinc-750 focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">
              Description *
            </label>
            <textarea
              placeholder="Briefly describe what your project does, who it's for, and the tech stack you used. This helps Gemini give a deeper technical critique."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-700 text-sm focus:border-zinc-750 focus:outline-none transition-colors resize-y"
            />
          </div>

          {/* Optional Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">
                GitHub Repository Link (Optional)
              </label>
              <div className="relative">
                <GithubIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-600" />
                <input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 placeholder-zinc-700 text-sm focus:border-zinc-750 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">
                Live Deployment URL (Optional)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-600" />
                <input
                  type="url"
                  placeholder="https://myproject.vercel.app"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 placeholder-zinc-700 text-sm focus:border-zinc-750 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Drag and Drop Screenshot Uploader */}
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-6">
          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">
            Project Screenshot * (Max 5MB)
          </label>
          
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              screenshotPreview 
                ? 'border-zinc-700 bg-zinc-900/40' 
                : 'border-zinc-800 bg-zinc-950/20 hover:border-zinc-700 hover:bg-zinc-900/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {screenshotPreview ? (
              <div className="flex flex-col items-center gap-4 animate-fadeIn">
                <div className="max-h-48 rounded-lg overflow-hidden border border-zinc-800 relative shadow-sm">
                  <img
                    src={screenshotPreview}
                    alt="Preview"
                    className="object-contain max-h-48"
                  />
                </div>
                <div className="text-xs text-zinc-300 font-semibold">
                  {screenshot?.name} ({(screenshot!.size / (1024 * 1024)).toFixed(2)} MB) - Click to replace
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="p-3.5 rounded-full bg-zinc-900 border border-zinc-800 mb-4 text-zinc-400">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-zinc-300 mb-1">Drag and drop screenshot here</p>
                <p className="text-xs text-zinc-500 mb-2">or click to browse local files</p>
                <p className="text-[10px] text-zinc-600">Supports PNG, JPG, WEBP</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons and Upload Progress Bar */}
        <div className="space-y-4">
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-400 font-medium">
                <span>Uploading screenshot...</span>
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
              <span>Screenshot successfully uploaded to Cloudinary</span>
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
                : 'Saving Project...' 
              : 'Submit & Continue to Roast'}
          </button>
        </div>
      </form>
    </div>
  )
}
