'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, Download, ShieldAlert, RotateCcw } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaRegistrar() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showStatusBanner, setShowStatusBanner] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [reloadLoopDetected, setReloadLoopDetected] = useState<boolean>(false);

  useEffect(() => {
    // 1. Initial online status
    if (typeof window !== 'undefined' && 'onLine' in navigator) {
      setIsOnline(navigator.onLine);
    }

    // 2. Mobile PWA reload-loop protection & automatic safety recovery
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      const RELOAD_TRACKER_KEY = 'twm_pwa_reload_ts';
      const WINDOW_MS = 8000; // 8 seconds burst window
      const MAX_BURST = 4;

      try {
        const now = Date.now();
        const raw = sessionStorage.getItem(RELOAD_TRACKER_KEY);
        const timestamps: number[] = raw ? JSON.parse(raw) : [];
        const recent = timestamps.filter((t) => now - t < WINDOW_MS);
        recent.push(now);

        if (recent.length >= MAX_BURST) {
          // Loop detected: Stop reloads, clear caches and signal recovery
          console.warn('[TWM PWA] Repeated reload loop detected. Activating recovery mode.');
          setReloadLoopDetected(true);
          sessionStorage.removeItem(RELOAD_TRACKER_KEY);

          if ('caches' in window) {
            caches.keys().then((names) => {
              names.forEach((name) => caches.delete(name));
            });
          }
          fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        } else {
          sessionStorage.setItem(RELOAD_TRACKER_KEY, JSON.stringify(recent));
          // If the app remains stable for 6 seconds, reset tracker
          const stableTimer = setTimeout(() => {
            sessionStorage.removeItem(RELOAD_TRACKER_KEY);
          }, 6000);
          return () => clearTimeout(stableTimer);
        }
      } catch {
        // Storage access restricted
      }
    }

    // 3. Service Worker Registration (supporting document.readyState complete)
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV !== 'test'
    ) {
      const registerSW = () => {
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
                    console.log('[TWM PWA] New update available.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('[TWM PWA] Service worker registration failed:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
              TS
            </div>
            <div>
              <div className="font-bold text-white">Install Tradosphere</div>
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

      {/* Recoverable reload loop & session error modal */}
      {reloadLoopDetected && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="recovery-title"
          className="fixed inset-0 z-50 bg-[#0B111E]/95 backdrop-blur-md flex items-center justify-center p-4 text-slate-100"
        >
          <div className="bg-[#131C2E] border border-blue-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 id="recovery-title" className="text-base font-bold text-white">
                Session Reset & Recovery
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Repeated reloads were detected on this device. Stale caches and session tokens have been safely cleared to restore system stability.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/login?clear=1';
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                Sign In to Tradosphere
              </button>
              <button
                type="button"
                onClick={() => {
                  setReloadLoopDetected(false);
                  window.location.reload();
                }}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
