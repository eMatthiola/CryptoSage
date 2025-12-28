'use client'

import { useState, useEffect } from 'react'
import { getApiUrl, config } from '@/lib/config'

interface MarketTimelineProps {
  symbol: string
  wsData?: {
    events: Array<{
      id: string
      time: string
      type: 'price' | 'volume' | 'news' | 'technical'
      icon: string
      title: string
      description: string
    }>
    timestamp: string
  } | null
}

interface TimelineEvent {
  id: string
  time: string
  type: 'price' | 'volume' | 'news' | 'technical'
  icon: string
  title: string
  description: string
}

export function MarketTimeline({ symbol, wsData }: MarketTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Update data when WebSocket data changes
  useEffect(() => {
    if (wsData) {
      setEvents(wsData.events)
      setLoading(false)
      setError(null)
    }
  }, [wsData])

  // Fallback to HTTP polling if no WebSocket data
  useEffect(() => {
    if (wsData !== undefined) return // WebSocket is active, don't use HTTP

    fetchTimeline()
    const interval = setInterval(fetchTimeline, 60000)
    return () => clearInterval(interval)
  }, [symbol, wsData])

  const fetchTimeline = async () => {
    setLoading(true)
    setError(null)
    try {
      const symbolWithPair = symbol.toUpperCase().endsWith('USDT') ? symbol : `${symbol}USDT`
      const response = await fetch(getApiUrl(config.endpoints.radarTimeline(symbolWithPair)))

      if (!response.ok) {
        throw new Error('Failed to fetch timeline data')
      }

      const apiData = await response.json()
      setEvents(apiData.events)
    } catch (err) {
      console.error('Error fetching timeline:', err)
      setError('Unable to load timeline events.')
      // Fallback to empty events on error
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const getEventStyle = (type: string) => {
    switch (type) {
      case 'price':
        return {
          dotColor: 'bg-[#d09573]',
          textColor: 'text-[#d09573]',
          borderColor: 'border-[#d09573]',
          iconPath: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z'
        }
      case 'volume':
        return {
          dotColor: 'bg-[#c17555]',
          textColor: 'text-[#c17555]',
          borderColor: 'border-[#c17555]',
          iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        }
      case 'news':
        return {
          dotColor: 'bg-[#a86448]',
          textColor: 'text-[#a86448]',
          borderColor: 'border-[#a86448]',
          iconPath: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z'
        }
      case 'technical':
        return {
          dotColor: 'bg-[#d4a88e]',
          textColor: 'text-[#d4a88e]',
          borderColor: 'border-[#d4a88e]',
          iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
        }
      default:
        return {
          dotColor: 'bg-gray-400',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-400',
          iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm animate-pulse">
        <div className="mb-5">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-56 bg-gray-100 rounded"></div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-14 flex-shrink-0">
                <div className="h-3 w-12 bg-gray-200 rounded"></div>
              </div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="flex-1">
                <div className="h-3 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-full bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-in fade-in duration-500">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-800 mb-1">24-Hour Timeline</h3>
        <p className="text-xs text-eleken-text-secondary">Key market events in chronological order</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-start gap-2">
          <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-orange-800">{error}</p>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#c17555]/10 to-[#d4a88e]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#c17555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No Events Yet</p>
          <p className="text-xs text-gray-500">Market events will appear here as they occur</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-16 top-2 bottom-2 w-0.5 bg-gray-200"></div>

          {/* Timeline events */}
          <div className="space-y-6">
            {events.map((event, index) => {
            const style = getEventStyle(event.type)
            return (
              <div key={event.id} className="relative flex items-start gap-4 group">
                {/* Time */}
                <div className="w-14 flex-shrink-0 text-right">
                  <p className="text-xs font-medium text-gray-600">{event.time}</p>
                </div>

                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${style.dotColor} ring-4 ring-white transition-transform group-hover:scale-125`}></div>
                </div>

                {/* Event content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-start gap-2">
                    <svg className={`w-4 h-4 ${style.textColor} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.iconPath} />
                    </svg>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${style.textColor} mb-1`}>
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend - only show if there are events */}
      {events.length > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#d09573]"></div>
              <span className="text-gray-600">Price Events</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#c17555]"></div>
              <span className="text-gray-600">Volume Events</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#a86448]"></div>
              <span className="text-gray-600">News Events</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#d4a88e]"></div>
              <span className="text-gray-600">Technical Events</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketTimeline
