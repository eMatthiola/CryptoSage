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
  ReferenceLine
} from 'recharts'
import { getApiUrl, config } from '@/lib/config'

interface IndicatorData {
  timestamp: string
  rsi: number
  macd: number
  macd_signal: number
}

interface TechnicalIndicatorsChartProps {
  symbol: string
}

export function TechnicalIndicatorsChart({ symbol }: TechnicalIndicatorsChartProps) {
  const [data, setData] = useState<IndicatorData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndicator, setActiveIndicator] = useState<'rsi' | 'macd'>('rsi')

  // Helper function to interpret RSI
  const getRSIInterpretation = (rsi: number) => {
    if (rsi >= 70) return { text: 'Overheated', subtext: 'Potentially overbought territory', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (rsi >= 60) return { text: 'Optimistic', subtext: 'Above-average positive sentiment', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (rsi >= 40) return { text: 'Neutral', subtext: 'Balanced market conditions', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (rsi >= 30) return { text: 'Cautious', subtext: 'Below-average sentiment', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    return { text: 'Subdued', subtext: 'Potentially oversold territory', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
  }

  // Helper function to interpret MACD
  const getMACDInterpretation = (macd: number, signal: number) => {
    const diff = macd - signal
    if (diff > 20) return { text: 'Strong Upward', subtext: 'Significant bullish momentum', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (diff > 5) return { text: 'Growing', subtext: 'Increasing upward momentum', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (diff > -5) return { text: 'Stable', subtext: 'Low directional momentum', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (diff > -20) return { text: 'Weakening', subtext: 'Increasing downward pressure', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    return { text: 'Strong Downward', subtext: 'Significant bearish momentum', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
  }

  useEffect(() => {
    fetchIndicatorData()
  }, [symbol])

  const fetchIndicatorData = async () => {
    setLoading(true)
    try {
      const response = await fetch(getApiUrl(config.endpoints.marketIndicators(`${symbol}USDT`)))

      if (response.ok) {
        const result = await response.json()

        // Mock data for demonstration (replace with real API)
        const mockData = Array.from({ length: 24 }, (_, i) => ({
          timestamp: `${i}:00`,
          rsi: 30 + Math.random() * 40,
          macd: -50 + Math.random() * 100,
          macd_signal: -40 + Math.random() * 80
        }))

        setData(mockData)
      }
    } catch (error) {
      console.error('Error fetching indicator data:', error)
      // Use mock data on error
      const mockData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: `${i}:00`,
        rsi: 30 + Math.random() * 40,
        macd: -50 + Math.random() * 100,
        macd_signal: -40 + Math.random() * 80
      }))
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-white">
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

  // Get latest RSI and MACD data for external use
  const latestRSI = data[data.length - 1]?.rsi || 50
  const latestMACD = data[data.length - 1]?.macd || 0
  const latestMACDSignal = data[data.length - 1]?.macd_signal || 0

  return (
    <div className="rounded-xl p-6 bg-white border border-gray-200 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Market Status Indicators</h3>
          <p className="text-xs text-eleken-text-secondary">Understanding what's happening - {symbol}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveIndicator('rsi')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeIndicator === 'rsi'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              RSI
            </button>
            <button
              onClick={() => setActiveIndicator('macd')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeIndicator === 'macd'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              MACD
            </button>
          </div>
          <button
            onClick={fetchIndicatorData}
            className="p-2 hover:bg-gray-100 rounded-lg transition group"
            title="Refresh"
          >
            <svg className={`w-5 h-5 text-gray-600 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-active:rotate-180'}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        {activeIndicator === 'rsi' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} tickLine={false} stroke="#9CA3AF" />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              stroke="#9CA3AF"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any) => [value.toFixed(2), 'RSI']}
            />
            <Legend />
            <ReferenceLine y={70} stroke="#FCA5A5" strokeDasharray="3 3" strokeOpacity={0.3} label="Overbought" />
            <ReferenceLine y={30} stroke="#6EE7B7" strokeDasharray="3 3" strokeOpacity={0.3} label="Oversold" />
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#c17555"
              strokeWidth={2}
              dot={false}
              name="RSI"
            />
          </LineChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} tickLine={false} stroke="#9CA3AF" />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#9CA3AF" />
            <Line
              type="monotone"
              dataKey="macd"
              stroke="#c17555"
              strokeWidth={2}
              dot={false}
              name="MACD"
            />
            <Line
              type="monotone"
              dataKey="macd_signal"
              stroke="#d4a88e"
              strokeWidth={2}
              dot={false}
              name="Signal"
            />
          </LineChart>
        )}
      </ResponsiveContainer>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-medium">Note:</span> These indicators reflect historical patterns to help understand current conditions. Not trading advice.
        </p>
      </div>
    </div>
  )
}

// Export status card components for flexible layout
export function RSIStatusCard({ symbol }: TechnicalIndicatorsChartProps) {
  const [data, setData] = useState<IndicatorData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIndicatorData()
  }, [symbol])

  const fetchIndicatorData = async () => {
    setLoading(true)
    try {
      const response = await fetch(getApiUrl(config.endpoints.marketIndicators(`${symbol}USDT`)))

      if (response.ok) {
        const result = await response.json()
        const mockData = Array.from({ length: 24 }, (_, i) => ({
          timestamp: `${i}:00`,
          rsi: 30 + Math.random() * 40,
          macd: -50 + Math.random() * 100,
          macd_signal: -40 + Math.random() * 80
        }))
        setData(mockData)
      }
    } catch (error) {
      console.error('Error fetching indicator data:', error)
      const mockData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: `${i}:00`,
        rsi: 30 + Math.random() * 40,
        macd: -50 + Math.random() * 100,
        macd_signal: -40 + Math.random() * 80
      }))
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const getRSIInterpretation = (rsi: number) => {
    if (rsi >= 70) return { text: 'Overheated', subtext: 'Potentially overbought territory', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (rsi >= 60) return { text: 'Optimistic', subtext: 'Above-average positive sentiment', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (rsi >= 40) return { text: 'Neutral', subtext: 'Balanced market conditions', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (rsi >= 30) return { text: 'Cautious', subtext: 'Below-average sentiment', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    return { text: 'Subdued', subtext: 'Potentially oversold territory', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-md h-40 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    )
  }

  const latestRSI = data[data.length - 1]?.rsi || 50

  return (
    <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">RSI · Sentiment</p>
          <p className="text-base font-semibold text-[#c17555] mb-0.5">
            {getRSIInterpretation(latestRSI).text}
          </p>
          <p className="text-xs text-gray-600">
            {getRSIInterpretation(latestRSI).subtext}
          </p>
        </div>
        <div className="ml-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm font-mono font-semibold text-gray-900">
            {latestRSI.toFixed(1)}
          </p>
        </div>
      </div>
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-600 leading-relaxed">
          {latestRSI >= 70 && 'Watch for possible pullback from elevated levels.'}
          {latestRSI <= 30 && 'Monitor for possible bounce from depressed levels.'}
          {latestRSI > 30 && latestRSI < 70 && 'Within normal range, indicating balanced conditions.'}
        </p>
      </div>
    </div>
  )
}

export function MACDStatusCard({ symbol }: TechnicalIndicatorsChartProps) {
  const [data, setData] = useState<IndicatorData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIndicatorData()
  }, [symbol])

  const fetchIndicatorData = async () => {
    setLoading(true)
    try {
      const response = await fetch(getApiUrl(config.endpoints.marketIndicators(`${symbol}USDT`)))

      if (response.ok) {
        const result = await response.json()
        const mockData = Array.from({ length: 24 }, (_, i) => ({
          timestamp: `${i}:00`,
          rsi: 30 + Math.random() * 40,
          macd: -50 + Math.random() * 100,
          macd_signal: -40 + Math.random() * 80
        }))
        setData(mockData)
      }
    } catch (error) {
      console.error('Error fetching indicator data:', error)
      const mockData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: `${i}:00`,
        rsi: 30 + Math.random() * 40,
        macd: -50 + Math.random() * 100,
        macd_signal: -40 + Math.random() * 80
      }))
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const getMACDInterpretation = (macd: number, signal: number) => {
    const diff = macd - signal
    if (diff > 20) return { text: 'Strong Upward', subtext: 'Significant bullish momentum', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (diff > 5) return { text: 'Growing', subtext: 'Increasing upward momentum', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (diff > -5) return { text: 'Stable', subtext: 'Low directional momentum', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    if (diff > -20) return { text: 'Weakening', subtext: 'Increasing downward pressure', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
    return { text: 'Strong Downward', subtext: 'Significant bearish momentum', color: 'text-gray-900', bgColor: 'bg-white', borderColor: 'border-gray-200' }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-md h-40 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    )
  }

  const latestMACD = data[data.length - 1]?.macd || 0
  const latestMACDSignal = data[data.length - 1]?.macd_signal || 0

  return (
    <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">MACD · Momentum</p>
          <p className="text-base font-semibold text-[#c17555] mb-0.5">
            {getMACDInterpretation(latestMACD, latestMACDSignal).text}
          </p>
          <p className="text-xs text-gray-600">
            {getMACDInterpretation(latestMACD, latestMACDSignal).subtext}
          </p>
        </div>
        <div className="ml-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm font-mono font-semibold text-gray-900">
            {(latestMACD - latestMACDSignal).toFixed(1)}
          </p>
        </div>
      </div>
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-600 leading-relaxed">
          {latestMACD > latestMACDSignal
            ? 'Above signal line, suggesting continued upward direction.'
            : 'Below signal line, suggesting continued downward direction.'}
        </p>
      </div>
    </div>
  )
}

export default TechnicalIndicatorsChart
