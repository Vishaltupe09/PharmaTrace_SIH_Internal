import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/public/LandingPage';
import { VerifyPage } from './pages/public/VerifyPage';
import { ExplorerPage } from './pages/public/ExplorerPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManufacturerDashboard } from './pages/manufacturer/ManufacturerDashboard';
import { DistributorDashboard } from './pages/distributor/DistributorDashboard';
import { WholesalerDashboard } from './pages/wholesaler/WholesalerDashboard';
import { PharmacyDashboard } from './pages/pharmacy/PharmacyDashboard';
import { InspectorDashboard } from './pages/inspector/InspectorDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/explorer" element={<ExplorerPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Role Portals */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manufacturer"
                  element={
                    <ProtectedRoute allowedRoles={['MANUFACTURER']}>
                      <ManufacturerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/distributor"
                  element={
                    <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                      <DistributorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wholesaler"
                  element={
                    <ProtectedRoute allowedRoles={['WHOLESALER']}>
                      <WholesalerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pharmacy"
                  element={
                    <ProtectedRoute allowedRoles={['PHARMACY']}>
                      <PharmacyDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inspector"
                  element={
                    <ProtectedRoute allowedRoles={['INSPECTOR']}>
                      <InspectorDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Global Footer */}
            <footer className="glass-panel border-t border-slate-800/80 py-6 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
                <div>
                  © 2026 PharmaTrace • Smart India Hackathon Live Prototype
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span>Hardhat Node: 127.0.0.1:8545</span>
                  <span>•</span>
                  <span>EVM Contract: 0x5FbD...0aa3</span>
                </div>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
