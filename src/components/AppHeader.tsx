import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Globe, LogOut, RotateCcw } from 'lucide-react';
import { useStore, selectCurrentAccount } from '@/store/useStore';
import { getProvider } from '@/lib/ai';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const CUSTOMER_NAV: NavItem[] = [
  { to: '/chat', label: 'Briefing' },
  { to: '/orders', label: 'Orders' },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/briefs', label: 'Briefs' },
  { to: '/admin/catalog', label: 'Catalog' },
  { to: '/admin/sourcing', label: 'Sourcing' },
  { to: '/admin/suppliers', label: 'Manufacturers' },
  { to: '/admin/samples', label: 'Samples' },
];

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useStore(selectCurrentAccount);
  const accounts = useStore((s) => s.accounts);
  const switchAccount = useStore((s) => s.switchAccount);
  const logout = useStore((s) => s.logout);
  const aiMode = useStore((s) => s.aiMode);
  const setAiMode = useStore((s) => s.setAiMode);
  const resetDemo = useStore((s) => s.resetDemo);
  const provider = getProvider(aiMode);
  const live = provider.id === 'openrouter';

  const isSupplierForm = location.pathname.startsWith('/supplier/');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isSupplierForm) {
    return (
      <header className="sticky top-0 z-40 px-4 pb-2 pt-4 lg:px-8">
        <div className="island mx-auto flex h-12 w-full max-w-[1240px] items-center gap-3 rounded-pill border border-hairline bg-paper/92 pl-5 pr-5 backdrop-blur">
          <span className="flex items-center gap-2">
            <span className="grid size-5 place-items-center rounded-[5px] bg-ink text-[10px] font-bold text-lime">
              L
            </span>
            <span className="text-[14px] font-bold tracking-[0.16em]">LABTREE</span>
          </span>
          <span className="ml-auto text-[12px] text-muted">Supplier response</span>
        </div>
      </header>
    );
  }

  const role = account?.role ?? 'customer';
  const nav = role === 'customer' ? CUSTOMER_NAV : ADMIN_NAV;

  return (
    <header className="sticky top-0 z-40 px-4 pb-2 pt-4 lg:px-8">
      <div className="island mx-auto flex h-12 w-full max-w-[1240px] items-center gap-3 rounded-pill border border-hairline bg-paper/92 pl-5 pr-1.5 backdrop-blur">
        <Link to={account ? '/' : '/login'} className="flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-[5px] bg-ink text-[10px] font-bold text-lime">
            L
          </span>
          <span className="text-[14px] font-bold tracking-[0.16em]">LABTREE</span>
        </Link>

        {account && (
          <nav className="mx-auto hidden items-center gap-0.5 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) =>
                  cn(
                    'rounded-pill px-3.5 py-1.5 text-[13px] transition-colors',
                    isActive ? 'bg-surface font-medium text-ink' : 'text-muted hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          {account && (
            <>
              <button
                type="button"
                onClick={() => setAiMode(live ? 'mock' : 'auto')}
                title={
                  live
                    ? `Live model: ${provider.label}. Click to switch to the scripted provider.`
                    : 'Scripted provider. Click to use the live model.'
                }
                className="hidden items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-[11px] text-muted transition-colors hover:text-ink lg:flex"
              >
                <span
                  className={cn('size-1.5 rounded-full', live ? 'bg-good' : 'bg-muted/50')}
                  aria-hidden
                />
                {live ? 'AI live' : 'AI scripted'}
              </button>

              <span className="hidden items-center gap-1 rounded-pill px-2 py-1.5 text-[11px] text-muted lg:flex">
                <Globe className="size-3" /> EN
              </span>

              <span className="rounded-pill border border-hairline px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                Demo
              </span>

              <Select
                aria-label="Switch account"
                value={account.id}
                onChange={(e) => {
                  const next = accounts.find((a) => a.id === e.target.value);
                  if (!next) return;
                  switchAccount(next.id);
                  navigate(next.role === 'admin' ? '/admin' : '/chat');
                }}
                className="h-8 w-[200px] text-[12px]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.role === 'admin' ? 'Admin' : 'Customer'}: {a.name}
                  </option>
                ))}
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                title="Sign out"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                title="Reset demo"
                onClick={() => {
                  if (confirm('Reset the demo to its initial state?')) {
                    resetDemo();
                    navigate('/');
                  }
                }}
              >
                <RotateCcw />
              </Button>
            </>
          )}

          {!account && !isAuthPage && (
            <Button size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
