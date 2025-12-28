'use client'

import { useState, useEffect } from 'react'

import { getApiUrl, config } from '@/lib/config'
interface ChangeSnapshotProps {
  symbol: string
  wsData?: {
    priceChange: number
    volumeChange: number
    rsiShift: { from: number; to: number }
    momentum: 'rising' | 'falling' | 'neutral'
    newsCount: number
    newsTopic: string
    timestamp: string
  } | null
}

interface SnapshotData {
  priceChange: number
  volumeChange: number
  rsiShift: { from: number; to: number }
  momentum: 'rising' | 'falling' | 'neutral'
  newsCount: number
  newsTopic: string
}

export function ChangeSnapshot({ symbol, wsData }: ChangeSnapshotProps) {
  const [data, setData] = useState<SnapshotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Update data when WebSocket data changes
  useEffect(() => {
    if (wsData) {
      setData({
        priceChange: wsData.priceChange,
        volumeChange: wsData.volumeChange,
        rsiShift: wsData.rsiShift,
        momentum: wsData.momentum,
        newsCount: wsData.newsCount,
        newsTopic: wsData.newsTopic
      })
      setLoading(false)
      setError(null)
    }
  }, [wsData])

  // Fallback to HTTP polling if no WebSocket data
  useEffect(() => {
    if (wsData !== undefined) return // WebSocket is active, don't use HTTP

    fetchSnapshot()
    const interval = setInterval(fetchSnapshot, 30000)
    return () => clearInterval(interval)
  }, [symbol, wsData])

  const fetchSnapshot = async () => {
    setLoading(true)
    setError(null)
    try {
      const symbolWithPair = symbol.toUpperCase().endsWith('USDT') ? symbol : `${symbol}USDT`
      const response = await fetch(getApiUrl(config.endpoints.radarSnapshot(symbolWithPair)))

      if (!response.ok) {
        throw new Error('Failed to fetch snapshot data')
      }

      const apiData = await response.json()

      setData({
        priceChange: apiData.priceChange,
        volumeChange: apiData.volumeChange,
        rsiShift: {
          from: apiData.rsiShift.from,
          to: apiData.rsiShift.to
        },
        momentum: apiData.momentum,
        newsCount: apiData.newsCount,
        newsTopic: apiData.newsTopic
      })
    } catch (err) {
      console.error('Error fetching snapshot:', err)
      setError('Unable to load market snapshot. Please try again.')
      // Fallback to mock data on error
      setData({
        priceChange: (Math.random() - 0.5) * 5,
        volumeChange: Math.random() * 200 - 50,
        rsiShift: {
          from: 60 + Math.random() * 20,
          to: 60 + Math.random() * 20
        },
        momentum: Math.random() > 0.5 ? 'rising' : Math.random() > 0.25 ? 'falling' : 'neutral',
        newsCount: Math.floor(Math.random() * 5),
        newsTopic: ['Regulatory', 'Technical', 'Market', 'Adoption'][Math.floor(Math.random() * 4)]
      })
    } finally {
      setLoading(false)
    }
  }

  const getPriceChangeStyle = (change: number) => {
    if (change > 2) return {
      bg: 'bg-white',
      border: 'border-[#c17555]',
      text: 'text-[#c17555]',
      label: 'High Gain',
      icon: '📈'
    }
    if (change > 0) return {
      bg: 'bg-white',
      border: 'border-[#d09573]',
      text: 'text-[#c17555]',
      label: 'Positive',
      icon: '↗️'
    }
    if (change < -2) return {
      bg: 'bg-white',
      border: 'border-[#a86448]',
      text: 'text-[#a86448]',
      label: 'Sharp Drop',
      icon: '📉'
    }
    if (change < 0) return {
      bg: 'bg-white',
      border: 'border-[#d4a88e]',
      text: 'text-[#a86448]',
      label: 'Negative',
      icon: '↘️'
    }
    return {
      bg: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-600',
      label: 'Flat',
      icon: '➡️'
    }
  }

  const getVolumeStyle = (change: number) => {
    if (change > 100) return {
      bg: 'bg-white',
      border: 'border-[#a86448]',
      text: 'text-[#a86448]',
      label: 'Extreme Surge',
      severity: '📊'
    }
    if (change > 50) return {
      bg: 'bg-white',
      border: 'border-[#c17555]',
      text: 'text-[#c17555]',
      label: 'Notable Increase',
      severity: '📊'
    }
    return {
      bg: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-600',
      label: 'Normal',
      severity: '📊'
    }
  }

  const getRsiStyle = (shift: number) => {
    const change = Math.abs(shift)
    if (change > 10) return {
      bg: 'bg-white',
      border: 'border-[#a86448]',
      text: 'text-[#a86448]',
      label: 'Significant',
      severity: '📈'
    }
    if (change > 5) return {
      bg: 'bg-white',
      border: 'border-[#c17555]',
      text: 'text-[#c17555]',
      label: 'Moderate',
      severity: '📈'
    }
    return {
      bg: 'bg-white',
      border: 'border-gray-200',
      text: 'text-gray-600',
      label: 'Minor',
      severity: '📈'
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-5 w-36 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-24 bg-gray-100 rounded"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="h-3 w-24 bg-gray-200 rounded mb-3"></div>
              <div className="h-7 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-20 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="h-3 w-24 bg-gray-200 rounded mb-3"></div>
              <div className="h-6 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-20 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  // Show error banner if there's an error
  const ErrorBanner = error ? (
    <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-start gap-2">
      <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="flex-1">
        <p className="text-xs text-orange-800">{error}</p>
      </div>
    </div>
  ) : null

  const priceStyle = getPriceChangeStyle(data.priceChange)
  const volumeStyle = getVolumeStyle(data.volumeChange)
  const rsiStyle = getRsiStyle(data.rsiShift.to - data.rsiShift.from)

  return (
    <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-in fade-in duration-500">
      {ErrorBanner}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Change Snapshot</h3>
          <p className="text-sm text-eleken-text-secondary mt-0.5">Last 1 hour</p>
        </div>
        <button
          onClick={fetchSnapshot}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Refresh"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {/* Price Movement */}
        <div className={`p-4 rounded-lg border ${priceStyle.bg} ${priceStyle.border}`}>
          <div className="flex items-center gap-2 mb-2">
            <svg className={`w-4 h-4 ${priceStyle.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <p className="text-xs font-medium text-gray-600">Price Movement</p>
          </div>
          <p className={`text-2xl font-bold ${priceStyle.text} mb-1`}>
            {data.priceChange > 0 ? '+' : ''}{data.priceChange.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600">{priceStyle.label}</p>
        </div>

        {/* Volume Activity */}
        <div className={`p-4 rounded-lg border ${volumeStyle.bg} ${volumeStyle.border}`}>
          <div className="flex items-center gap-2 mb-2">
            <svg className={`w-4 h-4 ${volumeStyle.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xs font-medium text-gray-600">Volume Activity</p>
          </div>
          <p className={`text-2xl font-bold ${volumeStyle.text} mb-1`}>
            {data.volumeChange > 0 ? '+' : ''}{data.volumeChange.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-600">{volumeStyle.label}</p>
        </div>

        {/* Momentum */}
        <div className={`p-4 rounded-lg border ${
          data.momentum === 'rising' ? 'bg-white border-[#c17555]' :
          data.momentum === 'falling' ? 'bg-white border-[#d4a88e]' :
          'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <svg className={`w-4 h-4 ${
              data.momentum === 'rising' ? 'text-[#c17555]' :
              data.momentum === 'falling' ? 'text-[#d4a88e]' :
              'text-gray-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-medium text-gray-600">Momentum</p>
          </div>
          <p className={`text-2xl font-bold mb-1 ${
            data.momentum === 'rising' ? 'text-[#c17555]' :
            data.momentum === 'falling' ? 'text-[#d4a88e]' :
            'text-gray-600'
          }`}>
            {data.momentum.charAt(0).toUpperCase() + data.momentum.slice(1)}
          </p>
          <p className="text-xs text-gray-600">
            {data.momentum === 'rising' ? 'Accelerating' : data.momentum === 'falling' ? 'Decelerating' : 'Stable'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* RSI Shift */}
        <div className={`p-4 rounded-lg border ${rsiStyle.bg} ${rsiStyle.border}`}>
          <div className="flex items-center gap-2 mb-2">
            <svg className={`w-4 h-4 ${rsiStyle.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-medium text-gray-600">RSI Shift</p>
          </div>
          <p className={`text-lg font-bold ${rsiStyle.text} mb-1`}>
            {data.rsiShift.from.toFixed(0)} → {data.rsiShift.to.toFixed(0)}
          </p>
          <p className="text-xs text-gray-600">{rsiStyle.label} Change</p>
        </div>

        {/* News Flow */}
        <div className="p-4 rounded-lg border bg-white border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-[#c17555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-xs font-medium text-gray-600">News Flow</p>
          </div>
          <p className="text-lg font-bold text-[#c17555] mb-1">
            {data.newsCount} {data.newsCount === 1 ? 'Item' : 'Items'}
          </p>
          <p className="text-xs text-gray-600">{data.newsTopic} Topic</p>
        </div>
      </div>
    </div>
  )
}

export default ChangeSnapshot
