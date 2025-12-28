'use client'

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

interface NewsCardProps {
  article: NewsArticle
  compact?: boolean
}

export function NewsCard({ article, compact = false }: NewsCardProps) {
  const sentimentColors = {
    positive: 'text-green-600 bg-green-50',
    neutral: 'text-gray-600 bg-gray-50',
    negative: 'text-red-600 bg-red-50'
  }

  const getSentimentIcon = (label: 'positive' | 'neutral' | 'negative') => {
    if (label === 'positive') {
      return (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      )
    }
    if (label === 'negative') {
      return (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    )
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

  return (
    <div className={`rounded-xl ${compact ? 'p-3.5' : 'p-4'} hover:shadow-md transition-all bg-white border border-gray-200 shadow-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className={`font-semibold ${compact ? 'text-sm' : 'text-base'} flex-1 line-clamp-2 text-eleken-text`}>
          {article.title}
        </h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${sentimentColors[article.sentiment.label]}`}>
          {getSentimentIcon(article.sentiment.label)}
          <span className="capitalize">{article.sentiment.label}</span>
        </span>
      </div>

      {/* Content */}
      {!compact && (
        <p className="text-sm text-eleken-text-secondary mb-3 line-clamp-2">
          {article.content}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-eleken-text-secondary">
        <div className="flex items-center gap-3">
          <span className="font-medium">{article.source}</span>
          <span>{formatTime(article.published_at)}</span>
          {article.symbols && article.symbols.length > 0 && (
            <span className="flex gap-1">
              {article.symbols.slice(0, 3).map(symbol => (
                <span key={symbol} className="px-1.5 py-0.5 bg-eleken-code-bg text-eleken-text rounded text-xs font-medium">
                  {symbol}
                </span>
              ))}
            </span>
          )}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-eleken-text-secondary hover:text-eleken-accent hover:underline transition-colors"
        >
          Read more →
        </a>
      </div>

      {/* Relevance Score (if available) */}
      {article.relevance_score !== undefined && article.relevance_score > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-eleken-text-secondary">Relevance:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-eleken-accent to-[#ffa07a] h-2 rounded-full transition-all"
                style={{ width: `${Math.min(article.relevance_score * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-eleken-text">
              {(article.relevance_score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewsCard
