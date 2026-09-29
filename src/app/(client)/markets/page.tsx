'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { REFERENCE_STOCKS, REFERENCE_INDICES, StockReference } from '@/lib/adapters/market-data';

interface WatchlistData {
  id: string;
  name: string;
  symbols: string[];
}

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'stocks' | 'indices'>('watchlist');
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlists, setWatchlists] = useState<WatchlistData[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<StockReference | null>(null);
  const [isCreatingWatchlist, setIsCreatingWatchlist] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlists();
  }, []);

  async function fetchWatchlists() {
    try {
      setLoading(true);
      const res = await fetch('/api/watchlists');
      const data = await res.json();
      if (data.watchlists && data.watchlists.length > 0) {
        setWatchlists(data.watchlists);
        setActiveWatchlistId(data.watchlists[0].id);
      }
    } catch (e) {
      console.error('Error fetching watchlists:', e);
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Market Center</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Indian equities directory and watchlists
        </p>
      </div>

      {/* Provider Status Notice */}
      <StatusBanner
        type="info"
        message="Market Data Feed: Live tick stream requires provider configuration in .env. Showing verified NSE reference directory."
      />

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`py-2 rounded-lg font-medium transition-all ${
            activeTab === 'watchlist'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Watchlists
        </button>
        <button
          onClick={() => setActiveTab('stocks')}
          className={`py-2 rounded-lg font-medium transition-all ${
            activeTab === 'stocks'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Equities
        </button>
        <button
          onClick={() => setActiveTab('indices')}
          className={`py-2 rounded-lg font-medium transition-all ${
            activeTab === 'indices'
              ? 'bg-blue-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Indices
        </button>
      </div>

      {/* Search Input */}
      {activeTab !== 'indices' && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <Input
            placeholder="Search company, symbol, or sector..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* TAB 1: WATCHLISTS */}
      {activeTab === 'watchlist' && (
        <div className="space-y-3">
          {/* Watchlist selector bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5">
              {watchlists.map((wl) => (
                <button
                  key={wl.id}
                  onClick={() => setActiveWatchlistId(wl.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                    activeWatchlistId === wl.id
                      ? 'bg-slate-800 text-white border-blue-500'
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

          {/* New watchlist form */}
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

          {/* Watchlist stocks list */}
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
              description="Browse All Equities or search above to add stocks to this watchlist."
              actionLabel="Explore All Equities"
              onAction={() => setActiveTab('stocks')}
            />
          )}
        </div>
      )}

      {/* TAB 2: ALL EQUITIES DIRECTORY */}
      {activeTab === 'stocks' && (
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

      {/* TAB 3: INDICES */}
      {activeTab === 'indices' && (
        <div className="space-y-2">
          {REFERENCE_INDICES.map((idx) => (
            <Card key={idx.symbol} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white">{idx.name}</div>
                  <div className="text-xs text-slate-400">{idx.exchange} Listed Index</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400">Data Unavailable</span>
                  <div className="text-[10px] text-slate-500">Requires live provider</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* STOCK DETAILS MODAL */}
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

            {/* Price section - Honest State */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400">Current Market Price (CMP)</div>
              <div className="text-base font-semibold text-slate-300 mt-1">Data Unavailable</div>
              <p className="text-[11px] text-amber-400/90 mt-1">
                Live market tick streaming is disabled pending market data provider API key configuration.
              </p>
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
