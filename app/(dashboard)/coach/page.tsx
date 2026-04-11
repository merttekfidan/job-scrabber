import { auth } from '@/auth';
import DashboardClient from '@/components/DashboardClient';

export const metadata = {
  title: 'Coach — HuntIQ',
  description: 'CV upload and AI prep',
};

export default async function CoachPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return <DashboardClient session={session} />;
}
