import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './routes/HomePage';
import { PlaceholderPage } from './routes/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <PlaceholderPage
              eyebrow="Welcome back"
              title="Log in to Vivah"
              description="The secure login experience will be available in the next development milestone."
            />
          }
        />
        <Route
          path="/signup"
          element={
            <PlaceholderPage
              eyebrow="Start planning"
              title="Create your Vivah workspace"
              description="Account creation will be available in the next development milestone."
            />
          }
        />
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
    </BrowserRouter>
  );
}
