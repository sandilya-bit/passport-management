import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { APP_NAME } from '@/utils/constants';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

const processSteps = [
  { icon: 'how_to_reg', title: 'Register', desc: 'Create your citizen account with verified email and mobile number.' },
  { icon: 'description', title: 'Apply', desc: 'Fill the passport application with applicant details and application type.' },
  { icon: 'upload_file', title: 'Upload Documents', desc: 'Submit Aadhaar, PAN, or birth certificate proof in the secure vault.' },
  { icon: 'event_available', title: 'Book Appointment', desc: 'Reserve a slot at your nearest Passport Seva Kendra.' },
  { icon: 'payments', title: 'Pay Fee', desc: 'Complete the fee payment by card, UPI, net banking or challan.' },
  { icon: 'fact_check', title: 'Verification', desc: 'Officers verify documents, biometrics and police records.' },
  { icon: 'travel_explore', title: 'Track Status', desc: 'Follow every stage of your application in real time.' },
  { icon: 'card_travel', title: 'Passport Issued', desc: 'Receive your passport and download the digital summary.' },
];

const stats = [
  { icon: 'group', value: '4.2M+', label: 'Applications Processed' },
  { icon: 'schedule', value: '98.4%', label: 'On-time Appointments' },
  { icon: 'verified', value: '38', label: 'Cities Covered' },
  { icon: 'sentiment_satisfied', value: '4.7/5', label: 'Citizen Satisfaction' },
];

