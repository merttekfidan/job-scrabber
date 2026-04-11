import { auth } from '@/auth';
import DashboardClient from '@/components/DashboardClient';

export const metadata = {
  title: 'Kanban Board — HuntIQ',
  description: 'Application pipeline view',
};

export default async function KanbanPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return <DashboardClient session={session} />;
}
