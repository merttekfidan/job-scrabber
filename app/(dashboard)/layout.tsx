import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Dashboard route group: all routes under (dashboard) require auth.
 * Redirects to /login if not authenticated.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  return <>{children}</>;
}
