import { AuthProvider } from '@/components/AuthProvider';

/** Every page except the ad landing pages: sign-in state for the header, dashboard and admin. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
