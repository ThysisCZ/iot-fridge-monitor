import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { MoreVertical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GaugeChart } from "@/components/GaugeChart";
import { listFridges, createFridge, listRules } from "@/api/fridgeApi";

const formatTime = (ts) => {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const gaugeConfig = (rules, sensorType) => {
  const rule = rules.find((r) => r.sensorType === sensorType && r.isActive);
  if (!rule)
    return sensorType === "temperature"
      ? { min: 0, max: 8, ticks: [] }
      : { min: 0, max: 80, ticks: [] };
  const range = rule.maxThreshold - rule.minThreshold;
  const padding = range * 0.5;
  return {
    min: Math.max(0, Math.round((rule.minThreshold - padding) * 10) / 10),
    max: Math.round((rule.maxThreshold + padding) * 10) / 10,
    ticks: [rule.minThreshold, rule.maxThreshold],
  };
};

const isAlert = (value, rules, sensorType) => {
  if (!Number.isFinite(value)) return false;
  const rule = rules.find((r) => r.sensorType === sensorType && r.isActive);
  if (!rule) return false;
  return value < rule.minThreshold || value > rule.maxThreshold;
};

function RoleBadge({ isOwner }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${isOwner ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-600"}`}
    >
      {isOwner ? "Owner" : "Member"}
    </span>
  );
}

function FridgesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fridges, setFridges] = useState([]);
  const [fridgeData, setFridgeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const loadFridgeData = useCallback(async (list) => {
    const results = await Promise.allSettled(
      list.map(async (f) => {
        const [meas, rules] = await Promise.allSettled([listRules(f.id)]);
        return {
          id: f.id,
          measurement: meas.status === "fulfilled" ? meas.value : null,
          rules:
            rules.status === "fulfilled" && Array.isArray(rules.value?.itemList)
              ? rules.value.itemList
              : [],
        };
      }),
    );
    const map = {};
    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value) map[r.value.id] = r.value;
    });
    setFridgeData(map);
  }, []);

  useEffect(() => {
    listFridges()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setFridges(list);
        setLoading(false);
        loadFridgeData(list);
      })
      .catch(() => setLoading(false));
  }, [loadFridgeData]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setFormError("Fridge name is required.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const created = await createFridge({
        name: form.name.trim(),
        description: form.description.trim(),
      });
      setFridges((prev) => [...prev, created]);
      setShowModal(false);
      setForm({ name: "", description: "" });
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold">Fridges</h1>

        {fridges.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-muted-foreground">No fridges</p>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-full bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Add Fridge
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {fridges.map((fridge) => {
              const { measurement, rules } = fridgeData[fridge.id] || {
                measurement: null,
                rules: [],
              };
              const tempCfg = gaugeConfig(rules, "temperature");
              const humidCfg = gaugeConfig(rules, "humidity");
              const tempVal =
                measurement?.temperature != null
                  ? Number(measurement.temperature)
                  : undefined;
              const humidVal =
                measurement?.humidity != null
                  ? Number(measurement.humidity)
                  : undefined;
              const isOwner = String(fridge.ownerId) === String(user?.id);

              return (
                <Card
                  key={fridge.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => navigate(`/fridges/${fridge.id}`)}
                >
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{fridge.name}</span>
                        <RoleBadge isOwner={isOwner} />
                      </div>
                      <button
                        className="rounded p-1 hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Last update:{" "}
                      {measurement
                        ? formatTime(
                            measurement.timestamp || measurement.createdAt,
                          )
                        : "no data"}
                    </p>
                    <div className="mt-2 flex justify-around">
                      <GaugeChart
                        value={tempVal}
                        min={tempCfg.min}
                        max={tempCfg.max}
                        unit="°C"
                        label="Temperature"
                        ticks={tempCfg.ticks}
                        isAlert={isAlert(tempVal, rules, "temperature")}
                      />
                      <GaugeChart
                        value={humidVal}
                        min={humidCfg.min}
                        max={humidCfg.max}
                        unit="%"
                        label="Humidity"
                        ticks={humidCfg.ticks}
                        isAlert={isAlert(humidVal, rules, "humidity")}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <button
              onClick={() => setShowModal(true)}
              className="mx-auto mt-2 rounded-full bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Add Fridge
            </button>
          </div>
        )}

        <div className="mt-10">
          <p className="mb-2 text-center text-xs text-muted-foreground">
            MOCK DATA
          </p>
          <div className="flex justify-around rounded-xl border bg-card p-3">
            <GaugeChart
              value={3.1}
              min={1}
              max={5}
              unit="°C"
              label="Normal"
              ticks={[2, 4]}
              isAlert={false}
              className="w-42"
            />
            <GaugeChart
              value={4.8}
              min={1}
              max={5}
              unit="°C"
              label="Alert"
              ticks={[2, 4]}
              isAlert={true}
              className="w-42"
            />
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setShowModal(false);
            setFormError("");
          }}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 text-xl font-bold">Add Fridge</h2>
            <div className="mb-3">
              <label className="mb-1 block text-sm">Fridge name:</label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="..."
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm">Description:</label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="..."
              />
            </div>
            {formError && (
              <p className="mb-3 text-sm text-red-500">{formError}</p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowModal(false);
                  setFormError("");
                }}
              >
                Cancel
              </Button>
              <button
                onClick={handleCreate}
                disabled={formLoading}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {formLoading ? "Creating…" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default FridgesPage;
