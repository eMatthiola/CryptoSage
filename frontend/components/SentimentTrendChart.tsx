'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

interface SentimentData {
  timestamp: string
  score: number
  positive: number
  neutral: number
  negative: number
}

interface SentimentTrendChartProps {
  symbol: string
}

export function SentimentTrendChart({ symbol }: SentimentTrendChartProps) {
  const [data, setData] = useState<SentimentData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSentiment, setCurrentSentiment] = useState<string>('neutral')

  useEffect(() => {
    fetchSentimentData()
  }, [symbol])

  const fetchSentimentData = async () => {
    setLoading(true)
    try {
      // Mock data for demonstration
      const mockData = Array.from({ length: 24 }, (_, i) => {
        const score = -0.5 + Math.random()
        return {
          timestamp: `${i}:00`,
          score: score,
          positive: Math.max(0, score) * 100,
          neutral: 50 + (Math.random() - 0.5) * 30,
          negative: Math.max(0, -score) * 100
        }
      })

      setData(mockData)

      // Determine current sentiment
      const lastScore = mockData[mockData.length - 1]?.score || 0
      if (lastScore > 0.2) setCurrentSentiment('positive')
      else if (lastScore < -0.2) setCurrentSentiment('negative')
      else setCurrentSentiment('neutral')
    } catch (error) {
      console.error('Error fetching sentiment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-[#c17555]'
      case 'negative':
        return 'text-[#d4a88e]'
      default:
        return 'text-gray-600'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '↑'
      case 'negative':
        return '↓'
      default:
        return '→'
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
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
    <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Sentiment Trend</h3>
          <p className="text-xs text-eleken-text-secondary">{symbol} - Last 24 hours</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600 mb-1">Current</p>
          <p className={`text-lg capitalize ${getSentimentColor(currentSentiment)}`}>
            {getSentimentIcon(currentSentiment)} {currentSentiment}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
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
            domain={[-1, 1]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            stroke="#9CA3AF"
            tickFormatter={(value) => value.toFixed(1)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: any) => [value.toFixed(3), 'Sentiment Score']}
          />
          <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#c17555"
            strokeWidth={2}
            fill="url(#colorSentiment)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Positive</p>
          <p className="text-lg text-[#c17555]">
            {((data.filter(d => d.score > 0).length / data.length) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-white border border-gray-200 p-3 rounded-lg text-center">
          <p className="text-xs text-gray-600 mb-1">Neutral</p>
          <p className="text-lg font-medium text-gray-500">
            {((data.filter(d => Math.abs(d.score) <= 0.2).length / data.length) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Negative</p>
          <p className="text-lg text-[#d4a88e]">
            {((data.filter(d => d.score < 0).length / data.length) * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  )
}

export default SentimentTrendChart
