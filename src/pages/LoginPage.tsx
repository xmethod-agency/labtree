import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { SEED_ACCOUNTS, DEMO_PASSWORD } from '@/data/accounts';
import { useStore, selectCurrentAccount } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export function LoginPage() {
  const navigate = useNavigate();
  const account = useStore(selectCurrentAccount);
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState(SEED_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);

  if (account) {
    return <Navigate to={account.role === 'admin' ? '/admin' : '/chat'} replace />;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const next = useStore.getState().accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    navigate(next?.role === 'admin' ? '/admin' : '/chat');
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-panel border border-hairline bg-paper p-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Labtree portal</p>
        <h1 className="mt-2 text-2xl font-semibold display-tight">Sign in</h1>
        <p className="mt-2 text-[13px] text-muted">
          Demo accounts below — password for all: <span className="num text-ink">{DEMO_PASSWORD}</span>
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-account">Quick pick</Label>
            <Select
              id="login-account"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setPassword(DEMO_PASSWORD);
                setError(null);
              }}
            >
              {SEED_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.email}>
                  {a.role === 'admin' ? 'Admin' : 'Customer'} — {a.name} ({a.company})
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-[13px] text-bad">{error}</p>}

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-center text-[13px] text-muted">
          No account?{' '}
          <Link to="/register" className="font-medium text-ink underline decoration-hairline underline-offset-4">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
