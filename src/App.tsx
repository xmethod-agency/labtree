import { Navigate, Route, Routes } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { useStore } from '@/store/useStore';
import { ChatPage } from '@/pages/ChatPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { BriefsPage } from '@/pages/admin/BriefsPage';
import { BriefDetailPage } from '@/pages/admin/BriefDetailPage';
import { CatalogPage } from '@/pages/admin/CatalogPage';
import { ProductDetailPage } from '@/pages/admin/ProductDetailPage';
import { SuppliersPage } from '@/pages/admin/SuppliersPage';
import { SourcingPage } from '@/pages/admin/SourcingPage';
import { SourcingThreadPage } from '@/pages/admin/SourcingThreadPage';
import { SamplesPage } from '@/pages/admin/SamplesPage';

function AdminOnly({ children }: { children: React.ReactNode }) {
  const role = useStore((s) => s.role);
  if (role !== 'admin') return <Navigate to="/chat" replace />;
  return <>{children}</>;
}

export default function App() {
  const role = useStore((s) => s.role);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to={role === 'customer' ? '/chat' : '/admin'} replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/results/:briefId" element={<ResultsPage />} />
          <Route path="/orders" element={<OrdersPage />} />

          <Route
            path="/admin"
            element={
              <AdminOnly>
                <DashboardPage />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/briefs"
            element={
              <AdminOnly>
                <BriefsPage />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/briefs/:briefId"
            element={
              <AdminOnly>
                <BriefDetailPage />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/catalog"
            element={
              <AdminOnly>
                <CatalogPage />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/catalog/:productId"
            element={
              <AdminOnly>
                <ProductDetailPage />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/suppliers"
            element={
              <AdminOnly>
                <SuppliersPage />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/sourcing"
            element={
              <AdminOnly>
                <SourcingPage />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/sourcing/:briefId"
            element={
              <AdminOnly>
                <SourcingThreadPage />
              </AdminOnly>
            }
          />
          <Route
            path="/admin/samples"
            element={
              <AdminOnly>
                <SamplesPage />
              </AdminOnly>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
