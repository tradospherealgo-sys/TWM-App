import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Part 9: PWA, UX & Production Experience Suite', () => {
  const rootDir = process.cwd();

  describe('1. Web App Manifest & Installation Compliance', () => {
    const manifestPath = path.join(rootDir, 'public', 'manifest.json');

    it('should have a valid, well-formed web app manifest file', () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
      const content = fs.readFileSync(manifestPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should specify correct official branding and standalone configuration', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.name).toBe('Tradosphere Wealth Management');
      expect(manifest.short_name).toBe('TWM');
      expect(['/', '/home']).toContain(manifest.start_url);
      expect(manifest.display).toBe('standalone');
      expect(manifest.orientation).toBe('portrait-primary');
      expect(manifest.theme_color).toBe('#0B111E');
      expect(manifest.background_color).toBe('#0B111E');
      expect(manifest.scope).toBe('/');
    });

    it('should specify all required mobile install icon sizes including maskable', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(4);

      const sizes = manifest.icons.map((i: any) => i.sizes);
      expect(sizes).toContain('192x192');
      expect(sizes).toContain('512x512');

      const maskables = manifest.icons.filter((i: any) => i.purpose === 'maskable');
      expect(maskables.length).toBeGreaterThanOrEqual(2);
      expect(maskables.some((m: any) => m.sizes === '192x192')).toBe(true);
      expect(maskables.some((m: any) => m.sizes === '512x512')).toBe(true);
    });

    it('should provide useful PWA shortcuts for key financial actions', () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(Array.isArray(manifest.shortcuts)).toBe(true);
      const shortcutUrls = manifest.shortcuts.map((s: any) => s.url);
      expect(shortcutUrls).toContain('/markets');
      expect(shortcutUrls).toContain('/invest');
      expect(shortcutUrls).toContain('/applications');
      expect(shortcutUrls).toContain('/notifications');
    });
  });

  describe('2. PWA Icon Assets & Brand Identity Verification', () => {
    const icons = [
      'public/icons/icon-192.png',
      'public/icons/icon-512.png',
      'public/icons/icon-maskable-192.png',
      'public/icons/icon-maskable-512.png',
      'public/icons/apple-touch-icon.png',
      'public/favicon.ico',
      'public/favicon.svg',
    ];

    it.each(icons)('should verify asset exists and is non-empty: %s', (relativePath) => {
      const filePath = path.join(rootDir, relativePath);
      expect(fs.existsSync(filePath)).toBe(true);
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(50);
    });
  });

  describe('3. Service Worker Safety & Sensitive Data Protection', () => {
    const swPath = path.join(rootDir, 'public', 'sw.js');

    it('should have a dedicated service worker script', () => {
      expect(fs.existsSync(swPath)).toBe(true);
    });

    it('must enforce strict network-only rules for API and document requests', () => {
      const swCode = fs.readFileSync(swPath, 'utf8');

      // Verify that API routes and documents are guarded against insecure offline caching
      expect(swCode).toContain("url.pathname.startsWith('/api/')");
      expect(swCode).toContain("url.pathname.startsWith('/documents/')");
      expect(swCode).toContain('no-store');

      // Verify that sensitive keywords are explicitly guarded
      expect(swCode).toContain('NEVER cache authenticated API requests');
      expect(swCode).toContain('NEVER cache KYC documents');
    });

    it('should provide offline fallback handling for navigation requests', () => {
      const swCode = fs.readFileSync(swPath, 'utf8');
      expect(swCode).toContain("event.request.mode === 'navigate'");
      expect(swCode).toContain('/offline');
    });
  });

  describe('4. Next.js Production UX Boundaries', () => {
    it('should provide root loading, error, and not-found state handlers', () => {
      expect(fs.existsSync(path.join(rootDir, 'src/app/loading.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'src/app/error.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'src/app/not-found.tsx'))).toBe(true);
    });

    it('should provide role-specific panel loading skeletons', () => {
      expect(fs.existsSync(path.join(rootDir, 'src/app/(client)/loading.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'src/app/employee/loading.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(rootDir, 'src/app/admin/loading.tsx'))).toBe(true);
    });

    it('should sanitize errors and prevent leaking internal paths or database queries', () => {
      const errorComponentCode = fs.readFileSync(
        path.join(rootDir, 'src/app/error.tsx'),
        'utf8'
      );
      // User facing message is generic and reassuring
      expect(errorComponentCode).toContain('Your account and financial records remain safe');
      expect(errorComponentCode).not.toContain('prisma');
      expect(errorComponentCode).not.toContain('SELECT ');
      expect(errorComponentCode).not.toContain('DATABASE_URL');
    });
  });

  describe('5. Truthful Financial State & Disclaimers Verification', () => {
    it('markets page should truthfully disclose unconfigured feed and reference NSE data', () => {
      const marketsCode = fs.readFileSync(
        path.join(rootDir, 'src/app/(client)/markets/page.tsx'),
        'utf8'
      );
      expect(marketsCode).toContain('Feed Unconfigured');
      expect(marketsCode).toContain('Data Unavailable');
      expect(marketsCode).toContain('All trade routing occurs exclusively through SMC Global');
    });

    it('investment and protection pages should enforce statutory regulatory disclaimers', () => {
      const investCode = fs.readFileSync(
        path.join(rootDir, 'src/app/(client)/invest/page.tsx'),
        'utf8'
      );
      expect(investCode).toContain('SEBI Disclaimer');
      expect(investCode).toContain('Mutual fund investments are subject to market risks');
      expect(investCode).toContain('do not represent guaranteed returns');

      const protectCode = fs.readFileSync(
        path.join(rootDir, 'src/app/(client)/protect/page.tsx'),
        'utf8'
      );
      expect(protectCode).toContain('Insurance is the subject matter of solicitation');

      const borrowCode = fs.readFileSync(
        path.join(rootDir, 'src/app/(client)/borrow/page.tsx'),
        'utf8'
      );
      expect(borrowCode).toContain('TWM does not independently guarantee loan approval');
    });

    it('signals module should preserve 6-agent review structure and disclaim advisory targets', () => {
      const signalsCode = fs.readFileSync(
        path.join(rootDir, 'src/app/(client)/signals/page.tsx'),
        'utf8'
      );
      expect(signalsCode).toContain('Non-advisory educational research');
      expect(signalsCode).toContain('Zero guaranteed returns');
      expect(signalsCode).toContain('Atlas');

      const detailCode = fs.readFileSync(
        path.join(rootDir, 'src/app/(client)/signals/[id]/page.tsx'),
        'utf8'
      );
      expect(detailCode).toContain('ATLAS');
    });
  });
});
