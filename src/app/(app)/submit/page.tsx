'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '../../../utils/apiClient'
import { Upload, Link as LinkIcon, Send, AlertTriangle } from 'lucide-react'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot file size must be less than 5MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, WEBP)')
        return
      }

      setScreenshot(file)
      setError('')
      
      // Create local preview URL
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
      // 1. Upload screenshot to Cloudinary via backend
      setUploading(true)
      const uploadFormData = new FormData()
      uploadFormData.append('file', screenshot)
      uploadFormData.append('folder', 'project-screenshots')

      const uploadResponse = await apiClient.post('/api/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (!uploadResponse.data.success) {
        throw new Error('Image upload failed')
      }

      const { url, publicId } = uploadResponse.data
      setUploading(false)

      // 2. Save project details in database
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
        // Redirect to results page where the review generation will start
        router.push(`/results/project/${project.id}`)
      } else {
        throw new Error('Project save failed')
      }

    } catch (err: any) {
      console.error('Project submission failed:', err)
      setError(err.response?.data?.error || err.message || 'Failed to submit project. Please try again.')
      setUploading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-4 px-2">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Submit Your Project</h1>
        <p className="text-sm text-white/50">Upload a screenshot and provide descriptions to prepare your roast report</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm text-orange-400 flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel rounded-2xl p-6 border-white/5 space-y-5">
          {/* Project Title */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 font-bold mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              placeholder="e.g. My Awesome SaaS App"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full glass-panel rounded-xl px-4 py-3 bg-white/2 border-white/5 focus:border-purple-500/50 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-0"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 font-bold mb-1.5">
              Description *
            </label>
            <textarea
              placeholder="Briefly describe what your project does, who it's for, and the tech stack you used. This helps Gemini give a deeper technical critique."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full glass-panel rounded-xl px-4 py-3 bg-white/2 border-white/5 focus:border-purple-500/50 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-0 resize-y"
            />
          </div>

          {/* Optional Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 font-bold mb-1.5">
                GitHub Repository Link (Optional)
              </label>
              <div className="relative">
                <GithubIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-white/30" />
                <input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full glass-panel rounded-xl pl-10 pr-4 py-3 bg-white/2 border-white/5 focus:border-purple-500/50 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 font-bold mb-1.5">
                Live Deployment URL (Optional)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-white/30" />
                <input
                  type="url"
                  placeholder="https://myproject.vercel.app"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  className="w-full glass-panel rounded-xl pl-10 pr-4 py-3 bg-white/2 border-white/5 focus:border-purple-500/50 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Drag and Drop Screenshot Uploader */}
        <div className="glass-panel rounded-2xl p-6 border-white/5">
          <label className="block text-xs uppercase tracking-wider text-white/40 font-bold mb-2">
            Project Screenshot * (Max 5MB)
          </label>
          
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              screenshotPreview 
                ? 'border-purple-500/30 bg-purple-500/5' 
                : 'border-white/10 hover:border-purple-500/30 hover:bg-white/1'
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
              <div className="flex flex-col items-center gap-4">
                <div className="max-h-48 rounded-lg overflow-hidden border border-white/10 relative shadow-lg">
                  <img
                    src={screenshotPreview}
                    alt="Preview"
                    className="object-contain max-h-48"
                  />
                </div>
                <div className="text-xs text-purple-300 font-semibold">
                  {screenshot?.name} ({(screenshot!.size / (1024 * 1024)).toFixed(2)} MB) - Click to replace
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="p-3.5 rounded-full bg-white/5 border border-white/10 mb-4">
                  <Upload className="h-6 w-6 text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-white mb-1">Drag and drop screenshot here</p>
                <p className="text-xs text-white/40 mb-2">or click to browse local files</p>
                <p className="text-[10px] text-white/20">Supports PNG, JPG, WEBP</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-4 transition-colors cursor-pointer shadow-lg shadow-purple-600/10"
        >
          <Send className="h-5 w-5" />
          {loading 
            ? uploading 
              ? 'Uploading Image to Cloudinary...' 
              : 'Saving Project...' 
            : 'Submit & Continue to Roast'}
        </button>
      </form>
    </div>
  )
}
