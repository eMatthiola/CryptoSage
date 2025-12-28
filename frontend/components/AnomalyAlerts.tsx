'use client'

import { useState, useEffect } from 'react'

import { getApiUrl, config } from '@/lib/config'
interface AnomalyAlertsProps {
  symbol: string
  wsData?: {
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
}

interface Alert {
  id: string
  type: 'high' | 'watch'
  icon: string
  title: string
  description: string
  context: string
  timestamp: string
}

export function AnomalyAlerts({ symbol, wsData }: AnomalyAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Update data when WebSocket data changes
  useEffect(() => {
    if (wsData) {
      setAlerts(wsData.alerts)
      setLoading(false)
      setError(null)
    }
  }, [wsData])

  // Fallback to HTTP polling if no WebSocket data
  useEffect(() => {
    if (wsData !== undefined) return // WebSocket is active, don't use HTTP

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [symbol, wsData])

  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)
    try {
      const symbolWithPair = symbol.toUpperCase().endsWith('USDT') ? symbol : `${symbol}USDT`
      const response = await fetch(getApiUrl(config.endpoints.radarAnomalies(symbolWithPair)))

      if (!response.ok) {
        throw new Error('Failed to fetch anomaly alerts')
      }

      const apiData = await response.json()
      setAlerts(apiData.alerts)
    } catch (err) {
      console.error('Error fetching alerts:', err)
      setError('Unable to load anomaly alerts.')
      // Fallback to empty alerts on error
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm animate-pulse">
        <div className="mb-5">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-56 bg-gray-100 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg p-4 bg-gray-50 border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-3 w-40 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-full bg-gray-100 rounded mb-2"></div>
                  <div className="h-3 w-32 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const highPriorityAlerts = alerts.filter(a => a.type === 'high')
  const watchAlerts = alerts.filter(a => a.type === 'watch')

  return (
    <div className="rounded-xl p-5 bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Anomaly Alerts</h3>
          <p className="text-xs text-eleken-text-secondary">Real-time market anomaly detection</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-start gap-2">
          <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-orange-800">{error}</p>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-8 bg-[#fef9f7] rounded-lg border border-[#f5f0ed]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#c17555]/10 to-[#d4a88e]/10 flex items-center justify-center">
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No Anomalies Detected</p>
          <p className="text-xs text-gray-500">Market behavior is within normal range</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* High Priority Alerts */}
          {highPriorityAlerts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#a86448]"></div>
                <p className="text-sm font-semibold text-gray-800">
                  High Priority ({highPriorityAlerts.length})
                </p>
              </div>
              <div className="space-y-3">
                {highPriorityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg p-4 bg-[#fef9f7] border border-[#d4a88e] border-l-4 border-l-[#a86448] transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{alert.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#a86448] mb-1">{alert.title}</p>
                        <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <p className="text-xs text-gray-600 truncate">{alert.context}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-gray-500">{alert.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watch List Alerts */}
          {watchAlerts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#c17555]"></div>
                <p className="text-sm font-semibold text-gray-800">
                  Watch List ({watchAlerts.length})
                </p>
              </div>
              <div className="space-y-3">
                {watchAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg p-4 bg-[#fef9f7] border border-[#d4a88e] border-l-4 border-l-[#c17555] transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{alert.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#c17555] mb-1">{alert.title}</p>
                        <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <p className="text-xs text-gray-600 truncate">{alert.context}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-gray-500">{alert.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-5 pt-5 border-t border-gray-200">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-gray-600 leading-relaxed">
            Anomalies are detected by comparing current market behavior against historical patterns.
            High priority alerts require immediate attention, while watch list items suggest caution.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AnomalyAlerts
