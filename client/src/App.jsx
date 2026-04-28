import { Routes, Route } from "react-router";
import { AuthProvider } from "@/context/AuthContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import FridgesPage from "./pages/FridgesPage";
import FridgeDetailPage from "./pages/FridgeDetailPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;