import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // Redirect to dashboard if authenticated, otherwise to login
  // This will be handled by middleware once authentication is implemented
  redirect('/admin/login');
}