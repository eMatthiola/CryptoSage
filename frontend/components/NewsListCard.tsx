'use client'

import { useEffect, useState } from 'react'
import { getApiUrl, config } from '@/lib/config'

interface Sentiment {
  label: 'positive' | 'neutral' | 'negative'
  score: number
  confidence: number
}

interface NewsArticle {
  title: string
  content: string
  url: string
  source: string
  published_at: string
  symbols: string[]
  sentiment: Sentiment
  relevance_score?: number
}

interface NewsListCardProps {
  symbol?: string
  limit?: number
}

export function NewsListCard({ symbol = 'BTC', limit = 10 }: NewsListCardProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)

  useEffect(() => {
    fetchNews()
  }, [symbol])

  const fetchNews = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(config.endpoints.newsRecent(symbol, limit)))
      const result = await response.json()
      setArticles(result || [])
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }

  const sentimentColors = {
    positive: 'text-[#c17555] bg-orange-50',
    neutral: 'text-gray-600 bg-gray-50',
    negative: 'text-[#d4a88e] bg-orange-50'
  }

  const sentimentIcons = {
    positive: '↑',
    neutral: '→',
    negative: '↓'
  }

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))

      if (hours < 1) {
        const minutes = Math.floor(diff / (1000 * 60))
        return `${minutes}m ago`
      } else if (hours < 24) {
        return `${hours}h ago`
      } else {
        const days = Math.floor(hours / 24)
        return `${days}d ago`
      }
    } catch {
      return ''
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Latest News</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl p-6 bg-white border border-gray-200 border-l-2 border-l-[#c17555] shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Latest News</h3>
            <p className="text-xs text-eleken-text-secondary">{symbol}</p>
          </div>
          <button
            onClick={fetchNews}
            className="p-2 hover:bg-gray-100 rounded-lg transition group"
            title="Refresh"
          >
            <svg className={`w-5 h-5 text-gray-600 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-active:rotate-180'}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>

        {articles.length === 0 ? (
          <p className="text-sm text-gray-500">No news articles found</p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-hide">
            {articles.map((article, index) => (
              <div
                key={index}
                onClick={() => setSelectedArticle(article)}
                className="group"
              >
                <div className={`border rounded-lg p-3 transition-all cursor-pointer bg-white ${
                  index === 0 ? 'border-gray-300 hover:border-gray-400 hover:shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                } group-hover:translate-x-1`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className={`font-medium flex-1 line-clamp-2 ${index === 0 ? 'text-base' : 'text-sm'}`}>
                      {article.title}
                    </h4>
                    <span className={`px-2.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 ${sentimentColors[article.sentiment.label]}`}>
                      <span className="text-base">{sentimentIcons[article.sentiment.label]}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {/* Source favicon */}
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${
                          article.source === 'Decrypt' ? 'decrypt.co' :
                          article.source === 'CoinDesk' ? 'coindesk.com' :
                          article.url
                        }&sz=16`}
                        alt={article.source}
                        className="w-4 h-4 rounded-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <span className="font-medium text-gray-800">{article.source}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{formatTime(article.published_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* News Detail Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between rounded-t-xl">
              <div className="flex-1 pr-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {selectedArticle.title}
                </h2>
                <div className="flex items-center gap-2 text-xs">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${
                      selectedArticle.source === 'Decrypt' ? 'decrypt.co' :
                      selectedArticle.source === 'CoinDesk' ? 'coindesk.com' :
                      selectedArticle.url
                    }&sz=16`}
                    alt={selectedArticle.source}
                    className="w-4 h-4 rounded-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <span className="font-medium text-gray-800">{selectedArticle.source}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{formatTime(selectedArticle.published_at)}</span>
                  <span className="text-gray-400">•</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${sentimentColors[selectedArticle.sentiment.label]}`}>
                    {sentimentIcons[selectedArticle.sentiment.label]} {selectedArticle.sentiment.label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedArticle.content}
                </p>
              </div>

              {/* Symbols */}
              {selectedArticle.symbols && selectedArticle.symbols.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Related Symbols:</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedArticle.symbols.map(symbol => (
                      <span key={symbol} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {symbol}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment Details */}
              <div className="mb-5 p-4 bg-white border border-gray-200 rounded-lg">
                <p className="text-xs font-semibold text-gray-700 mb-3">Sentiment Analysis</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Classification</p>
                    <p className={`text-base capitalize ${sentimentColors[selectedArticle.sentiment.label].split(' ')[0]}`}>
                      {selectedArticle.sentiment.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Score</p>
                    <p className="text-base font-semibold text-gray-800">
                      {selectedArticle.sentiment.score.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Confidence</p>
                    <p className="text-base font-semibold text-gray-800">
                      {(selectedArticle.sentiment.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Read Original Button */}
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 px-4 bg-[#c17555] text-white text-center text-sm rounded-lg hover:bg-[#a86448] transition font-medium"
              >
                Read Original Article →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NewsListCard
