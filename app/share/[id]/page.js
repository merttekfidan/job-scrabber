
import { query } from '@/lib/db';
import { notFound } from 'next/navigation';
import ApplicationDetailClient from '@/components/dashboard/ApplicationDetailClient';

export const dynamic = 'force-dynamic';

async function getApplication(id) {
    const result = await query('SELECT * FROM applications WHERE id = $1', [id]);
    return result.rows[0];
}

export default async function SharePage({ params }) {
    const { id } = await params;
    const app = await getApplication(id);

    if (!app) {
        notFound();
    }

    return <ApplicationDetailClient initialApp={app} isShared={true} />;
}
