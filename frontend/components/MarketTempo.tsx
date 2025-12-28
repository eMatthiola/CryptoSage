'use client'

import { useState, useEffect } from 'react'

import { getApiUrl, config } from '@/lib/config'
interface MarketTempoProps {
  symbol: string
  wsData?: {
    volatility: {
      level: number
      trend: 'accelerating' | 'decelerating' | 'stable'
      label: string
    }
    activity: {
      level: number
      vsAverage: number
      label: string
    }
    direction: {
      level: number
      bias: 'bullish' | 'bearish' | 'neutral'
      label: string
    }
    summary: string
    timestamp: string
  } | null
}

interface TempoData {
  volatility: {
    level: number // 0-100
    trend: 'accelerating' | 'decelerating' | 'stable'
    label: string
  }
  activity: {
    level: number // 0-100
    vsAverage: number // percentage
    label: string
  }
  direction: {
    level: number // 0-100
    bias: 'bullish' | 'bearish' | 'neutral'
    label: string
  }
  summary: string
}

export function MarketTempo({ symbol, wsData }: MarketTempoProps) {
  const [data, setData] = useState<TempoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Update data when WebSocket data changes
  useEffect(() => {
    if (wsData) {
      setData({
        volatility: wsData.volatility,
        activity: wsData.activity,
        direction: wsData.direction,
        summary: wsData.summary
      })
      setLoading(false)
      setError(null)
    }
  }, [wsData])

  // Fallback to HTTP polling if no WebSocket data
  useEffect(() => {
    if (wsData !== undefined) return // WebSocket is active, don't use HTTP

    fetchTempo()
    const interval = setInterval(fetchTempo, 30000)
    return () => clearInterval(interval)
  }, [symbol, wsData])

  const fetchTempo = async () => {
    setLoading(true)
    setError(null)
    try {
      const symbolWithPair = symbol.toUpperCase().endsWith('USDT') ? symbol : `${symbol}USDT`
      const response = await fetch(getApiUrl(config.endpoints.radarTempo(symbolWithPair)))

      if (!response.ok) {
        throw new Error('Failed to fetch tempo data')
      }

      const apiData = await response.json()
      setData(apiData)
    } catch (err) {
      console.error('Error fetching tempo:', err)
      setError('Unable to load market tempo. Using default values.')
      // Fallback to default data on error
      setData({
        volatility: {
          level: 50,
          trend: 'stable',
          label: 'Moderate'
        },
        activity: {
          level: 50,
          vsAverage: 0,
          label: 'Active'
        },
        direction: {
          level: 50,
          bias: 'neutral',
          label: 'Sideways'
        },
        summary: 'Normal market conditions with balanced activity levels.'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm animate-pulse">
        <div className="mb-5">
          <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-48 bg-gray-100 rounded"></div>
        </div>
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-3 w-32 bg-gray-200 rounded"></div>
                <div className="h-3 w-16 bg-gray-100 rounded"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-1"></div>
              <div className="h-3 w-24 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-5 border-t border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            <div className="flex-1">
              <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-full bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-in fade-in duration-500">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-800 mb-1">Market Tempo</h3>
        <p className="text-xs text-eleken-text-secondary">Current market rhythm and energy</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-start gap-2">
          <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-orange-800">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* Volatility Rhythm */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#c17555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="text-sm font-medium text-gray-700">Volatility Rhythm</p>
            </div>
            <p className="text-xs text-gray-600">
              {data.volatility.trend.charAt(0).toUpperCase() + data.volatility.trend.slice(1)}
            </p>
          </div>
          <div className="w-full bg-[#f5f0ed] rounded-full h-3 mb-1">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-[#c17555] to-[#d4a88e] transition-all duration-500"
              style={{ width: `${Math.max(data.volatility.level, 5)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">{data.volatility.label} (Past 2 hours)</p>
        </div>

        {/* Trading Activity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#c17555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm font-medium text-gray-700">Trading Activity</p>
            </div>
            <p className="text-xs text-gray-600">
              {data.activity.vsAverage > 0 ? '+' : ''}{data.activity.vsAverage.toFixed(0)}% vs avg
            </p>
          </div>
          <div className="w-full bg-[#f5f0ed] rounded-full h-3 mb-1">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-[#c17555] to-[#d4a88e] transition-all duration-500"
              style={{ width: `${Math.max(data.activity.level, 5)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">{data.activity.label}</p>
        </div>

        {/* Directional Bias */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className={`w-4 h-4 ${
                data.direction.bias === 'bullish' ? 'text-[#c17555]' :
                data.direction.bias === 'bearish' ? 'text-[#d4a88e]' :
                'text-gray-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <p className="text-sm font-medium text-gray-700">Directional Bias</p>
            </div>
            <p className="text-xs text-gray-600 capitalize">{data.direction.bias}</p>
          </div>
          <div className="w-full bg-[#f5f0ed] rounded-full h-3 mb-1">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                data.direction.bias === 'bullish' ? 'bg-gradient-to-r from-[#c17555] to-[#d4a88e]' :
                data.direction.bias === 'bearish' ? 'bg-gradient-to-r from-[#d4a88e] to-[#e5c9b8]' :
                'bg-gray-300'
              }`}
              style={{ width: `${Math.max(data.direction.level, 5)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">{data.direction.label}</p>
        </div>
      </div>

      {/* Market Summary */}
      <div className="mt-5 pt-5 border-t border-gray-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c17555] to-[#d4a88e] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-800 mb-1">Market Summary</p>
            <p className="text-xs text-gray-600 leading-relaxed">{data.summary}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketTempo
