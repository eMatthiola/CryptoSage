'use client'

import { useEffect, useState } from 'react'
import { getApiUrl, config } from '@/lib/config'

interface SentimentData {
  symbol: string
  time_range_hours: number
  total_articles: number
  sentiment_distribution: {
    positive: number
    negative: number
    neutral: number
  }
  average_sentiment_score: number
  overall_sentiment: 'positive' | 'negative' | 'neutral'
}

interface SentimentDashboardProps {
  symbol?: string
}

export function SentimentDashboard({ symbol = 'BTC' }: SentimentDashboardProps) {
  const [data, setData] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSentiment()
  }, [symbol])

  const fetchSentiment = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(config.endpoints.newsSentiment(symbol)))
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch sentiment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const total = data.sentiment_distribution.positive +
                data.sentiment_distribution.negative +
                data.sentiment_distribution.neutral

  const positivePercent = total > 0 ? (data.sentiment_distribution.positive / total) * 100 : 0
  const negativePercent = total > 0 ? (data.sentiment_distribution.negative / total) * 100 : 0
  const neutralPercent = total > 0 ? (data.sentiment_distribution.neutral / total) * 100 : 0

  const overallColor = {
    positive: 'text-[#c17555]',
    negative: 'text-[#d4a88e]',
    neutral: 'text-gray-700'
  }[data.overall_sentiment]

  return (
    <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-in fade-in duration-500">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3">Overall Sentiment</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`text-xl capitalize ${overallColor}`}>
              {data.overall_sentiment}
            </span>
            <span className={`text-lg font-normal text-gray-600`}>
              {data.average_sentiment_score >= 0 ? '+' : ''}{data.average_sentiment_score.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500">{data.total_articles} articles analyzed</p>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="space-y-3">
        {/* Positive */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-700 font-medium">Positive</span>
            <span className="text-eleken-text-secondary">
              {data.sentiment_distribution.positive} ({positivePercent.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${positivePercent}%`, backgroundColor: '#c17555' }}
            />
          </div>
        </div>

        {/* Neutral */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-700 font-medium">Neutral</span>
            <span className="text-eleken-text-secondary">
              {data.sentiment_distribution.neutral} ({neutralPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-gray-300 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${neutralPercent}%` }}
            />
          </div>
        </div>

        {/* Negative */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-700 font-medium">Negative</span>
            <span className="text-eleken-text-secondary">
              {data.sentiment_distribution.negative} ({negativePercent.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${negativePercent}%`, backgroundColor: '#d4a88e' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Export additional sentiment insight cards for flexible layout
export function SentimentMomentumCard({ symbol = 'BTC' }: SentimentDashboardProps) {
  const [data, setData] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSentiment()
  }, [symbol])

  const fetchSentiment = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(config.endpoints.newsSentiment(symbol)))
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch sentiment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-md h-32 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const total = data.sentiment_distribution.positive +
                data.sentiment_distribution.negative +
                data.sentiment_distribution.neutral

  const positivePercent = total > 0 ? (data.sentiment_distribution.positive / total) * 100 : 0
  const score = data.average_sentiment_score

  const getTrend = () => {
    if (score > 0.3) return { text: 'Trending Positive', icon: '↗', color: 'text-[#c17555]' }
    if (score > 0.1) return { text: 'Slightly Positive', icon: '→', color: 'text-gray-700' }
    if (score > -0.1) return { text: 'Stable', icon: '→', color: 'text-gray-600' }
    if (score > -0.3) return { text: 'Slightly Negative', icon: '→', color: 'text-gray-700' }
    return { text: 'Trending Negative', icon: '↘', color: 'text-[#d4a88e]' }
  }

  const trend = getTrend()

  return (
    <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 animate-in fade-in duration-500">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Sentiment Momentum</p>
          <p className={`text-base font-semibold ${trend.color} mb-0.5 flex items-center gap-1`}>
            {trend.text} <span className="text-lg">{trend.icon}</span>
          </p>
          <p className="text-xs text-gray-600">
            {score >= 0 ? '+' : ''}{score.toFixed(2)} change
          </p>
        </div>
      </div>
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-600 leading-relaxed">
          Based on {data.total_articles} articles analyzed over {data.time_range_hours}h
        </p>
      </div>
    </div>
  )
}

export function DataSourcesCard({ symbol = 'BTC' }: SentimentDashboardProps) {
  const [data, setData] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSentiment()
  }, [symbol])

  const fetchSentiment = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(config.endpoints.newsSentiment(symbol)))
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch sentiment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-md h-32 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const sources = [
    { name: 'CoinDesk', active: true },
    { name: 'Cointelegraph', active: true },
    { name: 'Decrypt', active: true },
    { name: 'The Block', active: true }
  ]

  return (
    <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 animate-in fade-in duration-500">
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Data Sources</p>
        <p className="text-base font-semibold text-[#c17555] mb-0.5">
          {data.total_articles} Articles
        </p>
        <p className="text-xs text-gray-600">
          From {sources.length} platforms
        </p>
      </div>
      <div className="pt-3 border-t border-gray-100">
        <div className="space-y-1.5">
          {sources.map((source) => (
            <div key={source.name} className="flex items-center justify-between">
              <span className="text-xs text-gray-700">{source.name}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${source.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SentimentDashboard
