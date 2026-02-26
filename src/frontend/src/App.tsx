import { lazy, Suspense, useEffect } from 'react';
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import NeonBorder from '@/components/NeonBorder';
import Header from '@/components/Header';
import { useSettingsStore } from '@/hooks/useSettings';

const HomePage = lazy(() => import('@/pages/HomePage'));
const ContentGeneratorPage = lazy(() => import('@/pages/ContentGeneratorPage'));
const ContentHistoryPage = lazy(() => import('@/pages/ContentHistoryPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const AffiliateMarketingPage = lazy(() => import('@/pages/AffiliateMarketingPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-gold-muted text-sm font-medium">در حال بارگذاری...</p>
      </div>
    </div>
  );
}

function AppLayout() {
  // Subscribe to settings store changes and re-apply to DOM whenever settings update
  const settings = useSettingsStore((state) => state.settings);
  const applySettings = useSettingsStore((state) => state.applySettings);

  useEffect(() => {
    if (settings) {
      applySettings(settings);
    }
  }, [settings, applySettings]);

  return (
    <div className="app-frame relative min-h-screen flex flex-col overflow-hidden">
      <NeonBorder />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 px-4 py-6 md:px-8">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="py-4 text-center text-xs text-gold-muted border-t border-gold/10">
          <span>© {new Date().getFullYear()} شایلا — ساخته شده با </span>
          <span className="text-gold">♥</span>
          <span> توسط </span>
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'shayla-app')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold-light transition-colors"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({ component: AppLayout });

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <HomePage />
    </Suspense>
  ),
});

const contentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/content',
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ContentGeneratorPage />
    </Suspense>
  ),
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ProductsPage />
    </Suspense>
  ),
});

const affiliateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/affiliate',
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AffiliateMarketingPage />
    </Suspense>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SettingsPage />
    </Suspense>
  ),
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ContentHistoryPage />
    </Suspense>
  ),
});

const routeTree = rootRoute.addChildren([homeRoute, contentRoute, productsRoute, affiliateRoute, settingsRoute, historyRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" />
    </>
  );
}
