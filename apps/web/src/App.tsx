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
import { AppShell } from './components/app-shell/AppShell';
import { EventsPage } from './routes/EventsPage';
import { EventFormPage } from './routes/EventFormPage';
import { EventDetailsPage } from './routes/EventDetailsPage';
import { TasksPage } from './routes/TasksPage';
import { TaskFormPage } from './routes/TaskFormPage';
import { TaskDetailsPage } from './routes/TaskDetailsPage';

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
          {
            path: '/app/wedding/edit',
            element: (
              <AppShell>
                <WeddingEditPage />
              </AppShell>
            ),
          },
          {
            path: '/app/members',
            element: (
              <AppShell>
                <MembersPage />
              </AppShell>
            ),
          },
          {
            path: '/app/events',
            element: (
              <AppShell>
                <EventsPage />
              </AppShell>
            ),
          },
          {
            path: '/app/events/new',
            element: (
              <AppShell>
                <EventFormPage />
              </AppShell>
            ),
          },
          {
            path: '/app/events/:eventId',
            element: (
              <AppShell>
                <EventDetailsPage />
              </AppShell>
            ),
          },
          {
            path: '/app/events/:eventId/edit',
            element: (
              <AppShell>
                <EventFormPage />
              </AppShell>
            ),
          },
          {
            path: '/app/tasks',
            element: (
              <AppShell>
                <TasksPage />
              </AppShell>
            ),
          },
          {
            path: '/app/tasks/new',
            element: (
              <AppShell>
                <TaskFormPage />
              </AppShell>
            ),
          },
          {
            path: '/app/tasks/:taskId',
            element: (
              <AppShell>
                <TaskDetailsPage />
              </AppShell>
            ),
          },
          {
            path: '/app/tasks/:taskId/edit',
            element: (
              <AppShell>
                <TaskFormPage />
              </AppShell>
            ),
          },
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
