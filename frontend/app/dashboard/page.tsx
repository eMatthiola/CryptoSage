'use client'

import { useState } from 'react'
import Link from 'next/link'
import PriceChart from '@/components/PriceChart'
import TechnicalIndicatorsChart, { RSIStatusCard, MACDStatusCard } from '@/components/TechnicalIndicatorsChart'
import SentimentTrendChart from '@/components/SentimentTrendChart'
import SentimentDashboard, { SentimentMomentumCard, DataSourcesCard } from '@/components/SentimentDashboard'
import NewsListCard from '@/components/NewsListCard'
import MarketOverviewCard from '@/components/MarketOverviewCard'
import ChangeSnapshot from '@/components/ChangeSnapshot'
import AnomalyAlerts from '@/components/AnomalyAlerts'
import MarketTempo from '@/components/MarketTempo'
import MarketTimeline from '@/components/MarketTimeline'
import { useMarketRadarWebSocket } from '@/hooks/useMarketRadarWebSocket'

type TabType = 'market' | 'news' | 'analysis'

export default function DashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC')
  const [activeTab, setActiveTab] = useState<TabType>('market')

  // WebSocket connection for Market Radar
  const { data: wsData, isConnected, isLoading: wsLoading, error: wsError } = useMarketRadarWebSocket(selectedSymbol)

  return (
    <div className="min-h-screen bg-eleken-bg">
      {/* Header */}
      <header className="bg-eleken-bg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <svg className="w-16 h-16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c17555" />
                      <stop offset="100%" stopColor="#d4a88e" />
                    </linearGradient>
                    <radialGradient id="nucleusGradient" cx="50%" cy="50%">
                      <stop offset="0%" stopColor="#a86448" />
                      <stop offset="100%" stopColor="#c17555" />
                    </radialGradient>
                  </defs>

                  {/* Nucleus - central aggregation core */}
                  <circle cx="16" cy="16" r="2.5" fill="url(#nucleusGradient)"/>
                  <circle cx="16" cy="16" r="3.5" fill="none" stroke="url(#mainGradient)" strokeWidth="0.8" opacity="0.3"/>

                  {/* Electron orbit rings - data layers */}
                  <ellipse cx="16" cy="16" rx="11" ry="6" fill="none" stroke="url(#mainGradient)" strokeWidth="1" opacity="0.25" transform="rotate(0 16 16)"/>
                  <ellipse cx="16" cy="16" rx="11" ry="6" fill="none" stroke="url(#mainGradient)" strokeWidth="1" opacity="0.25" transform="rotate(60 16 16)"/>
                  <ellipse cx="16" cy="16" rx="11" ry="6" fill="none" stroke="url(#mainGradient)" strokeWidth="1" opacity="0.25" transform="rotate(120 16 16)"/>

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
              </Link>
              <span className="text-sm text-eleken-text-secondary">Market Intelligence Platform</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Symbol Selector */}
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c17555] focus:border-[#c17555]"
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="BNB">Binance Coin (BNB)</option>
                <option value="SOL">Solana (SOL)</option>
              </select>

              <Link
                href="/chat"
                className="relative px-5 py-2.5 bg-gradient-to-r from-[#c17555] to-[#d09573] text-white rounded-lg hover:from-[#a86448] hover:to-[#b87d5f] transition-all duration-300 hover:shadow-lg hover:shadow-[#c17555]/25 hover:-translate-y-0.5 flex items-center gap-2.5 group overflow-hidden"
              >
                {/* Background shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>

                {/* Icon with enhanced animation */}
                <svg className="w-5 h-5 relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>

                {/* Text with subtle shadow */}
                <span className="relative z-10 font-medium text-sm tracking-wide drop-shadow-sm">Chat Assistant</span>

                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/5 transition-colors duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('market')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'market'
                    ? 'border-[#c17555] text-[#c17555]'
                    : 'border-transparent text-eleken-text-secondary hover:text-eleken-text hover:border-gray-300'
                }`}
              >
                Market Overview
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'news'
                    ? 'border-[#c17555] text-[#c17555]'
                    : 'border-transparent text-eleken-text-secondary hover:text-eleken-text hover:border-gray-300'
                }`}
              >
                News & Sentiment
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'analysis'
                    ? 'border-[#c17555] text-[#c17555]'
                    : 'border-transparent text-eleken-text-secondary hover:text-eleken-text hover:border-gray-300'
                }`}
              >
                Real-time Radar
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            {/* Price Chart - Full Width */}
            <PriceChart symbol={selectedSymbol} days={7} />

            {/* Technical Indicators Chart + Right Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Technical Indicators Chart (2/3) */}
              <div className="lg:col-span-2">
                <TechnicalIndicatorsChart symbol={selectedSymbol} />
              </div>

              {/* Right: Metrics Sidebar (1/3) */}
              <div className="space-y-6">
                <MarketOverviewCard symbol={selectedSymbol} />
                <RSIStatusCard symbol={selectedSymbol} />
                <MACDStatusCard symbol={selectedSymbol} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-6">
            {/* Sentiment Trend Chart */}
            <div>
              <SentimentTrendChart symbol={selectedSymbol} />
            </div>

            {/* News & Sentiment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: News List */}
              <NewsListCard symbol={selectedSymbol} limit={8} />

              {/* Right: Sentiment Cards Stack */}
              <div className="space-y-5">
                <SentimentDashboard symbol={selectedSymbol} />
                <SentimentMomentumCard symbol={selectedSymbol} />
                <DataSourcesCard symbol={selectedSymbol} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Page Header with WebSocket Status */}
            <div className="rounded-xl p-5 bg-gradient-to-r from-orange-50 to-[#fef9f7] border-l-4 border-l-[#c17555]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c17555] to-[#d4a88e] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Market Radar</h2>
                    <p className="text-xs text-eleken-text-secondary">Real-time market intelligence via WebSocket</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                  <span className="text-xs text-gray-600">
                    {isConnected ? 'Connected' : wsLoading ? 'Connecting...' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>

            {/* WebSocket Error Banner */}
            {wsError && (
              <div className="rounded-lg p-4 bg-orange-50 border border-orange-200 flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-orange-800 mb-1">WebSocket Connection Error</p>
                  <p className="text-xs text-orange-700">{wsError}</p>
                </div>
              </div>
            )}

            {/* Change Snapshot */}
            <ChangeSnapshot symbol={selectedSymbol} wsData={wsData.snapshot} />

            {/* Anomaly Alerts & Market Tempo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnomalyAlerts symbol={selectedSymbol} wsData={wsData.anomalies} />
              <MarketTempo symbol={selectedSymbol} wsData={wsData.tempo} />
            </div>

            {/* Timeline */}
            <MarketTimeline symbol={selectedSymbol} wsData={wsData.timeline} />

            {/* Disclaimer */}
            <div className="rounded-xl p-5 bg-orange-50 border border-orange-100 shadow-sm">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#c17555] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">Information Aggregation Platform</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    CryptoSage helps you detect market changes faster by aggregating data from multiple sources.
                    All information is for reference only and does not constitute investment advice.
                    Always conduct your own research before making trading decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
