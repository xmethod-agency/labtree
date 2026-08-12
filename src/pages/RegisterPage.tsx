import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useStore, selectCurrentAccount } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export function RegisterPage() {
  const navigate = useNavigate();
  const account = useStore(selectCurrentAccount);
  const register = useStore((s) => s.register);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (account) {
    return <Navigate to={account.role === 'admin' ? '/admin' : '/chat'} replace />;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = register({ name, company, email, password });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/chat');
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-panel border border-hairline bg-paper p-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Labtree portal</p>
        <h1 className="mt-2 text-2xl font-semibold display-tight">Create customer account</h1>
        <p className="mt-2 text-[13px] text-muted">
          Registration is for brand customers. Manufacturer replies use a personal form link — no
          supplier login required.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-name">Full name</Label>
            <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-company">Company</Label>
            <Input
              id="reg-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={4}
              required
            />
          </div>

          {error && <p className="text-[13px] text-bad">{error}</p>}

          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-[13px] text-muted">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-ink underline decoration-hairline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
