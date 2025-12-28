/**
 * Frontend Configuration
 * Centralized configuration for API URLs and endpoints
 */

export const config = {
  // API Base URL - reads from environment variable with fallback to localhost
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',

  // WebSocket URL for Market Radar real-time updates
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',

  // API Endpoints
  endpoints: {
    // Health & Status
    health: '/',
    docs: '/docs',

    // Chat
    chat: '/api/v1/chat',
    chatStream: '/api/v1/chat/stream',

    // Market Data
    marketStats: (symbol: string) => `/api/v1/market/${symbol}/stats`,
    marketIndicators: (symbol: string) => `/api/v1/market/indicators/${symbol}`,
    marketHistory: (symbol: string, interval: string, limit: number) =>
      `/api/v1/market/history/${symbol}?interval=${interval}&limit=${limit}`,

    // Market Radar
    radarSnapshot: (symbol: string) => `/api/v1/market/radar/${symbol}/snapshot`,
    radarAnomalies: (symbol: string) => `/api/v1/market/radar/${symbol}/anomalies`,
    radarTempo: (symbol: string) => `/api/v1/market/radar/${symbol}/tempo`,
    radarTimeline: (symbol: string) => `/api/v1/market/radar/${symbol}/timeline`,
    radarWebSocket: (symbol: string) => `/api/v1/market/radar/ws/${symbol}`,

    // News & Sentiment
    newsRecent: (symbol: string, limit: number) => `/api/v1/news/recent/${symbol}?limit=${limit}`,
    newsSentiment: (symbol: string) => `/api/v1/news/sentiment/${symbol}`,
  }
}

/**
 * Helper function to build full API URL
 */
export function getApiUrl(endpoint: string): string {
  return `${config.apiUrl}${endpoint}`
}

/**
 * Helper function to build WebSocket URL
 */
export function getWsUrl(endpoint: string): string {
  return `${config.wsUrl}${endpoint}`
}
