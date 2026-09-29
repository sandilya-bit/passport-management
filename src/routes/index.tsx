import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useAuthStore } from '@/store/authStore';
import { PageTransition } from '@/components/PageTransition';
import { FullPageLoader } from '@/components/ui/Loader';
import type { Role } from '@/types';

// ─── Code-split pages ────────────────────────────────────────────────────────

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ProfilePage = lazy(() => import('@/pages/dashboard/ProfilePage'));

const ApplicantsPage = lazy(() => import('@/pages/applicants/ApplicantsPage'));

const ApplicationsPage = lazy(() => import('@/pages/applications/ApplicationsPage'));
const NewApplicationPage = lazy(() => import('@/pages/applications/NewApplicationPage'));
const ApplicationDetailPage = lazy(() => import('@/pages/applications/ApplicationDetailPage'));

const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage'));

const AppointmentsPage = lazy(() => import('@/pages/appointments/AppointmentsPage'));

const PaymentsPage = lazy(() => import('@/pages/payments/PaymentsPage'));

const VerificationPage = lazy(() => import('@/pages/verification/VerificationPage'));

const PassportsPage = lazy(() => import('@/pages/passports/PassportsPage'));

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));

const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// ─── Guards ──────────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated, hasRestored } = useAuthStore();
  const location = useLocation();
  if (!hasRestored) return <FullPageLoader label="Restoring session…" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function RequireRole({ roles, children }: { roles: Role[]; children: JSX.Element }) {
  const user = useAuthStore((s) => s.user);
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function PublicOnly({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRestored = useAuthStore((s) => s.hasRestored);
  if (!hasRestored) return <FullPageLoader label="Restoring session…" />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Lazy suspense wrapper ───────────────────────────────────────────────────

function Suspensed({ children }: { children: JSX.Element }) {
  return <Suspense fallback={<FullPageLoader />}>{children}</Suspense>;
}

export default function AppRoutes() {
  const location = useLocation();
  return (
    <PageTransition key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Suspensed><LandingPage /></Suspensed>} />

        <Route
          path="/login"
          element={<PublicOnly><Suspensed><LoginPage /></Suspensed></PublicOnly>}
        />
        <Route
          path="/register"
          element={<PublicOnly><Suspensed><RegisterPage /></Suspensed></PublicOnly>}
        />
        <Route
          path="/forgot-password"
          element={<PublicOnly><Suspensed><ForgotPasswordPage /></Suspensed></PublicOnly>}
        />
        <Route
          path="/reset-password"
          element={<PublicOnly><Suspensed><ResetPasswordPage /></Suspensed></PublicOnly>}
        />

        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Suspensed><DashboardPage /></Suspensed>} />
          <Route path="/profile" element={<Suspensed><ProfilePage /></Suspensed>} />

          <Route path="/applications" element={<Suspensed><ApplicationsPage /></Suspensed>} />
          <Route
            path="/applications/new"
            element={
              <RequireRole roles={['APPLICANT']}>
                <Suspensed><NewApplicationPage /></Suspensed>
              </RequireRole>
            }
          />
          <Route path="/applications/:id" element={<Suspensed><ApplicationDetailPage /></Suspensed>} />

          <Route path="/documents" element={<Suspensed><DocumentsPage /></Suspensed>} />
          <Route path="/appointments" element={<Suspensed><AppointmentsPage /></Suspensed>} />
          <Route path="/payments" element={<Suspensed><PaymentsPage /></Suspensed>} />

          <Route
            path="/applicants"
            element={
              <RequireRole roles={['ADMIN', 'PASSPORT_OFFICER', 'VERIFICATION_OFFICER']}>
                <Suspensed><ApplicantsPage /></Suspensed>
              </RequireRole>
            }
          />

          <Route
            path="/verification"
            element={
              <RequireRole roles={['ADMIN', 'VERIFICATION_OFFICER', 'PASSPORT_OFFICER']}>
                <Suspensed><VerificationPage /></Suspensed>
              </RequireRole>
            }
          />

          <Route
            path="/passports"
            element={
              <RequireRole roles={['ADMIN', 'PASSPORT_OFFICER']}>
                <Suspensed><PassportsPage /></Suspensed>
              </RequireRole>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireRole roles={['ADMIN']}>
                <Suspensed><AdminDashboardPage /></Suspensed>
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<Suspensed><NotFoundPage /></Suspensed>} />
      </Routes>
    </PageTransition>
  );
}
