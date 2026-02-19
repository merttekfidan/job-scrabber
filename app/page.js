import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Dashboard from '@/components/Dashboard';

export const metadata = {
  title: 'Job Tracker',
  description: 'AI-Powered Job Application Tracking',
};

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <Dashboard session={session} />;
}
