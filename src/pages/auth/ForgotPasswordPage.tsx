import { useState } from 'react';
import { Link } from 'react-router-dom';
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
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues): Promise<void> => {
    setServerError('');
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setServerError(extractApiError(err).message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <AuthCardHeader title="Forgot password" subtitle="Enter your registered email and we'll send a reset link." />

      {sent ? (
        <div className="card p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-500 dark:bg-success-500/15">
            <span className="icon text-[26px]">mark_email_read</span>
          </span>
          <h2 className="mt-4 text-lg font-semibold text-ink-light dark:text-ink-dark">Check your inbox</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            We've sent a password reset link to <b>{getValues('email')}</b>. The link expires in 30 minutes.
          </p>
          <Link to="/login" className="mt-6 inline-block">
            <Button variant="outline" className="w-full">Back to Sign In</Button>
          </Link>
        </div>
      ) : (
        <>
          {serverError && (
            <div role="alert" className="mb-5 rounded-lg border border-danger-200 dark:border-danger-500/30 bg-danger-50 dark:bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-400">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<span>mail</span>}
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Send Reset Link
            </Button>
          </form>
        </>
      )}

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
          Back to sign in
        </Link>
      </p>
    </motion.div>
  );
}
