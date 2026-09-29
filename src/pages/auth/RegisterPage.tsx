import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { AuthCardHeader } from '@/layouts/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { extractApiError } from '@/api/client';
import { maskPhone } from '@/utils/masks';

const schema = z
  .object({
    fullName: z.string().min(3, 'Full name must be at least 3 characters').max(80, 'Name is too long'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    phone: z
      .string()
      .transform((v) => v.replace(/\s/g, ''))
      .refine((v) => /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit Indian mobile number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[a-z]/, 'Include at least one lowercase letter')
      .regex(/\d/, 'Include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
    confirmPassword: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms to continue' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '', terms: false as unknown as true },
  });

  const onSubmit = async (values: FormValues): Promise<void> => {
    setServerError('');
    try {
      await registerUser({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setServerError(extractApiError(err).message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <AuthCardHeader
        title="Create your account"
        subtitle="Register as an applicant to start your passport application online."
      />

      {serverError && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-danger-200 dark:border-danger-500/30 bg-danger-50 dark:bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-400">
          <span className="icon text-[18px]">error</span>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Full Name"
          placeholder="As printed on your birth certificate"
          leftIcon={<span>person</span>}
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<span>mail</span>}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Mobile Number"
          inputMode="numeric"
          placeholder="98765 43210"
          leftIcon={<span>smartphone</span>}
          error={errors.phone?.message}
          {...register('phone')}
          onChange={(e) => {
            e.target.value = maskPhone(e.target.value);
          }}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password?.message}
            hint="8+ chars, upper & lowercase, number, symbol"
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
            {...register('password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <div>
          <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-secondary-500"
              {...register('terms')}
            />
            <span>
              I agree to the <span className="font-medium text-secondary-600 underline">Terms of Service</span> and{' '}
              <span className="font-medium text-secondary-600 underline">Privacy Policy</span>.
            </span>
          </label>
          {errors.terms && <p className="mt-1.5 text-xs text-danger-500">{errors.terms.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Create Account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-secondary-600 hover:text-secondary-700 dark:text-secondary-400">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
