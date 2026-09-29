import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { AuthCardHeader } from '@/layouts/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { extractApiError } from '@/api/client';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

const demoAccounts = [
  { email: 'applicant@demo.in', role: 'Applicant' },
  { email: 'verification@demo.in', role: 'Verification Officer' },
  { email: 'passport@demo.in', role: 'Passport Officer' },
  { email: 'admin@demo.in', role: 'Admin' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const fillDemo = (demoEmail: string): void => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setValue('email', demoEmail, { shouldValidate: false });
    setValue('password', 'Password@123', { shouldValidate: false });
  };

  const onSubmit = async (values: FormValues): Promise<void> => {
    setServerError('');
    try {
      await login(values.email, values.password);
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (err) {
      setServerError(extractApiError(err).message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <AuthCardHeader title="Welcome back" subtitle="Sign in to your PAMS account to apply or track applications." />

      {serverError && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-danger-200 dark:border-danger-500/30 bg-danger-50 dark:bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-400">
          <span className="icon text-[18px]">error</span>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Email Address"
          placeholder="you@example.com"
          leftIcon={<span>mail</span>}
          error={errors.email?.message}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setValue('email', e.target.value); }}
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          leftIcon={<span>lock</span>}
          error={errors.password?.message}
          {...register('password')}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setValue('password', e.target.value); }}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span className="icon text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          }
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-secondary-500" defaultChecked />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Sign In
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Demo accounts · password: Password@123</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {demoAccounts.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => fillDemo(d.email)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-left text-xs transition-colors hover:border-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-500/10"
            >
              <span className="block font-semibold text-ink-light dark:text-ink-dark">{d.role}</span>
              <span className="block truncate text-slate-400">{d.email}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        New to PAMS?{' '}
        <Link to="/register" className="font-semibold text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
          Create an account
        </Link>
      </p>
    </motion.div>
  );
}
