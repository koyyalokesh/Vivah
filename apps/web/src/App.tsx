import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { PublicOnlyRoute } from './auth/PublicOnlyRoute';
import { HomePage } from './routes/HomePage';
import { AppHomePage } from './routes/AppHomePage';
import { LoginPage } from './routes/LoginPage';
import { PlaceholderPage } from './routes/PlaceholderPage';
import { SignupPage } from './routes/SignupPage';
import { WeddingEditPage } from './routes/WeddingEditPage';
import { MembersPage } from './routes/MembersPage';
import { MemberInvitationPage } from './routes/MemberInvitationPage';
import { ThemeProvider } from './theme/ThemeProvider';

function AppProviders() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </ThemeProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <AppProviders />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        path: '/member-invitations/:token',
        element: <MemberInvitationPage />,
      },
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/app', element: <AppHomePage /> },
          { path: '/app/wedding/edit', element: <WeddingEditPage /> },
          { path: '/app/members', element: <MembersPage /> },
        ],
      },
      {
        path: '*',
        element: (
          <PlaceholderPage
            eyebrow="Page not found"
            title="This page is not available"
            description="Return to the Vivah homepage to continue exploring."
          />
        ),
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
