'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface MarketRadarData {
  snapshot: {
    priceChange: number
    volumeChange: number
    rsiShift: { from: number; to: number }
    momentum: 'rising' | 'falling' | 'neutral'
    newsCount: number
    newsTopic: string
    timestamp: string
  } | null
  anomalies: {
    alerts: Array<{
      id: string
      type: 'high' | 'watch'
      icon: string
      title: string
      description: string
      context: string
      timestamp: string
    }>
    timestamp: string
  } | null
  tempo: {
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
  timeline: {
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

export interface UseMarketRadarWebSocketReturn {
  data: MarketRadarData
  isConnected: boolean
  isLoading: boolean
  error: string | null
  lastUpdate: string | null
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
const RECONNECT_DELAY = 3000 // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5

export function useMarketRadarWebSocket(symbol: string): UseMarketRadarWebSocketReturn {
  const [data, setData] = useState<MarketRadarData>({
    snapshot: null,
    anomalies: null,
    tempo: null,
    timeline: null,
  })
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    try {
      const normalizedSymbol = symbol.toUpperCase().endsWith('USDT') ? symbol : `${symbol}USDT`
      const wsUrl = `${WS_URL}/api/v1/market/radar/ws/${normalizedSymbol}`

      console.log('[Market Radar WS] Connecting to:', wsUrl)

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[Market Radar WS] Connected')
        setIsConnected(true)
        setIsLoading(false)
        setError(null)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'market_radar_update') {
            setData({
              snapshot: message.data.snapshot,
              anomalies: message.data.anomalies,
              tempo: message.data.tempo,
              timeline: message.data.timeline,
            })
            setLastUpdate(message.timestamp)
            setError(null)

            console.log('[Market Radar WS] Data updated:', message.timestamp)
          } else if (message.type === 'error') {
            console.error('[Market Radar WS] Server error:', message.message)
            setError(message.message)
          }
        } catch (err) {
          console.error('[Market Radar WS] Failed to parse message:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('[Market Radar WS] Error:', event)
        setError('WebSocket connection error')
      }

      ws.onclose = (event) => {
        console.log('[Market Radar WS] Disconnected:', event.code, event.reason)
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect if not manually closed
        if (mountedRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++
          console.log(
            `[Market Radar WS] Reconnecting... (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, RECONNECT_DELAY)
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setError('Failed to connect after multiple attempts. Please refresh the page.')
          setIsLoading(false)
        }
      }
    } catch (err) {
      console.error('[Market Radar WS] Connection failed:', err)
      setError('Failed to establish WebSocket connection')
      setIsLoading(false)
    }
  }, [symbol])

  // Connect on mount and when symbol changes
  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return {
    data,
    isConnected,
    isLoading,
    error,
    lastUpdate,
  }
}
