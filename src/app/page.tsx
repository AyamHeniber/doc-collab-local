import { auth } from '@/auth';
import Workspace from '@/components/editor/workspace';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  const user = {
    id: session.user.id || '',
    name: session.user.name || 'Sandbox User',
    email: session.user.email || 'sandbox@example.com',
    role: (session.user as any).role || 'viewer',
  };

  return <Workspace user={user} />;
}
export const dynamic = 'force-dynamic';
