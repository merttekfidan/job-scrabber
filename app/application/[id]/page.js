import { query } from '@/lib/db';
import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import ApplicationDetailClient from '@/components/dashboard/ApplicationDetailClient';

export const dynamic = 'force-dynamic';

export default async function ApplicationDetailPage({ params }) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/');
    }

    const { id } = await params;

    const result = await query('SELECT * FROM applications WHERE id = $1 AND user_id = $2', [id, session.user.id]);
    const app = result.rows[0];

    if (!app) {
        notFound();
    }

    return <ApplicationDetailClient initialApp={app} />;
}
