'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaRegistrar() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showStatusBanner, setShowStatusBanner] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 1. Initial online status
    if (typeof window !== 'undefined' && 'onLine' in navigator) {
      setIsOnline(navigator.onLine);
    }

    // 2. Service Worker Registration
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV !== 'test'
    ) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((registration) => {
            // Check for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
                    // New content is available
                    console.log('[TWM PWA] New update available.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('[TWM PWA] Service worker registration failed:', err);
          });
      });
    }

    // 3. Network listeners
    function handleOnline() {
      setIsOnline(true);
      setShowStatusBanner(true);
      const timer = setTimeout(() => setShowStatusBanner(false), 4000);
      return () => clearTimeout(timer);
    }

    function handleOffline() {
      setIsOnline(false);
      setShowStatusBanner(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 4. Capture PWA install prompt
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstallClick() {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } catch (err) {
      console.error('[TWM PWA] Install error:', err);
    }
  }

  return (
    <>
      {/* Network connectivity banner */}
      {showStatusBanner && (
        <aside
          role="status"
          aria-live="polite"
          className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all ${
            isOnline
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-600 text-white animate-pulse'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Connection restored. System online.</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline mode — Live market data paused. Connection required.</span>
            </>
          )}
        </aside>
      )}

      {/* Android/Mobile PWA Install Prompt Banner (if eligible and prompted) */}
      {installPrompt && (
        <aside
          aria-label="Install App"
          className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50 bg-[#131C2E] border border-blue-600/50 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              TWM
            </div>
            <div>
              <div className="font-bold text-white">Install TWM App</div>
              <div className="text-[11px] text-slate-400">Add to your home screen</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Install
            </button>
            <button
              onClick={() => setInstallPrompt(null)}
              className="p-1.5 text-slate-400 hover:text-white text-xs"
              aria-label="Dismiss install prompt"
            >
              ✕
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
