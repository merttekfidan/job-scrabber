import { auth } from '@/auth';
import DashboardClient from '@/components/DashboardClient';

export const metadata = {
  title: 'Dashboard — HuntIQ',
  description: 'Job application stats and list',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return <DashboardClient session={session} forceView="dashboard" />;
}
