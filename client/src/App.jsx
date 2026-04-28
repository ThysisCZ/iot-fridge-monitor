import { Routes, Route } from "react-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import FridgesPage from "./pages/FridgesPage";
import FridgeDetailPage from "./pages/FridgeDetailPage";
import ProtectedRoute from "@/components/ProtectedRoute";

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      {user && <Header />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/fridges"
          element={
            <ProtectedRoute>
              <FridgesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fridges/:id"
          element={
            <ProtectedRoute>
              <FridgeDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
