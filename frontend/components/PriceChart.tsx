'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { getApiUrl, config } from '@/lib/config'

interface PriceData {
  timestamp: string
  price: number
  predicted?: number
}

interface PriceChartProps {
  symbol: string
  interval?: string
  days?: number
}

export function PriceChart({ symbol, interval = '1h', days = 7 }: PriceChartProps) {
  const [data, setData] = useState<PriceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPriceData()
  }, [symbol, interval, days])

  const fetchPriceData = async () => {
    setLoading(true)
    try {
      // Fetch historical price data
      const response = await fetch(getApiUrl(config.endpoints.marketHistory(`${symbol}USDT`, interval, days * 24)))

      if (response.ok) {
        const result = await response.json()

        // Transform data for chart
        const chartData = result.map((item: any) => ({
          timestamp: new Date(item.timestamp).toLocaleTimeString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit'
          }),
          price: parseFloat(item.close)
        }))

        setData(chartData)
      }
    } catch (error) {
      console.error('Error fetching price data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Price Trend</h3>
          <p className="text-xs text-eleken-text-secondary">{symbol} - Last {days} days</p>
        </div>
        <button
          onClick={fetchPriceData}
          className="p-2 hover:bg-gray-100 rounded-lg transition group"
          title="Refresh"
        >
          <svg className={`w-5 h-5 text-gray-600 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-active:rotate-180'}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c17555" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#c17555" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            tickLine={false}
            stroke="#9CA3AF"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            stroke="#9CA3AF"
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: any) => [`$${value.toLocaleString()}`, 'Price']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#c17555"
            strokeWidth={2}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PriceChart
