import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Navigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

function LandingPage() {
  const { isAuthenticated, isAuthLoading } = useAuth();

    if (isAuthLoading) {
        return null;
    }

    if (isAuthenticated) {
        return <Navigate to="/fridges" replace />;
    }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6">
        <div className="space-y-6 text-center md:text-left">
            <p className="text-sm font-medium text-muted-foreground">
                IoT Fridge Monitoring
            </p>

            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Monitor your fridges in real time.
            </h1>

            <p className="max-w-xl text-lg text-muted-foreground">
                Track temperature, humidity and light values from IoT sensors.
                Get a clear overview of fridge conditions and react quickly when
                something goes wrong.
            </p>

            <div className="flex justify-center md:justify-start">
                <Button asChild size="lg">
                <Link to="/auth">Login / Register</Link>
                </Button>
            </div>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;