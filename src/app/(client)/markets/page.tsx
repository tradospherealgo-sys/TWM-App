'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Search,
  Plus,
  Trash2,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  X,
  Shield,
  Layers,
  Coins,
  BarChart3,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';
import { REFERENCE_STOCKS, REFERENCE_INDICES, StockReference } from '@/lib/adapters/market-data';

interface WatchlistData {
  id: string;
  name: string;
  symbols: string[];
}

interface IndexQuote {
  name: string;
  symbol: string;
  exchange: string;
  lastPrice: number | null;
  change: number | null;
  percentChange: number | null;
  status: 'LIVE' | 'DATA_UNAVAILABLE';
}

interface StockLiveQuote {
  symbol: string;
  name: string;
  isin: string;
  sector: string;
  exchange: string;
  lastPrice: number | null;
  change: number | null;
  percentChange: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  volume: number | null;
  status: 'LIVE' | 'DATA_UNAVAILABLE';
  statusMessage: string;
}

interface CandlePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'nse' | 'bse' | 'fno' | 'commodities'>('watchlist');
  const [selectedUnderlying, setSelectedUnderlying] = useState<'NIFTY' | 'BANKNIFTY'>('NIFTY');
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlists, setWatchlists] = useState<WatchlistData[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<StockReference | null>(null);
  const [stockQuote, setStockQuote] = useState<StockLiveQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState('1D');
  const [chartCandles, setChartCandles] = useState<CandlePoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);

  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [isCreatingWatchlist, setIsCreatingWatchlist] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [loadingWatchlists, setLoadingWatchlists] = useState(true);

  // Load indices quotes
  const fetchIndices = useCallback(async () => {
    try {
      const res = await fetch('/api/market/indices');
      const data = await res.json();
      if (data?.indices) {
        setIndices(data.indices);
      }
    } catch {
      // Keep quiet on error
    }
  }, []);

  // Load user watchlists
  const fetchWatchlists = useCallback(async () => {
    try {
      setLoadingWatchlists(true);
      const res = await fetch('/api/watchlists');
      const data = await res.json();
      if (data.watchlists && data.watchlists.length > 0) {
        setWatchlists(data.watchlists);
        setActiveWatchlistId((prev) => prev || data.watchlists[0].id);
      }
    } catch (e) {
      console.error('Error fetching watchlists:', e);
    } finally {
      setLoadingWatchlists(false);
    }
  }, []);

  useEffect(() => {
    fetchIndices();
    fetchWatchlists();
  }, [fetchIndices, fetchWatchlists]);

  // Fetch live stock quote & candles when modal opens or timeframe changes
  useEffect(() => {
    if (!selectedStock) {
      setStockQuote(null);
      setChartCandles([]);
      return;
    }

    let isMounted = true;
    setLoadingQuote(true);
    fetch(`/api/market/stocks/${selectedStock.symbol}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.stock) {
          setStockQuote(data.stock);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingQuote(false);
      });

    setLoadingChart(true);
    fetch(`/api/market/charts?symbol=${selectedStock.symbol}&timeframe=${chartTimeframe}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data.candles)) {
          setChartCandles(data.candles);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingChart(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStock, chartTimeframe]);

  async function handleCreateWatchlist(e: React.FormEvent) {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;

    try {
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWatchlistName, symbols: [] }),
      });
      const data = await res.json();
      if (data.watchlist) {
        setWatchlists([...watchlists, data.watchlist]);
        setActiveWatchlistId(data.watchlist.id);
        setNewWatchlistName('');
        setIsCreatingWatchlist(false);
      }
    } catch (e) {
      console.error('Error creating watchlist:', e);
    }
  }

  async function toggleWatchlistStock(symbol: string) {
    const current = watchlists.find((w) => w.id === activeWatchlistId);
    if (!current) return;

    const exists = current.symbols.includes(symbol);
    const updatedSymbols = exists
      ? current.symbols.filter((s) => s !== symbol)
      : [...current.symbols, symbol];

    try {
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: current.id,
          name: current.name,
          symbols: updatedSymbols,
        }),
      });
      const data = await res.json();
      if (data.watchlist) {
        setWatchlists(
          watchlists.map((w) => (w.id === current.id ? data.watchlist : w))
        );
      }
    } catch (e) {
      console.error('Error updating watchlist:', e);
    }
  }

  async function handleDeleteWatchlist(id: string) {
    if (!confirm('Are you sure you want to delete this watchlist?')) return;
    try {
      await fetch(`/api/watchlists?id=${id}`, { method: 'DELETE' });
      const remaining = watchlists.filter((w) => w.id !== id);
      setWatchlists(remaining);
      if (remaining.length > 0) {
        setActiveWatchlistId(remaining[0].id);
      }
    } catch (e) {
      console.error('Delete watchlist error:', e);
    }
  }

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId);

  // Filter stocks for search
  const filteredStocks = REFERENCE_STOCKS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const watchlistStocks = activeWatchlist
    ? REFERENCE_STOCKS.filter((s) => activeWatchlist.symbols.includes(s.symbol))
    : [];

  const displayIndices =
    indices.length > 0
      ? indices
      : [
          { name: 'NIFTY 50', symbol: 'NIFTY50', exchange: 'NSE', lastPrice: null, change: null, percentChange: null, status: 'DATA_UNAVAILABLE' as const },
          { name: 'S&P BSE SENSEX', symbol: 'SENSEX', exchange: 'BSE', lastPrice: null, change: null, percentChange: null, status: 'DATA_UNAVAILABLE' as const },
          { name: 'NIFTY BANK', symbol: 'BANKNIFTY', exchange: 'NSE', lastPrice: null, change: null, percentChange: null, status: 'DATA_UNAVAILABLE' as const },
        ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Market Center</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time indices, Indian equities directory, F&amp;O derivatives, and commodities.
        </p>
      </div>

      {/* Client-safe Market Status Notice */}
      <StatusBanner
        type="info"
        message="Verified Indian Market Directory. Live tick streams refresh during official exchange sessions (09:15 - 15:30 IST)."
      />

      {/* Indices Bar with Live vs Awaiting Session status */}
      <div className="grid grid-cols-3 gap-2">
        {displayIndices.slice(0, 3).map((idx) => {
          const isLive = idx.status === 'LIVE' && typeof idx.lastPrice === 'number';
          return (
            <Card key={idx.symbol} className="p-3 bg-[#111927] border-slate-800">
              <div className="text-[11px] font-medium text-slate-400 truncate">{idx.name}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1 font-mono">
                {isLive ? `₹ ${idx.lastPrice?.toLocaleString('en-IN')}` : '--'}
              </div>
              <div
                className={`text-[10px] font-medium mt-0.5 ${
                  isLive ? 'text-emerald-400' : 'text-amber-400/90'
                }`}
              >
                {isLive ? 'Live Feed' : 'Feeds Offline'}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <Input
          placeholder="Search stocks, indices, derivatives..."
          className="pl-10 text-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Market Segments Navigation: Watchlist, NSE, BSE, F&O, Commodities */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`py-2 rounded-lg font-semibold transition-all truncate px-1 ${
            activeTab === 'watchlist'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Watchlist
        </button>
        <button
          onClick={() => setActiveTab('nse')}
          className={`py-2 rounded-lg font-semibold transition-all truncate px-1 ${
            activeTab === 'nse'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          NSE Stocks
        </button>
        <button
          onClick={() => setActiveTab('bse')}
          className={`py-2 rounded-lg font-semibold transition-all truncate px-1 ${
            activeTab === 'bse'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          BSE &amp; Indices
        </button>
        <button
          onClick={() => setActiveTab('fno')}
          className={`py-2 rounded-lg font-semibold transition-all truncate px-1 ${
            activeTab === 'fno'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          F&amp;O
        </button>
        <button
          onClick={() => setActiveTab('commodities')}
          className={`py-2 rounded-lg font-semibold transition-all truncate px-1 ${
            activeTab === 'commodities'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Commodities
        </button>
      </div>

      {/* TAB 1: WATCHLIST */}
      {activeTab === 'watchlist' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5">
              {watchlists.map((wl) => (
                <button
                  key={wl.id}
                  onClick={() => setActiveWatchlistId(wl.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                    activeWatchlistId === wl.id
                      ? 'bg-slate-800 text-white border-emerald-500'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {wl.name} ({wl.symbols.length})
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreatingWatchlist(true)}
              className="text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New
            </Button>
          </div>

          {isCreatingWatchlist && (
            <Card className="p-3 bg-[#111927]">
              <form onSubmit={handleCreateWatchlist} className="flex gap-2">
                <Input
                  placeholder="Watchlist name..."
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  autoFocus
                />
                <Button type="submit" size="sm" variant="primary">
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreatingWatchlist(false)}
                >
                  Cancel
                </Button>
              </form>
            </Card>
          )}

          {watchlistStocks.length > 0 ? (
            <div className="space-y-2">
              {watchlistStocks.map((stock) => (
                <Card
                  key={stock.symbol}
                  variant="interactive"
                  onClick={() => setSelectedStock(stock)}
                  className="flex items-center justify-between p-3.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{stock.symbol}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {stock.exchange}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-[200px]">
                      {stock.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 block">
                      Feed Unconfigured
                    </span>
                    <span className="text-[10px] text-slate-500">{stock.sector}</span>
                  </div>
                </Card>
              ))}

              {activeWatchlist && (
                <div className="pt-2 text-right">
                  <button
                    onClick={() => handleDeleteWatchlist(activeWatchlist.id)}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete &quot;{activeWatchlist.name}&quot;
                  </button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={Bookmark}
              title="Watchlist is empty"
              description="Browse NSE Stocks or search above to add stocks to this watchlist."
              actionLabel="Explore NSE Stocks"
              onAction={() => setActiveTab('nse')}
            />
          )}
        </div>
      )}

      {/* TAB 2: NSE EQUITIES DIRECTORY */}
      {activeTab === 'nse' && (
        <div className="space-y-2">
          {filteredStocks.map((stock) => {
            const isBookmarked = activeWatchlist?.symbols.includes(stock.symbol);

            return (
              <Card
                key={stock.symbol}
                variant="interactive"
                onClick={() => setSelectedStock(stock)}
                className="flex items-center justify-between p-3.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{stock.symbol}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {stock.exchange}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 truncate max-w-[200px]">
                    {stock.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{stock.sector}</div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleWatchlistStock(stock.symbol)}
                    className={`p-2 rounded-xl border transition-colors ${
                      isBookmarked
                        ? 'bg-blue-950/60 border-blue-700 text-blue-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title={isBookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 3: BSE & BENCHMARK INDICES */}
      {activeTab === 'bse' && (
        <div className="space-y-2">
          {displayIndices.map((idx) => {
            const isLive = idx.status === 'LIVE' && typeof idx.lastPrice === 'number';
            return (
              <Card key={idx.symbol} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-white">{idx.name}</div>
                    <div className="text-xs text-slate-400">{idx.exchange} Benchmark Index</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-100 font-mono block">
                      {isLive ? `₹ ${idx.lastPrice?.toLocaleString('en-IN')}` : 'Data Unavailable'}
                    </span>
                    <div className="text-[10px] text-slate-500">
                      {isLive ? 'Live Exchange Quote' : 'Exchange session required'}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 4: F&O DERIVATIVES */}
      {activeTab === 'fno' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedUnderlying('NIFTY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedUnderlying === 'NIFTY'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                NIFTY 50
              </button>
              <button
                onClick={() => setSelectedUnderlying('BANKNIFTY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedUnderlying === 'BANKNIFTY'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                BANK NIFTY
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">NSE Derivatives</span>
          </div>

          <Card className="p-5 text-center bg-[#131C2E] border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Futures &amp; Options Desk</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Real-time strike matrices, Call/Put Greeks, Open Interest (OI), and Put-Call Ratio (PCR) refresh during active exchange market hours (09:15-15:30 IST).
              </p>
            </div>
            <div className="pt-1">
              <a
                href="https://smctradeonline.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button variant="smc" size="sm" className="text-xs">
                  Trade F&amp;O via SMC Ace <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </a>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: COMMODITIES (MCX) */}
      {activeTab === 'commodities' && (
        <div className="space-y-3">
          <Card className="p-5 text-center bg-[#131C2E] border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Commodity Derivatives Desk (MCX)</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Gold, Silver, Crude Oil, and Natural Gas contracts operate under Multi Commodity Exchange (MCX) hours. Live tick feeds update during evening trading sessions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 max-w-sm mx-auto text-left">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bullion</span>
                <span className="text-slate-200 font-medium">Gold &amp; Silver Mini</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Energy</span>
                <span className="text-slate-200 font-medium">Crude Oil &amp; Natural Gas</span>
              </div>
            </div>

            <div className="pt-1">
              <a
                href="https://smctradeonline.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button variant="smc" size="sm" className="text-xs">
                  Trade MCX Commodities via SMC Ace <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </a>
            </div>
          </Card>
        </div>
      )}

      {/* STOCK DETAILS & TECHNICAL CHART MODAL */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#131C2E] border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{selectedStock.symbol}</h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {selectedStock.exchange}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{selectedStock.name}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">ISIN: {selectedStock.isin}</p>
              </div>
              <button
                onClick={() => setSelectedStock(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price section */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Current Market Price (CMP)</div>
                  <div className="text-base font-bold text-slate-100 mt-0.5 font-mono">
                    {loadingQuote
                      ? 'Fetching...'
                      : stockQuote?.status === 'LIVE' && typeof stockQuote.lastPrice === 'number'
                      ? `₹ ${stockQuote.lastPrice.toLocaleString('en-IN')}`
                      : 'Data Unavailable'}
                  </div>
                </div>
                <div
                  className={`px-2 py-0.5 rounded border text-[10px] font-mono ${
                    stockQuote?.status === 'LIVE'
                      ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {stockQuote?.status === 'LIVE' ? 'Live Quote' : 'Offline'}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {stockQuote?.statusMessage || 'Exchange quotes refresh during official market hours.'}
              </p>
            </div>

            {/* Technical Chart Container */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Technical Chart (OHLC)</span>
                <div className="flex gap-1 text-[10px]">
                  {['1D', '1W', '1M', '1Y'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setChartTimeframe(tf)}
                      className={`px-2 py-0.5 rounded font-mono transition-colors ${
                        chartTimeframe === tf
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Canvas Area */}
              {loadingChart ? (
                <div className="h-32 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-center text-xs text-slate-400">
                  Loading candles...
                </div>
              ) : chartCandles.length > 0 ? (
                <div className="h-32 rounded-lg bg-slate-950/80 border border-slate-800/80 p-2 flex flex-col justify-between">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>High: ₹{Math.max(...chartCandles.map((c) => c.high)).toLocaleString('en-IN')}</span>
                    <span>Low: ₹{Math.min(...chartCandles.map((c) => c.low)).toLocaleString('en-IN')}</span>
                  </div>
                  {/* Candle visualization */}
                  <div className="flex items-end justify-between h-20 gap-0.5 px-1">
                    {chartCandles.slice(-20).map((c, i) => {
                      const isUp = c.close >= c.open;
                      const maxVal = Math.max(...chartCandles.map((x) => x.high));
                      const minVal = Math.min(...chartCandles.map((x) => x.low));
                      const range = maxVal - minVal || 1;
                      const heightPct = Math.max(10, Math.min(100, Math.round(((c.close - minVal) / range) * 100)));
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center justify-end h-full"
                          title={`${c.timestamp}: O:${c.open} C:${c.close}`}
                        >
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-t-sm ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[9px] text-slate-500 text-right font-mono">
                    {chartCandles.length} candles ({chartTimeframe})
                  </div>
                </div>
              ) : (
                <div className="h-28 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-col items-center justify-center text-center p-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-300">Chart Feed Offline</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 max-w-[240px]">
                    Technical chart candles refresh during exchange market sessions.
                  </span>
                </div>
              )}
            </div>

            {/* Fundamentals & Metadata */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sector</span>
                <span className="text-slate-200 font-medium">{selectedStock.sector}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Depository</span>
                <span className="text-slate-200 font-medium">NSDL / CDSL Eligible</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <a
                href="https://smctradeonline.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button variant="smc" size="md" className="w-full">
                  Trade on SMC Global <ExternalLink className="w-4 h-4 ml-1.5" />
                </Button>
              </a>

              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => {
                  toggleWatchlistStock(selectedStock.symbol);
                }}
              >
                {activeWatchlist?.symbols.includes(selectedStock.symbol)
                  ? 'Remove from Watchlist'
                  : 'Add to Watchlist'}
              </Button>
            </div>

            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              Tradosphere does not provide buy/sell calls or stock recommendations. All trade routing occurs exclusively through SMC Global.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
