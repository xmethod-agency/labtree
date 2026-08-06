import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Globe, RotateCcw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getProvider } from '@/lib/ai';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const CUSTOMER_NAV: NavItem[] = [
  { to: '/chat', label: 'Briefing' },
  { to: '/orders', label: 'Samples' },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/briefs', label: 'Briefs' },
  { to: '/admin/catalog', label: 'Catalog' },
  { to: '/admin/sourcing', label: 'Sourcing' },
  { to: '/admin/suppliers', label: 'Manufacturers' },
  { to: '/admin/samples', label: 'Samples' },
];

function RoleSwitch({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  return (
    <div className="flex items-center rounded-pill bg-surface p-0.5">
      {(['customer', 'admin'] as Role[]).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={role === value}
          className={cn(
            'rounded-pill px-3 py-1.5 text-[12px] font-medium transition-colors',
            role === value ? 'bg-ink text-paper' : 'text-muted hover:text-ink',
          )}
        >
          {value === 'customer' ? 'Customer' : 'Admin'}
        </button>
      ))}
    </div>
  );
}

export function AppHeader() {
  const navigate = useNavigate();
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const aiMode = useStore((s) => s.aiMode);
  const setAiMode = useStore((s) => s.setAiMode);
  const resetDemo = useStore((s) => s.resetDemo);
  const provider = getProvider(aiMode);
  const live = provider.id === 'openrouter';

  const nav = role === 'customer' ? CUSTOMER_NAV : ADMIN_NAV;

  return (
    <header className="sticky top-0 z-40 px-4 pb-2 pt-4 lg:px-8">
      <div className="island mx-auto flex h-12 w-full max-w-[1240px] items-center gap-3 rounded-pill border border-hairline bg-paper/92 pl-5 pr-1.5 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-[5px] bg-ink text-[10px] font-bold text-lime">
            L
          </span>
          <span className="text-[14px] font-bold tracking-[0.16em]">LABTREE</span>
        </Link>

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

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
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

          <RoleSwitch
            role={role}
            onChange={(next) => {
              setRole(next);
              navigate(next === 'customer' ? '/chat' : '/admin');
            }}
          />

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
        </div>
      </div>
    </header>
  );
}
