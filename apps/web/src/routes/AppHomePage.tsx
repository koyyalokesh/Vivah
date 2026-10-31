import { useAuth } from '../auth/useAuth';
import { AppShell } from '../components/app-shell/AppShell';
import { DashboardPage } from './DashboardPage';
import { WeddingSetupPage } from './WeddingSetupPage';

export function AppHomePage() {
  const { membership, wedding } = useAuth();

  if (!wedding || !membership) return <WeddingSetupPage />;

  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}
