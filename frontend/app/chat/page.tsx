'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NewsCard from '@/components/NewsCard'
import SentimentDashboard from '@/components/SentimentDashboard'
import MarkdownMessage from '@/components/MarkdownMessage'
import { getApiUrl, config } from '@/lib/config'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface NewsArticle {
  title: string
  content: string
  url: string
  source: string
  published_at: string
  symbols: string[]
  sentiment: {
    label: 'positive' | 'neutral' | 'negative'
    score: number
    confidence: number
  }
  relevance_score?: number
}

interface ChatSession {
  id: string
  title: string
  timestamp: string
  symbol: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState('BTC')
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([])
  const [showSidebar, setShowSidebar] = useState(true)
  const [showMarketData, setShowMarketData] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'BTC Market Analysis',
      timestamp: new Date().toISOString(),
      symbol: 'BTC'
    }
  ])
  const [currentSessionId, setCurrentSessionId] = useState('1')

  // 获取最新新闻
  useEffect(() => {
    fetchRecentNews()
  }, [selectedSymbol])

  const fetchRecentNews = async () => {
    try {
      const response = await fetch(getApiUrl(config.endpoints.newsRecent(selectedSymbol, 5)))
      const data = await response.json()
      setRecentNews(data)
    } catch (error) {
      console.error('Error fetching news:', error)
    }
  }

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `${selectedSymbol} Chat`,
      timestamp: new Date().toISOString(),
      symbol: selectedSymbol
    }
    setChatSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setMessages([])
  }

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId)
    setMessages([]) // In a real app, you'd load messages from the selected session
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Use streaming endpoint
      const response = await fetch(getApiUrl(config.endpoints.chatStream), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          symbol: `${selectedSymbol}USDT`,
          conversation_history: messages,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Create empty assistant message for streaming (no timestamp yet)
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        // Don't set timestamp until stream is complete
      }

      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)

      // Read stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let done = false
        let accumulatedContent = ''

        while (!done) {
          const { value, done: streamDone } = await reader.read()
          done = streamDone

          if (value) {
            const chunk = decoder.decode(value, { stream: true })
            accumulatedContent += chunk

            // Update the last message with accumulated content
            setMessages(prev => {
              const updated = [...prev]
              const lastMessage = updated[updated.length - 1]
              if (lastMessage && lastMessage.role === 'assistant') {
                // Replace the entire content instead of appending
                lastMessage.content = accumulatedContent
              }
              return [...updated] // Create new array to trigger re-render
            })
          }
        }

        // Stream complete - now add the timestamp
        setMessages(prev => {
          const updated = [...prev]
          const lastMessage = updated[updated.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.timestamp = new Date().toISOString()
          }
          return [...updated]
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the backend API is running.',
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  return (
    <div className="flex h-screen bg-eleken-bg">
      {/* Sidebar - Minimal Design */}
      {showSidebar && (
        <div className="w-72 bg-eleken-bg border-r border-gray-200 overflow-y-auto flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-16 h-16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="mainGradientChat" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c17555" />
                      <stop offset="100%" stopColor="#d4a88e" />
                    </linearGradient>
                    <radialGradient id="nucleusGradientChat" cx="50%" cy="50%">
                      <stop offset="0%" stopColor="#a86448" />
                      <stop offset="100%" stopColor="#c17555" />
                    </radialGradient>
                  </defs>

                  {/* Nucleus - central aggregation core */}
                  <circle cx="16" cy="16" r="2.5" fill="url(#nucleusGradientChat)"/>
                  <circle cx="16" cy="16" r="3.5" fill="none" stroke="url(#mainGradientChat)" strokeWidth="0.8" opacity="0.3"/>

                  {/* Electron orbit rings - data layers */}
                  <ellipse cx="16" cy="16" rx="11" ry="6" fill="none" stroke="url(#mainGradientChat)" strokeWidth="1" opacity="0.25" transform="rotate(0 16 16)"/>
                  <ellipse cx="16" cy="16" rx="11" ry="6" fill="none" stroke="url(#mainGradientChat)" strokeWidth="1" opacity="0.25" transform="rotate(60 16 16)"/>
                  <ellipse cx="16" cy="16" rx="11" ry="6" fill="none" stroke="url(#mainGradientChat)" strokeWidth="1" opacity="0.25" transform="rotate(120 16 16)"/>

                  {/* Electrons on first orbit - different data sources */}
                  <circle cx="27" cy="16" r="1.5" fill="#c17555">
                    <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="10s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="5" cy="16" r="1.5" fill="#d4a88e">
                    <animateTransform attributeName="transform" type="rotate" from="180 16 16" to="540 16 16" dur="10s" repeatCount="indefinite"/>
                  </circle>

                  {/* Electrons on second orbit */}
                  <circle cx="21.5" cy="12" r="1.3" fill="#c17555" opacity="0.8">
                    <animateTransform attributeName="transform" type="rotate" from="60 16 16" to="420 16 16" dur="12s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="10.5" cy="20" r="1.3" fill="#d4a88e" opacity="0.8">
                    <animateTransform attributeName="transform" type="rotate" from="240 16 16" to="600 16 16" dur="12s" repeatCount="indefinite"/>
                  </circle>

                  {/* Electrons on third orbit */}
                  <circle cx="21.5" cy="20" r="1.3" fill="#c17555" opacity="0.8">
                    <animateTransform attributeName="transform" type="rotate" from="120 16 16" to="480 16 16" dur="14s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="10.5" cy="12" r="1.3" fill="#d4a88e" opacity="0.8">
                    <animateTransform attributeName="transform" type="rotate" from="300 16 16" to="660 16 16" dur="14s" repeatCount="indefinite"/>
                  </circle>
                </svg>
                <span className="text-gray-900 font-semibold">CryptoSage</span>
              </div>
            </Link>

            {/* New Chat Button */}
            <button
              onClick={createNewChat}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-gray-900 text-sm font-medium transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          {/* Symbol Selector */}
          <div className="px-4 py-3 border-b border-gray-200">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-[#c17555] focus:ring-1 focus:ring-[#c17555]"
            >
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="BNB">Binance Coin (BNB)</option>
              <option value="SOL">Solana (SOL)</option>
            </select>
          </div>

          {/* Market Data Button */}
          <div className="px-4 py-3 border-b border-gray-200">
            <button
              onClick={() => setShowMarketData(!showMarketData)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-gray-900 text-sm font-medium transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Market Data
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-xs font-medium text-gray-500 mb-3">CHAT HISTORY</h3>
              <div className="space-y-2">
                {chatSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => switchSession(session.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition ${
                      currentSessionId === session.id
                        ? 'bg-white border border-gray-300 text-gray-900'
                        : 'text-gray-600 hover:bg-white hover:border hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(session.timestamp).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded flex-shrink-0">
                        {session.symbol}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Data Modal */}
      {showMarketData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-eleken-bg rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-eleken-bg border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Market Data - {selectedSymbol}</h2>
              <button
                onClick={() => setShowMarketData(false)}
                className="p-2 rounded-lg text-gray-600 hover:text-eleken-accent transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Vertical Layout */}
            <div className="p-6 space-y-6">
              {/* Sentiment Dashboard */}
              <div>
                <h3 className="text-xs font-medium text-gray-500 mb-3">SENTIMENT</h3>
                <SentimentDashboard symbol={selectedSymbol} />
              </div>

              {/* Recent News - Compact */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-gray-500">RECENT NEWS</h3>
                  <button
                    onClick={fetchRecentNews}
                    className="text-xs text-gray-600 hover:text-eleken-accent"
                  >
                    Refresh
                  </button>
                </div>
                <div className="space-y-2">
                  {recentNews.length > 0 ? (
                    recentNews.map((article, index) => (
                      <CompactNewsCard key={article.url || index} article={article} />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No recent news</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header - Clean light style */}
        <header className="bg-eleken-bg border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-lg text-gray-600 hover:text-eleken-accent transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-gray-900 font-medium">Chat Assistant</h1>
                <p className="text-sm text-gray-500">{selectedSymbol} Market Analysis</p>
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm text-eleken-text-secondary hover:text-eleken-accent transition"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* Messages - ChatGPT style */}
        <div className="flex-1 overflow-y-auto bg-eleken-bg">
          <div className="max-w-4xl mx-auto px-6">
            {messages.length === 0 && (
              <div className="py-12 text-center">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-eleken-text mb-2">Market Analysis</h2>
                  <p className="text-eleken-text-secondary">
                    Ask questions about {selectedSymbol} markets, news, or technical indicators
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <QuickQuestion onClick={() => setInput(`What's the current ${selectedSymbol} market sentiment?`)}>
                    What&apos;s the market sentiment?
                  </QuickQuestion>
                  <QuickQuestion onClick={() => setInput(`Should I buy ${selectedSymbol} now?`)}>
                    Should I buy now?
                  </QuickQuestion>
                  <QuickQuestion onClick={() => setInput(`Analyze ${selectedSymbol} technical indicators`)}>
                    Analyze technical indicators
                  </QuickQuestion>
                  <QuickQuestion onClick={() => setInput(`What are the latest ${selectedSymbol} news?`)}>
                    Latest news summary
                  </QuickQuestion>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className="py-6 border-b border-gray-100 last:border-0"
              >
                {message.role === 'user' ? (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c17555] to-[#d4a88e] flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-base text-eleken-text leading-relaxed">{message.content}</p>
                      {message.timestamp && (
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(message.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg
                        className={`w-4 h-4 text-[#c17555] ${!message.timestamp ? 'animate-pulse' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1 pt-1">
                      <MarkdownMessage content={message.content} isUser={false} />
                      {message.timestamp && (
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(message.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="py-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <svg className="w-4 h-4 text-[#c17555] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1 pt-2">
                    <span className="inline-block w-2 h-2 bg-[#c17555] rounded-full animate-bounce"></span>
                    <span className="inline-block w-2 h-2 bg-[#c17555] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                    <span className="inline-block w-2 h-2 bg-[#c17555] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input - Clean light style */}
        <div className="border-t border-gray-200 p-4 bg-eleken-bg">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={`Message CryptoSage...`}
                className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#c17555] text-white rounded-lg hover:bg-[#a86448] disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by GPT-4o-mini with real-time market data
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickQuestion({
  children,
  onClick
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="p-4 text-left bg-white border border-gray-300 hover:border-gray-400 hover:bg-eleken-bg rounded-xl transition text-sm text-eleken-text-secondary"
    >
      {children}
    </button>
  )
}

function CompactNewsCard({ article }: { article: NewsArticle }) {
  const sentimentColor = {
    positive: 'text-[#c17555]',
    neutral: 'text-gray-600',
    negative: 'text-[#d4a88e]'
  }[article.sentiment.label]

  const sentimentIcon = {
    positive: '↑',
    neutral: '→',
    negative: '↓'
  }[article.sentiment.label]

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-eleken-text group-hover:text-eleken-accent transition line-clamp-1 mb-1">
            {article.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-eleken-text-secondary">
            <span>{article.source}</span>
            <span>•</span>
            <span>{new Date(article.published_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
        <span className={`text-sm font-medium ${sentimentColor} flex-shrink-0`}>
          {sentimentIcon}
        </span>
      </div>
    </a>
  )
}
