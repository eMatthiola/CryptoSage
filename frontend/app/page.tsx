'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getApiUrl, config } from '@/lib/config'

export default function Home() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [apiData, setApiData] = useState<any>(null)

  useEffect(() => {
    checkApiStatus()
  }, [])

  const checkApiStatus = async () => {
    try {
      const response = await fetch(getApiUrl(config.endpoints.health))
      const data = await response.json()
      setApiData(data)
      setApiStatus('online')
    } catch (error) {
      setApiStatus('offline')
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-gradient-to-b from-white to-gray-50">
      <div className="z-10 max-w-6xl w-full">
        {/* Header - Claude style: simple and focused */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-6">
            {/* Custom Icon - atomic design representing data aggregation */}
            <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              {/* Central core */}
              <circle cx="24" cy="24" r="4" fill="url(#brandGradient)"/>
              {/* Data nodes */}
              <circle cx="12" cy="12" r="2.5" fill="#3b82f6" opacity="0.8"/>
              <circle cx="36" cy="12" r="2.5" fill="#3b82f6" opacity="0.8"/>
              <circle cx="12" cy="36" r="2.5" fill="#7c3aed" opacity="0.8"/>
              <circle cx="36" cy="36" r="2.5" fill="#7c3aed" opacity="0.8"/>
              {/* Connection lines */}
              <line x1="12" y1="12" x2="24" y2="24" stroke="#3b82f6" strokeWidth="1" opacity="0.3"/>
              <line x1="36" y1="12" x2="24" y2="24" stroke="#3b82f6" strokeWidth="1" opacity="0.3"/>
              <line x1="12" y1="36" x2="24" y2="24" stroke="#7c3aed" strokeWidth="1" opacity="0.3"/>
              <line x1="36" y1="36" x2="24" y2="24" stroke="#7c3aed" strokeWidth="1" opacity="0.3"/>
            </svg>
            <h1 className="text-5xl font-semibold text-gray-900">
              CryptoSage
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Real-time crypto market intelligence. Aggregate information from multiple sources,
            powered by AI to help you understand what's happening.
          </p>
        </div>

        {/* Status - Claude style: minimal and clear */}
        <div className="mb-16 max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-700">System Status</h2>
              <div className="flex gap-2">
                <StatusBadge label="Frontend" status="online" />
                <StatusBadge
                  label="Backend"
                  status={apiStatus}
                />
              </div>
            </div>

            {apiData && (
              <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <code className="text-xs text-gray-600 font-mono">
                  {apiData.message} • v{apiData.version}
                </code>
              </div>
            )}

            {apiStatus === 'offline' && (
              <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-900">
                  Backend API is offline. Start it with:
                </p>
                <code className="block mt-2 p-2 bg-gray-900 text-gray-100 rounded text-xs font-mono">
                  cd backend && uvicorn app.main:app --reload
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Features - Claude style: clean cards with custom icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          <FeatureCard
            title="Market Radar"
            description="Track price movements and detect significant changes in real-time using WebSocket connections"
            href="/dashboard"
            gradient="from-blue-500 to-cyan-500"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </FeatureCard>

          <FeatureCard
            title="News Aggregation"
            description="Collect and analyze news from CoinDesk, Cointelegraph, Decrypt, and The Block with sentiment analysis"
            href="/dashboard"
            gradient="from-violet-500 to-purple-500"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </FeatureCard>

          <FeatureCard
            title="AI Intelligence"
            description="Ask questions about market trends, get AI-powered insights based on real-time data and news"
            href="/chat"
            gradient="from-pink-500 to-rose-500"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </FeatureCard>
        </div>

        {/* CTA - Claude style: subtle and purposeful */}
        <div className="flex gap-4 justify-center mb-12">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition font-medium inline-flex items-center gap-2"
          >
            Get Started
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <a
            href={getApiUrl(config.endpoints.docs)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition font-medium text-gray-700"
          >
            API Docs
          </a>
        </div>

        {/* Disclaimer - Claude style: clear and honest */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-900 leading-relaxed">
                CryptoSage is an information aggregation platform. We help you understand market changes through data and AI analysis.
                We do not provide trading signals or investment advice.
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Claude style: minimal */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>Built with Next.js, FastAPI, and Claude AI</p>
          <p className="text-xs">v0.1.0</p>
        </div>
      </div>
    </main>
  )
}

function StatusBadge({
  label,
  status
}: {
  label: string
  status: 'checking' | 'online' | 'offline'
}) {
  const styles = {
    checking: 'bg-gray-100 text-gray-600',
    online: 'bg-emerald-100 text-emerald-700',
    offline: 'bg-red-100 text-red-700'
  }

  const icons = {
    checking: '○',
    online: '●',
    offline: '○'
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      <span className="mr-1">{icons[status]}</span>
      {label}
    </span>
  )
}

function FeatureCard({
  title,
  description,
  href,
  gradient,
  children
}: {
  title: string
  description: string
  href: string
  gradient: string
  children: React.ReactNode
}) {
  return (
    <Link href={href}>
      <div className="group p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer bg-white h-full">
        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${gradient} text-white mb-4 group-hover:scale-110 transition-transform`}>
          {children}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  )
}
