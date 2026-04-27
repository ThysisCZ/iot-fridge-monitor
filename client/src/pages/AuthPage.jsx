import { Link } from "react-router";
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
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            IoT Fridge Monitoring
          </p>

          <CardTitle className="text-3xl font-bold">
            Hello!
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Login or create an account to monitor your fridges.
          </p>
        </CardHeader>

        <CardContent>
            <Tabs defaultValue="login" className="w-full flex flex-col">
                <TabsList className="mb-6 grid h-11 w-full grid-cols-2 rounded-xl bg-muted p-1">
                    <TabsTrigger
                        value="login"
                        className="
                            rounded-lg
                            data-[state=active]:bg-background
                            data-[state=active]:shadow-sm
                            data-[state=active]:text-foreground
                            text-muted-foreground
                            "
                    >
                        Login
                    </TabsTrigger>

                    <TabsTrigger
                        value="register"
                        className="
                            rounded-lg
                            data-[state=active]:bg-background
                            data-[state=active]:shadow-sm
                            data-[state=active]:text-foreground
                            text-muted-foreground
                            "
                    >
                        Register
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="john@example.com" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" />
                </div>

                <Button className="w-full">Login</Button>
                </TabsContent>

                <TabsContent value="register" className="mt-0 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="register-name">Name</Label>
                    <Input id="register-name" placeholder="John Doe" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder="john@example.com" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input id="register-password" type="password" placeholder="••••••••" />
                </div>

                <Button className="w-full">Create account</Button>
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