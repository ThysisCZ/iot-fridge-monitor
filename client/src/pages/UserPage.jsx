import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "@/context/AuthContext";
import { listFridges } from "@/api/fridgeApi";
import { listGateways, listGatewayMonitors } from "@/api/gatewayApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function getArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.fridges)) return data.fridges;
  if (Array.isArray(data?.gateways)) return data.gateways;
  if (Array.isArray(data?.monitors)) return data.monitors;

  return [];
}

function isUserOwner(fridge, userId) {
  return String(fridge.ownerId) === String(userId);
}

function isUserMember(fridge, userId) {
  const memberIds = fridge.memberIds || [];

  return memberIds.some((memberId) => String(memberId) === String(userId));
}

function StatCard({ label, value }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "Not available"}</p>
    </div>
  );
}

function UserPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [fridges, setFridges] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [monitorCount, setMonitorCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        setLoading(true);
        setError("");

        const [fridgesRes, gatewaysRes] = await Promise.all([
          listFridges(),
          listGateways(),
        ]);

        const loadedFridges = getArray(fridgesRes);
        const loadedGateways = getArray(gatewaysRes);

        setFridges(loadedFridges);
        setGateways(loadedGateways);

        const monitorResults = await Promise.allSettled(
          loadedGateways.map((gateway) =>
            listGatewayMonitors(gateway.id),
          ),
        );

        const totalMonitors = monitorResults.reduce((total, result) => {
          if (result.status !== "fulfilled") return total;

          return total + getArray(result.value).length;
        }, 0);

        setMonitorCount(totalMonitors);
      } catch (e) {
        console.error(e);
        setError("Failed to load user statistics.");
      } finally {
        setLoading(false);
      }
    };

    loadUserStats();
  }, []);

  const fridgeStats = useMemo(() => {
    const userId = user?.id;

    if (!userId) {
      return {
        ownerCount: 0,
        memberCount: 0,
      };
    }

    return {
      ownerCount: fridges.filter((fridge) => isUserOwner(fridge, userId)).length,
      memberCount: fridges.filter((fridge) =>
        isUserMember(fridge, userId),
      ).length,
    };
  }, [fridges, user]);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      navigate("/");
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">User profile</h1>
        <p className="text-sm text-muted-foreground">
          Basic information about your account and connected devices.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold">Account info</h2>

            <InfoRow label="Name" value={user?.name} />
            <InfoRow label="Email" value={user?.email} />
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Owned fridges"
            value={loading ? "..." : fridgeStats.ownerCount}
          />

          <StatCard
            label="Member fridges"
            value={loading ? "..." : fridgeStats.memberCount}
          />

          <StatCard
            label="Gateways"
            value={loading ? "..." : gateways.length}
          />

          <StatCard
            label="Monitors"
            value={loading ? "..." : monitorCount}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          variant="secondary"
          onClick={handleLogout}
          disabled={logoutLoading}
          className="w-full sm:w-auto"
        >
          {logoutLoading ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </main>
  );
}

export default UserPage;