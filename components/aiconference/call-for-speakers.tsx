"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Calendar, MapPin, Send, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

const sessionFormats = [
  { id: "talk", label: "Talk (30-45 min)", description: "Standard presentation with Q&A" },
  { id: "lightning", label: "Lightning Talk (10 min)", description: "Quick, focused presentation" },
]

interface EntropyConfig {
  enabled: boolean
  intensity?: 'low' | 'medium' | 'high'
  duration?: number
  target?: 'mouse' | 'keyboard' | 'touch' | 'all'
  sessionId?: string
}

interface MagenEntropy {
  deploy: (config: EntropyConfig) => void
  stop?: () => void
}

declare global {
  interface Window {
    MagenEntropy?: MagenEntropy
  }
}

export function CallForSpeakers() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    sessionTitle: "",
    sessionFormat: "",
    abstract: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magenSessionId, setMagenSessionId] = useState<string | null>(null)
  const [entropyDeployed, setEntropyDeployed] = useState(false)

  // Check if MagenEntropy script is loaded
  const checkMagenEntropy = useCallback((): boolean => {
    return typeof window !== 'undefined' && typeof window.MagenEntropy !== 'undefined'
  }, [])

  // Deploy entropy flooding
  const deployEntropy = useCallback((config: EntropyConfig) => {
    if (!checkMagenEntropy() || !config.enabled) {
      return false
    }

    try {
      window.MagenEntropy!.deploy(config)
      setEntropyDeployed(true)
      return true
    } catch (error) {
      console.warn('Failed to deploy entropy flooding:', error)
      return false
    }
  }, [checkMagenEntropy])

  // Start MAGEN verification session via our API route
  useEffect(() => {
    let mounted = true
    let entropyCheckInterval: NodeJS.Timeout | null = null

    const startMagenSession = async () => {
      try {
        const response = await fetch('/api/magen/start-session', {
          method: 'POST',
        })

        if (response.ok) {
          const data = await response.json()
          
          if (mounted && data?.sessionId) {
            setMagenSessionId(data.sessionId)

            // Deploy entropy flooding immediately if config is provided
            if (data.entropyConfig) {
              // Wait for script to load if needed
              if (checkMagenEntropy()) {
                deployEntropy(data.entropyConfig)
              } else {
                // Poll for script availability
                entropyCheckInterval = setInterval(() => {
                  if (checkMagenEntropy() && mounted) {
                    deployEntropy(data.entropyConfig)
                    if (entropyCheckInterval) {
                      clearInterval(entropyCheckInterval)
                      entropyCheckInterval = null
                    }
                  }
                }, 100)

                // Stop polling after 5 seconds
                setTimeout(() => {
                  if (entropyCheckInterval) {
                    clearInterval(entropyCheckInterval)
                    entropyCheckInterval = null
                  }
                }, 5000)
              }
            }
          }
        }
      } catch {
        // MAGEN not available - form will still work without verification
      }
    }

    startMagenSession()

    return () => {
      mounted = false
      if (entropyCheckInterval) {
        clearInterval(entropyCheckInterval)
      }
    }
  }, [checkMagenEntropy, deployEntropy])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Verify Magen session before proceeding (if available)
      let verifiedHumanScore: number | undefined
      
      if (magenSessionId) {
        const verifyResponse = await fetch('/api/magen/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: magenSessionId }),
        })
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          
          // STEP 3: Deploy entropy flooding if enabled
          if (
            typeof window !== 'undefined' &&
            window.MagenEntropy &&
            verifyData?.entropyConfig?.enabled
          ) {
            window.MagenEntropy.deploy(verifyData.entropyConfig)
          }
          
          verifiedHumanScore = verifyData.humanScore
          
          if (verifyData.humanScore !== undefined && verifyData.humanScore < 0.7) {
            setError("Verification failed. Please try again.")
            setIsSubmitting(false)
            return
          }
        } else {
          // Verification failed but still try to deploy entropy if config provided
          const errorData = await verifyResponse.json().catch(() => ({}))
          
          if (
            typeof window !== 'undefined' &&
            window.MagenEntropy &&
            errorData?.entropyConfig?.enabled
          ) {
            window.MagenEntropy.deploy(errorData.entropyConfig)
          }
        }
      }

      // Submit to API with verified human score
      const response = await fetch('/api/call-for-speakers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          magenSessionId,
          magenHumanScore: verifiedHumanScore,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit proposal')
      }

      // Redirect to AI conference page after successful submission
      router.push('/events/morehumanthanhuman?submitted=true')
    } catch (err) {
      console.error('Form submission error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit proposal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              DEVSA AI Conference{" "}
              <span className="text-[#ef426f]">2026</span>
            </h1>

            <p className="mt-4 text-lg font-medium text-gray-600">
              Call For Speakers
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2.5 text-gray-700">
                <Calendar className="h-5 w-5 text-[#ef426f]" />
                <span className="font-semibold">February 28, 2026</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700">
                <MapPin className="h-5 w-5 text-[#ef426f]" />
                <span className="font-semibold">Geekdom 3rd Floor</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Speaker Information */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 sm:p-8">
              <h3 className="mb-6 text-lg font-bold tracking-tight text-gray-900">
                Speaker Information
              </h3>
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-900">
                      Full Name <span className="text-[#ef426f]">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#ef426f] focus:outline-none focus:ring-2 focus:ring-[#ef426f]/20 transition-all"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-900">
                      Email Address <span className="text-[#ef426f]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#ef426f] focus:outline-none focus:ring-2 focus:ring-[#ef426f]/20 transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="mb-2 block text-sm font-semibold text-gray-900">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#ef426f] focus:outline-none focus:ring-2 focus:ring-[#ef426f]/20 transition-all"
                    placeholder="Your company (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 sm:p-8">
              <h3 className="mb-6 text-lg font-bold tracking-tight text-gray-900">
                Talk Details
              </h3>
              <div className="space-y-5">
                <div>
                  <label htmlFor="sessionTitle" className="mb-2 block text-sm font-semibold text-gray-900">
                    Talk Title <span className="text-[#ef426f]">*</span>
                  </label>
                  <input
                    type="text"
                    id="sessionTitle"
                    name="sessionTitle"
                    required
                    value={formData.sessionTitle}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#ef426f] focus:outline-none focus:ring-2 focus:ring-[#ef426f]/20 transition-all"
                    placeholder="Give your talk a compelling title"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-900">
                    Format <span className="text-[#ef426f]">*</span>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sessionFormats.map((format) => (
                      <label
                        key={format.id}
                        className={`flex cursor-pointer items-start gap-3.5 rounded-xl border-2 bg-white p-4 shadow-sm transition-all ${
                          formData.sessionFormat === format.id
                            ? "border-[#ef426f] bg-[#ef426f]/5"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="sessionFormat"
                          value={format.id}
                          checked={formData.sessionFormat === format.id}
                          onChange={handleInputChange}
                          className="mt-0.5 h-4 w-4 accent-[#ef426f]"
                          required
                        />
                        <div className="flex-1">
                          <span className="block text-base font-semibold text-gray-900">{format.label}</span>
                          <p className="mt-1 text-sm leading-relaxed text-gray-500">{format.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="abstract" className="mb-2 block text-sm font-semibold text-gray-900">
                    Abstract <span className="text-[#ef426f]">*</span>
                  </label>
                  <textarea
                    id="abstract"
                    name="abstract"
                    required
                    rows={6}
                    value={formData.abstract}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base leading-relaxed text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#ef426f] focus:outline-none focus:ring-2 focus:ring-[#ef426f]/20 transition-all resize-none"
                    placeholder="Describe your talk. What will attendees learn? Why is this topic important?"
                  />
                  <p className="mt-2.5 text-sm leading-relaxed text-gray-500">
                    Aim for 150-300 words. Include key takeaways for attendees.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gray-900 px-6 py-4 text-base font-semibold text-white shadow-sm transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Proposal</span>
                    <Send className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Deadline:</span> January 31, 2026
                </p>
                <p className="text-sm text-gray-500">
                  Questions? Contact us at{" "}
                  <a href="mailto:hello@devsa.community" className="font-semibold text-[#ef426f] hover:underline">
                    hello@devsa.community
                  </a>
                </p>
              </div>

              {/* Magen protection notice */}
              <p className="text-center text-xs text-gray-400">
                Protected by{" "}
                <Link
                  href="https://magenminer.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#b45309] hover:text-[#92400e] font-medium transition-colors"
                >
                  MagenMiner
                </Link>
                {" "}bot detection
                {entropyDeployed && (
                  <span className="ml-2 text-green-500">• Entropy Active</span>
                )}
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  )
}
