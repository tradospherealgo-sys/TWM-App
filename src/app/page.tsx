import { redirect } from 'next/navigation';
import { getCurrentUser, getRoleDashboardPath } from '@/lib/auth';

export default async function IndexPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?reason=session_expired');
  }

  const destination = getRoleDashboardPath(user.role);
  redirect(destination);
}
