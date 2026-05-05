import { Routes, Route } from "react-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import FridgesPage from "./pages/FridgesPage";
import FridgeDetailPage from "./pages/FridgeDetailPage";
import FridgeRulesPage from "./pages/FridgeRulesPage";
import GatewaysPage from "./pages/GatewaysPage";
import UserPage from "./pages/UserPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";


function AppContent() {
  const { user } = useAuth();

  return (
    <>
      {user && <Header />}
      <ScrollToTop />

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

        <Route
          path="/fridges/:id/rules"
          element={
            <ProtectedRoute>
              <FridgeRulesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gateways"
          element={
            <ProtectedRoute>
              <GatewaysPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserPage />
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
