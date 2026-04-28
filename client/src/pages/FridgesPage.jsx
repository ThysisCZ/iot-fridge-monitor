import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

function FridgesPage() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold">Fridges</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user?.name}
            </p>
          </div>

          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </header>

        <section className="py-10">
          <p className="text-muted-foreground">
            Dashboard page is ready. Fridge tiles will be added here.
          </p>
        </section>
      </div>
    </main>
  );
}

export default FridgesPage;