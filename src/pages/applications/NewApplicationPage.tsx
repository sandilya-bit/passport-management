import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useCreateApplication } from '@/hooks/useApplications';
import { maskPhone, maskPincode } from '@/utils/masks';
import { APPLICATION_TYPE_LABELS, FEE_SCHEDULE, SEVA_CENTERS } from '@/utils/constants';
import { formatCurrency } from '@/utils/format';
import type { ApplicationType } from '@/types';

const schema = z.object({
  // Step 1 – applicant
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  // Step 2 – contact & address
  email: z.string().email('Enter a valid email address'),
  phone: z.string().refine((v) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, '')), 'Enter a valid 10-digit mobile'),
  address: z.string().min(10, 'Enter the complete address (min 10 chars)'),
  pincode: z.string().refine((v) => /^\d{6}$/.test(v), 'Enter a valid 6-digit pincode'),
  // Step 3 – application
  applicationType: z.enum(['FRESH', 'RENEWAL', 'RE_ISSUE', 'MINOR']),
  placeOfIssue: z.string().min(1, 'Select a Passport Seva Kendra'),
});

type FormValues = z.infer<typeof schema>;

const steps = [
  { id: 1, title: 'Applicant Details', icon: 'person' },
  { id: 2, title: 'Contact & Address', icon: 'contact_mail' },
  { id: 3, title: 'Application Type', icon: 'category' },
  { id: 4, title: 'Review & Submit', icon: 'fact_check' },
];

