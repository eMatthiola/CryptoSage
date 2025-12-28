'use client'

import { useState, useEffect } from 'react'

import { getApiUrl, config } from '@/lib/config'
interface MarketStats {
  symbol: string
  price_change: number
  price_change_percent: number
  volume: number
  quote_volume: number
  high_24h: number
  low_24h: number
  last_price: number
}

interface MarketOverviewCardProps {
  symbol: string
}

export function MarketOverviewCard({ symbol }: MarketOverviewCardProps) {
  const [data, setData] = useState<MarketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMarketStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarketStats, 30000)
    return () => clearInterval(interval)
  }, [symbol])

  const fetchMarketStats = async () => {
    try {
      const response = await fetch(getApiUrl(config.endpoints.marketStats(`${symbol}USDT`)))

      if (!response.ok) {
        throw new Error('Failed to fetch market stats')
      }

      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err: any) {
      console.error('Market stats error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(decimals)}B`
    } else if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(decimals)}M`
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(decimals)}K`
    }
    return `$${num.toFixed(decimals)}`
  }

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Overview</h3>
        <p className="text-sm text-red-600">Unable to load market data</p>
      </div>
    )
  }

  const changeColor = data.price_change_percent >= 0 ? 'text-[#c17555]' : 'text-[#d4a88e]'

  return (
    <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-in fade-in duration-500">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Market Overview</h3>
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">24h Change</span>
          <span className={`text-lg font-medium ${changeColor}`}>
            {data.price_change_percent >= 0 ? '+' : ''}
            {data.price_change_percent.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">24h Volume</span>
          <span className="text-sm font-medium text-gray-700">
            {formatNumber(data.quote_volume)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">24h High</span>
          <span className="text-sm font-medium text-gray-700">
            ${data.high_24h.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">24h Low</span>
          <span className="text-sm font-medium text-gray-700">
            ${data.low_24h.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default MarketOverviewCard
