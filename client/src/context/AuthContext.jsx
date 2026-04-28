import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfile, loginUser, registerUser } from "@/api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const login = async (dtoIn) => {
    const result = await loginUser(dtoIn);

    localStorage.setItem("token", result.token);
    setUser({
      id: result.id,
      name: result.name,
      email: result.email,
    });

    return result;
  };

  const register = async (dtoIn) => {
    const result = await registerUser(dtoIn);

    localStorage.setItem("token", result.token);
    setUser({
      id: result.id,
      name: result.name,
      email: result.email,
    });

    return result;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile();
        setUser(profile);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAuthLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}