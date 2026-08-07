import { Navigate, Route, Routes } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useStore, selectCurrentAccount } from '@/store/useStore';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SupplierResponsePage } from '@/pages/SupplierResponsePage';
import { ChatPage } from '@/pages/ChatPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { CustomerProductPage } from '@/pages/CustomerProductPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { BriefsPage } from '@/pages/admin/BriefsPage';
import { BriefDetailPage } from '@/pages/admin/BriefDetailPage';
import { CatalogPage } from '@/pages/admin/CatalogPage';
import { ProductDetailPage } from '@/pages/admin/ProductDetailPage';
import { SuppliersPage } from '@/pages/admin/SuppliersPage';
import { SourcingPage } from '@/pages/admin/SourcingPage';
import { SourcingThreadPage } from '@/pages/admin/SourcingThreadPage';
import { SamplesPage } from '@/pages/admin/SamplesPage';

function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'customer' | 'admin' }) {
  const account = useStore(selectCurrentAccount);
  if (!account) return <Navigate to="/login" replace />;
  if (role && account.role !== role) {
    return <Navigate to={account.role === 'admin' ? '/admin' : '/chat'} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const account = useStore(selectCurrentAccount);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to={!account ? '/login' : account.role === 'admin' ? '/admin' : '/chat'}
                replace
              />
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/supplier/respond/:token" element={<SupplierResponsePage />} />

          <Route
            path="/chat"
            element={
              <RequireAuth role="customer">
                <ChatPage />
              </RequireAuth>
            }
          />
          <Route
            path="/results/:briefId"
            element={
              <RequireAuth>
                <ResultsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/products/:productId"
            element={
              <RequireAuth role="customer">
                <CustomerProductPage />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth role="customer">
                <OrdersPage />
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAuth role="admin">
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/briefs"
            element={
              <RequireAuth role="admin">
                <BriefsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/briefs/:briefId"
            element={
              <RequireAuth role="admin">
                <BriefDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/catalog"
            element={
              <RequireAuth role="admin">
                <CatalogPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/catalog/:productId"
            element={
              <RequireAuth role="admin">
                <ProductDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/suppliers"
            element={
              <RequireAuth role="admin">
                <SuppliersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/sourcing"
            element={
              <RequireAuth role="admin">
                <SourcingPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/sourcing/:briefId"
            element={
              <RequireAuth role="admin">
                <SourcingThreadPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/samples"
            element={
              <RequireAuth role="admin">
                <SamplesPage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
