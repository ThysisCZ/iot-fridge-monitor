import { Link, useNavigate, Navigate } from "react-router";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

/* UI */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";



function AuthPage() {
    const navigate = useNavigate();
    const { login, register, isAuthenticated, isAuthLoading } = useAuth();

    const [loginServerError, setLoginServerError] = useState("");
    const [registerServerError, setRegisterServerError] = useState("");
    const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
    const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    });
    const [registerData, setRegisterData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [loginErrors, setLoginErrors] = useState({});
    const [registerErrors, setRegisterErrors] = useState({});

    if (isAuthLoading) return null;

    if (isAuthenticated) {
        return <Navigate to="/fridges" replace />;
    }

    const isEmailValid = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateField = (fieldName, value) => {
        if (fieldName === "name") {
        if (!value.trim()) return "Name is required.";
        if (value.length > 20) return "Name can have maximum 20 characters.";
        }

        if (fieldName === "email") {
        if (!value.trim()) return "Email is required.";
        if (!isEmailValid(value)) return "Email must be in a valid format.";
        }

        if (fieldName === "password") {
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must have at least 8 characters.";
        }

        return "";
    };

    const handleLoginChange = (event) => {
        const { name, value } = event.target;

        setLoginData((prev) => ({
        ...prev,
        [name]: value,
        }));
        if (name === "password") {
          setLoginErrors((prev) => ({
           ...prev,
           [name]: validateField(name, value),
          }));
        }
    };

    const handleValidateLogin = (event) => {
      const { name, value } = event.target;

      setLoginErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }


    const handleRegisterChange = (event) => {
        const { name, value } = event.target;

        setRegisterData((prev) => ({
        ...prev,
        [name]: value,
        }));

        if (name === "password"){
          setRegisterErrors((prev) => ({
            ...prev,
            [name]: validateField(name, value),
          }));
        }
    };

    const handleValidateRegister = (event) => {
      const { name, value } = event.target;

      setRegisterErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }

    const validateLogin = () => {
        const errors = {
        email: validateField("email", loginData.email),
        password: validateField("password", loginData.password),
        };

        return Object.fromEntries(
        Object.entries(errors).filter(([, message]) => message)
        );
    };

    const validateRegister = () => {
        const errors = {
        name: validateField("name", registerData.name),
        email: validateField("email", registerData.email),
        password: validateField("password", registerData.password),
        };

        return Object.fromEntries(
        Object.entries(errors).filter(([, message]) => message)
        );
    };

    const handleLoginSubmit = async (event) => {
        event.preventDefault();

        const errors = validateLogin();
        setLoginErrors(errors);
        setLoginServerError("");

        if (Object.keys(errors).length > 0) return;

        try {
            setIsLoginSubmitting(true);
            await login(loginData);
            navigate("/fridges", { replace: true });
        } catch (error) {
            setLoginServerError(error.message);
        } finally {
            setIsLoginSubmitting(false);
        }
    };

    const handleRegisterSubmit = async (event) => {
        event.preventDefault();

        const errors = validateRegister();
        setRegisterErrors(errors);
        setRegisterServerError("");

        if (Object.keys(errors).length > 0) return;

        try {
            setIsRegisterSubmitting(true);
            await register(registerData);
            navigate("/fridges", { replace: true });
        } catch (error) {
            setRegisterServerError(error.message);
        } finally {
            setIsRegisterSubmitting(false);
        }
    };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            IoT Fridge Monitoring
          </p>

          <CardTitle className="text-3xl font-bold">Hello!</CardTitle>

          <p className="text-sm text-muted-foreground">
            Login or create an account to monitor your fridges.
          </p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full flex flex-col">
            <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-xl bg-muted p-1">
              <TabsTrigger
                value="login"
                className="rounded-lg text-muted-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
              >
                Login
              </TabsTrigger>

              <TabsTrigger
                value="register"
                className="rounded-lg text-muted-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
              >
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    onBlur={handleValidateLogin}
                  />
                  {loginErrors.email && (
                    <p className="text-sm text-red-500">
                      {loginErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={handleLoginChange}
                  />
                  {loginErrors.password && (
                    <p className="text-sm text-red-500">
                      {loginErrors.password}
                    </p>
                  )}
                </div>

                {loginServerError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {loginServerError}
                    </div>
                )}

                <Button type="submit" className="w-full mt-2 rounded-full bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700" disabled={isLoginSubmitting}>
                    {isLoginSubmitting ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Name</Label>
                  <Input
                    id="register-name"
                    name="name"
                    placeholder="John"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    onBlur={handleValidateRegister}
                  />
                  {registerErrors.name && (
                    <p className="text-sm text-red-500">
                      {registerErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    onBlur={handleValidateRegister}
                  />
                  {registerErrors.email && (
                    <p className="text-sm text-red-500">
                      {registerErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                  />
                  {registerErrors.password && (
                    <p className="text-sm text-red-500">
                      {registerErrors.password}
                    </p>
                  )}
                </div>
                {registerServerError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                        {registerServerError}
                    </div>
                )}

                <Button type="submit" className="w-full mt-2 rounded-full bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700" disabled={isRegisterSubmitting}>
                    {isRegisterSubmitting ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button asChild variant="link">
              <Link to="/">Back to landing page</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default AuthPage;