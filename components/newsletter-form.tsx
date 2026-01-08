"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, CheckCircle, Mail } from "lucide-react"
import Link from "next/link"

interface NewsletterFormProps {
  source?: string
  className?: string
}

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

export function NewsletterForm({ source = "footer", className = "" }: NewsletterFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
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

  // Start Magen session for bot protection
  useEffect(() => {
    let mounted = true
    let entropyCheckInterval: NodeJS.Timeout | null = null

    const startMagenSession = async () => {
      try {
        const response = await fetch('/api/magen/start-session', {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error('Failed to start session')
        }

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
      } catch (error) {
        // Magen not available - continue without it
        console.warn('Magen session start failed:', error)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    try {
      let verifiedHumanScore: number | undefined
      
      if (magenSessionId) {
        const verifyResponse = await fetch('/api/magen/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: magenSessionId }),
        })

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json()
          
          // Deploy or update entropy flooding if enabled
          if (verifyData?.entropyConfig?.enabled) {
            deployEntropy(verifyData.entropyConfig)
          }
          
          verifiedHumanScore = verifyData.humanScore
          
          // Check human score threshold (0.7)
          if (verifiedHumanScore !== undefined && verifiedHumanScore < 0.7) {
            setStatus("error")
            setErrorMessage("Verification failed. Please try again.")
            return
          }
        } else {
          // Verification failed but continue with form submission
          const errorData = await verifyResponse.json().catch(() => ({}))
          console.warn('Magen verification failed:', errorData)
          
          // Still deploy entropy if config provided
          if (errorData?.entropyConfig?.enabled) {
            deployEntropy(errorData.entropyConfig)
          }
        }
      }

      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source,
          magenSessionId,
          magenHumanScore: verifiedHumanScore,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus("success")
      setEmail("")
    } catch (err: any) {
      setStatus("error")
      setErrorMessage(err instanceof Error ? err.message : 'Failed to subscribe')
    }
  }

  if (status === "success") {
    return (
      <div className={`flex items-center gap-3 text-green-400 ${className}`}>
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Thanks for subscribing!</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`${className}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={status === "loading"}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-[#ef426f] focus:outline-none focus:ring-2 focus:ring-[#ef426f]/20 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-[#ef426f] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d63760] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : (
            "Subscribe"
          )}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
      )}
      <p className="mt-2 text-xs text-gray-500">
        Protected by{" "}
        <Link
          href="https://magenminer.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#f59e0b] hover:text-[#fbbf24] transition-colors"
        >
          Magen
        </Link>
        {entropyDeployed && (
          <span className="ml-2 text-green-400">• Entropy Active</span>
        )}
      </p>
    </form>
  )
}