export default function LandingPage() {
  const { isDark, toggle } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  // Live statistics from the mock/real stats endpoint.
  const { data: statsData } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: () => import('@/services/statsService').then((m) => m.statsService.admin()),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
              <span className="icon text-[20px]">passport</span>
            </span>
            <span className="text-base font-bold tracking-tight text-ink-light dark:text-ink-dark">PAMS</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex" aria-label="Main">
            <a href="#about" className="hover:text-primary-600 dark:hover:text-secondary-400 transition-colors">About</a>
            <a href="#process" className="hover:text-primary-600 dark:hover:text-secondary-400 transition-colors">Process</a>
            <a href="#stats" className="hover:text-primary-600 dark:hover:text-secondary-400 transition-colors">Statistics</a>
            <a href="#contact" className="hover:text-primary-600 dark:hover:text-secondary-400 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <span className="icon text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard"><Button size="sm">Dashboard</Button></Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block"><Button variant="ghost" size="sm">Sign in</Button></Link>
                <Link to="/register"><Button size="sm">Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(29,155,240,0.12) 0, transparent 40%), radial-gradient(circle at 85% 30%, rgba(15,76,129,0.10) 0, transparent 45%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div {...fadeUp} className="badge-base bg-secondary-50 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300">
                <span className="icon text-[14px]">verified_user</span>
                Government of India · e-Services Initiative
              </motion.div>
              <motion.h1
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.1 }}
                className="mt-5 text-4xl font-extrabold tracking-tight text-ink-light dark:text-ink-dark sm:text-5xl lg:text-6xl leading-[1.1]"
              >
                Your passport, <span className="text-primary-600 dark:text-secondary-400">applied online</span> — tracked at every step.
              </motion.h1>
              <motion.p
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.2 }}
                className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300"
              >
                {APP_NAME} brings the complete passport lifecycle online: apply, upload documents,
                book appointments, pay fees, and track verification — with full transparency.
              </motion.p>
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="mt-8 flex flex-wrap gap-3">
                <Link to="/register">
                  <Button size="lg" leftIcon={<span className="icon text-[19px]">rocket_launch</span>}>
                    Apply for Passport
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" leftIcon={<span className="icon text-[19px]">login</span>}>
                    Sign in to Track
                  </Button>
                </Link>
              </motion.div>
              <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><span className="icon text-[15px] text-success-500">shield</span> 256-bit encrypted</span>
                <span className="flex items-center gap-1.5"><span className="icon text-[15px] text-success-500">lock</span> DigiLocker verified</span>
                <span className="flex items-center gap-1.5"><span className="icon text-[15px] text-success-500">support_agent</span> 24×7 helpdesk</span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="card p-6 shadow-card-hover">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-light dark:text-ink-dark">Application PAS20253042</p>
                  <span className="badge-base bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400">Under Verification</span>
                </div>
                <div className="mt-6 space-y-5">
                  {[
                    { icon: 'check_circle', tone: 'text-success-500', title: 'Application Submitted', desc: '24 Jan 2026 · 09:15 AM' },
                    { icon: 'check_circle', tone: 'text-success-500', title: 'Documents Verified', desc: 'Aadhaar, PAN · 26 Jan 2026' },
                    { icon: 'check_circle', tone: 'text-success-500', title: 'Appointment Completed', desc: 'PSK Central · 02 Feb 2026' },
                    { icon: 'pending', tone: 'text-warning-500', title: 'Police Verification', desc: 'In progress' },
                    { icon: 'radio_button_unchecked', tone: 'text-slate-300 dark:text-slate-600', title: 'Passport Issuance', desc: 'Pending' },
                  ].map((s, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`icon text-[20px] ${s.tone}`}>{s.icon}</span>
                        {i < 4 && <span className="h-6 w-px bg-slate-200 dark:bg-slate-700" />}
                      </div>
                      <div className="-mt-0.5">
                        <p className="text-sm font-medium text-ink-light dark:text-ink-dark">{s.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                className="absolute -left-10 -top-8 card flex items-center gap-3 p-4 shadow-card-hover"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-500 dark:bg-success-500/15">
                  <span className="icon text-[20px]">task_alt</span>
                </span>
                <div>
                  <p className="text-xs font-semibold text-ink-light dark:text-ink-dark">Passport Issued</p>
                  <p className="text-[11px] text-slate-500">M A 4102718 · 10 yr validity</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── About ──────────────────────────────────────────── */}
      <section id="about" className="border-t border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="badge-base bg-primary-50 text-primary-700 dark:bg-primary-600/15 dark:text-primary-300">About the Project</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark">
              One platform for the entire passport journey
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              PAMS digitises the complete passport application lifecycle — replacing queues and paper forms
              with a secure, auditable, role-based online workflow for citizens, verification officers,
              passport officers and administrators.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: 'manage_accounts', title: 'Role-Based Access', desc: 'Dedicated workspaces for applicants, verification officers, passport officers and admins.' },
              { icon: 'folder_shared', title: 'Secure Document Vault', desc: 'Upload and track Aadhaar, PAN, Voter ID, driving licence and birth certificates.' },
              { icon: 'event_available', title: 'Smart Appointments', desc: 'Slot-based booking across Seva Kendras with reschedule and cancellation.' },
              { icon: 'payments', title: 'Digital Payments', desc: 'Card, UPI, net banking and challan with instant receipts.' },
              { icon: 'fact_check', title: 'Transparent Verification', desc: 'Every approval, rejection and remark is recorded with full history.' },
              { icon: 'monitoring', title: 'Real-Time Analytics', desc: 'Administrators monitor throughput, SLAs and system health.' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.07 }}
                className="card group p-6 transition-all hover:shadow-card-hover hover:-translate-y-1"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-transform group-hover:scale-110 dark:bg-primary-600/15 dark:text-primary-300">
                  <span className="icon text-[22px]">{f.icon}</span>
                </span>
                <h3 className="mt-4 font-semibold text-ink-light dark:text-ink-dark">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Process flow ───────────────────────────────────── */}
      <section id="process" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="badge-base bg-secondary-50 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300">Process Flow</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark">
              From registration to issuance in 8 steps
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((s, i) => (
              <motion.div
                key={s.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: (i % 4) * 0.08 }}
                className="card relative p-6 transition-all hover:shadow-card-hover hover:-translate-y-1"
              >
                <span className="absolute right-4 top-4 text-5xl font-extrabold text-slate-100 dark:text-slate-800 select-none">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-50 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-300">
                  <span className="icon text-[22px]">{s.icon}</span>
                </span>
                <h3 className="relative mt-4 font-semibold text-ink-light dark:text-ink-dark">{s.title}</h3>
                <p className="relative mt-1.5 text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Statistics ─────────────────────────────────────── */}
      <section id="stats" className="relative overflow-hidden bg-primary-600 py-20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(29,155,240,0.6) 0, transparent 45%)' }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">Trusted at national scale</h2>
            <p className="mt-3 text-primary-100">Live figures from the platform registry.</p>
          </motion.div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: 'group', value: statsData ? statsData.applicantCount.toLocaleString('en-IN') : '—', label: 'Registered Applicants' },
              { icon: 'description', value: statsData ? statsData.applicationCount.toLocaleString('en-IN') : '—', label: 'Applications' },
              { icon: 'folder_shared', value: statsData ? statsData.documentCount.toLocaleString('en-IN') : '—', label: 'Documents Stored' },
              { icon: 'card_travel', value: statsData ? statsData.passportCount.toLocaleString('en-IN') : '—', label: 'Passports Issued' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur"
              >
                <span className="icon text-[30px] text-secondary-300">{s.icon}</span>
                <p className="mt-3 text-3xl font-extrabold text-white tabular-nums">{s.value}</p>
                <p className="mt-1 text-sm text-primary-100">{s.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-white/90">
            {stats.slice(0, 4).map((s) => (
              <div key={s.label} className="flex items-center gap-3 text-sm">
                <span className="icon text-[20px] text-secondary-300">{s.icon}</span>
                <span><b className="text-white">{s.value}</b> {s.label.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact ────────────────────────────────────────── */}
      <section id="contact" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <p className="badge-base bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400">Contact</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark">
                Need help with an application?
              </h2>
              <p className="mt-4 max-w-md text-slate-600 dark:text-slate-300">
                Our national helpdesk answers queries on applications, appointments, fees and documents
                around the clock.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: 'call', title: 'Toll-free Helpline', desc: '1800-258-1800 (24×7)' },
                  { icon: 'mail', title: 'Email Support', desc: 'support@pams.gov.in' },
                  { icon: 'location_on', title: 'Head Office', desc: 'Patiala House Annexe, Tilak Marg, New Delhi – 110001' },
                ].map((c) => (
                  <div key={c.title} className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-600/15 dark:text-primary-300">
                      <span className="icon text-[20px]">{c.icon}</span>
                    </span>
                    <div>
                      <p className="font-semibold text-ink-light dark:text-ink-dark">{c.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
              <form
                className="card p-6 sm:p-8"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast({ tone: 'success', title: 'Message sent', message: 'Our helpdesk will reply within one working day.' });
                  setContactForm({ name: '', email: '', message: '' });
                }}
              >
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    name="name"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    leftIcon={<span>person</span>}
                    placeholder="Your name"
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                    leftIcon={<span>mail</span>}
                    placeholder="you@example.com"
                  />
                  <Textarea
                    label="Message"
                    name="message"
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="How can we help?"
                  />
                  <Button type="submit" className="w-full" leftIcon={<span className="icon text-[17px]">send</span>}>
                    Send Message
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CTA + Footer ───────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                  <span className="icon text-[20px]">passport</span>
                </span>
                <span className="font-bold text-ink-light dark:text-ink-dark">{APP_NAME}</span>
              </div>
              <p className="mt-4 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                A unified digital gateway for passport applications — built for citizens, powered by
                secure government infrastructure.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-light dark:text-ink-dark">Quick Links</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#about" className="hover:text-primary-600 dark:hover:text-secondary-400">About</a></li>
                <li><a href="#process" className="hover:text-primary-600 dark:hover:text-secondary-400">Application Process</a></li>
                <li><a href="#stats" className="hover:text-primary-600 dark:hover:text-secondary-400">Statistics</a></li>
                <li><Link to="/login" className="hover:text-primary-600 dark:hover:text-secondary-400">Track Application</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-light dark:text-ink-dark">Legal</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                <li><span className="hover:text-primary-600 dark:hover:text-secondary-400 cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-primary-600 dark:hover:text-secondary-400 cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-primary-600 dark:hover:text-secondary-400 cursor-pointer">Accessibility</span></li>
                <li><span className="hover:text-primary-600 dark:hover:text-secondary-400 cursor-pointer">RTI Disclosure</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 pt-6 sm:flex-row">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} Ministry of External Affairs. All rights reserved.</p>
            <div className="flex gap-2">
              {['public', 'facebook', 'youtube'].map((icon) => (
                <span key={icon} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:bg-slate-800 dark:hover:bg-primary-600/20" aria-hidden>
                  <span className="icon text-[18px]">{icon}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
