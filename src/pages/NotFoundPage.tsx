import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-light p-6 text-center dark:bg-surface-dark">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <p className="text-[120px] font-extrabold leading-none tracking-tight text-primary-600 dark:text-secondary-400 opacity-20 select-none">404</p>
      </motion.div>
      <h1 className="mt-2 text-2xl font-bold text-ink-light dark:text-ink-dark">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        The page you are looking for doesn't exist, was moved, or you don't have access to it.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/"><Button variant="outline">Go to Homepage</Button></Link>
        <Link to="/dashboard"><Button>Open Dashboard</Button></Link>
      </div>
    </div>
  );
}