export default function NewApplicationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMutation = useCreateApplication();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { gender: 'MALE', applicationType: 'FRESH', placeOfIssue: SEVA_CENTERS[0] },
  });

  const applicationType = watch('applicationType') as ApplicationType;
  const fee = useMemo(() => FEE_SCHEDULE[applicationType] ?? 0, [applicationType]);

  const next = async (): Promise<void> => {
    const fieldsByStep: Record<number, (keyof FormValues)[]> = {
      1: ['fullName', 'dateOfBirth', 'gender'],
      2: ['email', 'phone', 'address', 'pincode'],
      3: ['applicationType', 'placeOfIssue'],
    };
    const valid = await trigger(fieldsByStep[step]);
    if (valid) setStep((s) => Math.min(4, s + 1));
  };

  const onSubmit = async (values: FormValues): Promise<void> => {
    try {
      const created = await createMutation.mutateAsync({
        applicantId: `APL-${values.fullName.length}`, // resolved server-side from session user
        applicationType: values.applicationType,
        placeOfIssue: values.placeOfIssue,
      });
      toast({
        tone: 'success',
        title: 'Application submitted',
        message: `${created.applicationCode} created. Next: upload documents.`,
      });
      navigate(`/applications/${created.id}`);
    } catch {
      toast({ tone: 'error', title: 'Submission failed', message: 'Please try again.' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New Passport Application"
        subtitle="Complete all four steps to submit your application."
        icon="note_add"
        breadcrumbs={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Applications', to: '/applications' },
          { label: 'New' },
        ]}
      />

      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-0 overflow-x-auto pb-1" aria-label="Application steps">
        {steps.map((s, i) => {
          const state = s.id < step ? 'done' : s.id === step ? 'current' : 'todo';
          return (
            <li key={s.id} className="flex items-center">
              <div className="flex items-center gap-2.5">
                <span
                  className={
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ' +
                    (state === 'done' && 'bg-success-500 text-white') +
                    (state === 'current' && 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900') +
                    (state === 'todo' && 'bg-slate-100 text-slate-400 dark:bg-slate-800')
                  }
                >
                  {state === 'done' ? <span className="icon text-[18px]">check</span> : s.id}
                </span>
                <span
                  className={
                    'hidden whitespace-nowrap text-sm font-medium sm:block ' +
                    (state === 'todo' ? 'text-slate-400' : 'text-ink-light dark:text-ink-dark')
                  }
                >
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && <span className="mx-3 h-px w-8 shrink-0 bg-slate-200 dark:bg-slate-700 sm:w-14" />}
            </li>
          );
        })}
      </ol>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="space-y-5">
                <h2 className="text-lg font-semibold text-ink-light dark:text-ink-dark">Applicant Details</h2>
                <Input label="Full Name" required placeholder="As printed on birth certificate" error={errors.fullName?.message} {...register('fullName')} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Date of Birth" type="date" required error={errors.dateOfBirth?.message} max={new Date().toISOString().slice(0, 10)} {...register('dateOfBirth')} />
                  <Select label="Gender" required error={errors.gender?.message} options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]} {...register('gender')} />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="space-y-5">
                <h2 className="text-lg font-semibold text-ink-light dark:text-ink-dark">Contact & Address</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Email" type="email" required error={errors.email?.message} leftIcon={<span>mail</span>} {...register('email')} />
                  <Input label="Mobile" required inputMode="numeric" placeholder="98765 43210" error={errors.phone?.message} leftIcon={<span>smartphone</span>} {...register('phone')} onChange={(e) => { e.target.value = maskPhone(e.target.value); }} />
                </div>
                <Textarea label="Permanent Address" required rows={3} error={errors.address?.message} {...register('address')} />
                <Input label="PIN Code" required inputMode="numeric" placeholder="560001" error={errors.pincode?.message} {...register('pincode')} onChange={(e) => { e.target.value = maskPincode(e.target.value); }} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="space-y-5">
                <h2 className="text-lg font-semibold text-ink-light dark:text-ink-dark">Application Type</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.entries(APPLICATION_TYPE_LABELS) as [ApplicationType, string][]).map(([value, label]) => (
                    <label
                      key={value}
                      className={
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ' +
                        (applicationType === value
                          ? 'border-primary-500 bg-primary-50/60 ring-1 ring-primary-500 dark:bg-primary-600/10'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600')
                      }
                    >
                      <input type="radio" value={value} className="sr-only" {...register('applicationType')} />
                      <span className={'flex h-10 w-10 items-center justify-center rounded-lg ' + (applicationType === value ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800')}>
                        <span className="icon text-[20px]">{value === 'FRESH' ? 'fiber_new' : value === 'RENEWAL' ? 'autorenew' : value === 'RE_ISSUE' ? 'restart_alt' : 'child_care'}</span>
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink-light dark:text-ink-dark">{label}</span>
                        <span className="block text-xs text-slate-500">{formatCurrency(FEE_SCHEDULE[value])} fee</span>
                      </span>
                    </label>
                  ))}
                </div>
                <Select label="Preferred Passport Seva Kendra" required error={errors.placeOfIssue?.message} options={SEVA_CENTERS.map((c) => ({ value: c, label: c }))} {...register('placeOfIssue')} />
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="space-y-6">
                <h2 className="text-lg font-semibold text-ink-light dark:text-ink-dark">Review & Submit</h2>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  {[
                    ['Full Name', getValues('fullName')],
                    ['Date of Birth', getValues('dateOfBirth')],
                    ['Gender', getValues('gender')],
                    ['Email', getValues('email')],
                    ['Mobile', getValues('phone')],
                    ['PIN Code', getValues('pincode')],
                    ['Address', getValues('address')],
                    ['Application Type', APPLICATION_TYPE_LABELS[applicationType]],
                    ['Seva Kendra', getValues('placeOfIssue')],
                  ].map(([k, v]) => (
                    <div key={k} className={k === 'Address' ? 'sm:col-span-2' : ''}>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                      <dd className="mt-1 text-sm text-ink-light dark:text-ink-dark">{v || '—'}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex items-center justify-between rounded-xl bg-primary-50 dark:bg-primary-600/10 p-4">
                  <div className="flex items-center gap-3">
                    <span className="icon text-[22px] text-primary-600 dark:text-primary-300">payments</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Fee payable after submission</span>
                  </div>
                  <span className="text-lg font-bold text-primary-700 dark:text-secondary-400">{formatCurrency(fee)}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  By submitting, you declare the information is true to the best of your knowledge. False information
                  is punishable under the Passports Act, 1967.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-5">
            <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} leftIcon={<span className="icon text-[17px]">arrow_back</span>}>
              Back
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={next} rightIcon={<span className="icon text-[17px]">arrow_forward</span>}>
                Continue
              </Button>
            ) : (
              <Button type="submit" loading={createMutation.isPending} leftIcon={<span className="icon text-[17px]">task_alt</span>}>
                Submit Application
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
