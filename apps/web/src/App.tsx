import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { PublicOnlyRoute } from './auth/PublicOnlyRoute';
import { HomePage } from './routes/HomePage';
import { AppHomePage } from './routes/AppHomePage';
import { LoginPage } from './routes/LoginPage';
import { PlaceholderPage } from './routes/PlaceholderPage';
import { SignupPage } from './routes/SignupPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppHomePage />} />
          </Route>
          <Route
            path="*"
            element={
              <PlaceholderPage
                eyebrow="Page not found"
                title="This page is not available"
                description="Return to the Vivah homepage to continue exploring."
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
