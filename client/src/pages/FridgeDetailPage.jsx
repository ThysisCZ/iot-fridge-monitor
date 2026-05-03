import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GaugeChart } from "@/components/GaugeChart";
import { SensorLineChart } from "@/components/SensorLineChart";
import {
  getFridge,
  listRules,
  listMeasurements,
  updateFridge,
  deleteFridge,
  listFridgeMembers,
  inviteMember,
  removeMember,
  createRule,
  updateRule,
} from "@/api/fridgeApi";
import {
  getMonitor,
  addMonitorToFridge,
  removeMonitorFromFridge,
} from "@/api/monitorApi";
import { listGateways, listGatewayMonitors } from "@/api/gatewayApi";

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

const rangeToParams = (range) => {
  const now = new Date();
  switch (range) {
    case "24h":
      return {
        startDate: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString(),
        granularity: 60,
      };
    case "30d":
      return {
        startDate: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString(),
        granularity: 1440,
      };
    default:
      return {
        startDate: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString(),
        granularity: 1440,
      };
  }
};

const formatLabel = (ts, range) => {
  const d = new Date(ts);
  if (range === "24h") return `${d.getHours().toString().padStart(2, "0")}:00`;
  if (range === "30d") return `${d.getMonth() + 1}/${d.getDate()}`;
  return d.toLocaleDateString("en-US", { weekday: "short" });
};

const toChartData = (itemList, sensorType, range) =>
  itemList.map((m) => ({
    label: formatLabel(m.timestamp, range),
    value: m[sensorType] != null ? Number(m[sensorType]) : null,
  }));

const THRESHOLD_UNITS = {
  temperature: "°C",
  humidity: "%",
  illuminance: "lux",
};
const THRESHOLD_LABELS = {
  temperature: "Temperature",
  humidity: "Humidity",
  illuminance: "Illuminance",
};

const buildThresholdForm = (sensorType, rule) =>
  rule
    ? {
        ruleId: rule.id,
        name: rule.name,
        min: String(rule.minThreshold),
        max: String(rule.maxThreshold),
        duration: String(rule.durationThreshold),
        isActive: rule.isActive,
      }
    : {
        ruleId: null,
        name: THRESHOLD_LABELS[sensorType] ?? sensorType,
        min: "",
        max: "",
        duration: "0",
        isActive: true,
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

function FridgeDetailPage() {
  const { id: fridgeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fridge, setFridge] = useState(null);
  const [measurement, setMeasurement] = useState(null);
  const [rules, setRules] = useState([]);
  const [monitor, setMonitor] = useState(null);
  const [tempHistory, setTempHistory] = useState([]);
  const [humidHistory, setHumidHistory] = useState([]);
  const [tempRange, setTempRange] = useState("7d");
  const [humidRange, setHumidRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  const [openMenu, setOpenMenu] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    description: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [thresholdModal, setThresholdModal] = useState(false);
  const [thresholdTab, setThresholdTab] = useState("temperature");
  const [thresholdForms, setThresholdForms] = useState({
    temperature: null,
    humidity: null,
    illuminance: null,
  });
  const [thresholdLoading, setThresholdLoading] = useState({});
  const [thresholdError, setThresholdError] = useState("");

  const [membersModal, setMembersModal] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [monitorModal, setMonitorModal] = useState(false);

  const [pairModal, setPairModal] = useState(false);
  const [allGateways, setAllGateways] = useState([]);
  const [pairLoading, setPairLoading] = useState(false);
  const [pairError, setPairError] = useState("");
  const [pairingId, setPairingId] = useState(null);

  useEffect(() => {
    let ignore = false;
    const loadDetail = async () => {
      setLoading(true);
      const now = new Date();
      const [fridgeRes, rulesRes, historyRes, latestRes] =
        await Promise.allSettled([
          getFridge(fridgeId),
          listRules(fridgeId),
          listMeasurements(fridgeId, rangeToParams("7d")),
          listMeasurements(fridgeId, {
            startDate: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
            endDate: now.toISOString(),
          }),
        ]);
      if (ignore) return;
      if (fridgeRes.status === "fulfilled") setFridge(fridgeRes.value);
      if (
        rulesRes.status === "fulfilled" &&
        Array.isArray(rulesRes.value?.itemList)
      )
        setRules(rulesRes.value.itemList);
      if (
        historyRes.status === "fulfilled" &&
        Array.isArray(historyRes.value?.itemList)
      ) {
        const items = historyRes.value.itemList;
        setTempHistory(toChartData(items, "temperature", "7d"));
        setHumidHistory(toChartData(items, "humidity", "7d"));
      }
      if (
        latestRes.status === "fulfilled" &&
        Array.isArray(latestRes.value?.itemList)
      ) {
        const raw = latestRes.value.itemList;
        setMeasurement(raw.length > 0 ? raw[raw.length - 1] : null);
      }
      setLoading(false);
    };
    loadDetail();
    return () => {
      ignore = true;
    };
  }, [fridgeId]);

  useEffect(() => {
    if (fridge?.monitorId) {
      getMonitor(fridge.monitorId)
        .then(setMonitor)
        .catch(() => setMonitor(null));
    } else {
      setMonitor(null);
    }
  }, [fridge?.monitorId]);

  const reloadHistory = async (range) => {
    try {
      const result = await listMeasurements(fridgeId, rangeToParams(range));
      const items = result?.itemList ?? [];
      setTempHistory(toChartData(items, "temperature", range));
      setHumidHistory(toChartData(items, "humidity", range));
    } catch {}
  };

  const handleTempRangeChange = (range) => {
    setTempRange(range);
    setHumidRange(range);
    reloadHistory(range);
  };

  const handleHumidRangeChange = (range) => {
    setHumidRange(range);
    setTempRange(range);
    reloadHistory(range);
  };

  // --- Edit ---
  const openEditModal = () => {
    setEditForm({
      name: fridge.name || "",
      location: fridge.location || "",
      description: fridge.description || "",
    });
    setEditError("");
    setOpenMenu(false);
    setEditModal(true);
  };

  const handleUpdateFridge = async () => {
    if (!editForm.name.trim()) {
      setEditError("Name is required.");
      return;
    }
    setEditLoading(true);
    setEditError("");
    try {
      const updated = await updateFridge(fridgeId, {
        name: editForm.name.trim(),
        location: editForm.location.trim(),
        description: editForm.description.trim(),
      });
      setFridge((f) => ({ ...f, ...updated }));
      setEditModal(false);
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  // --- Thresholds ---
  const openThresholdModal = () => {
    setThresholdForms({
      temperature: buildThresholdForm(
        "temperature",
        rules.find((r) => r.sensorType === "temperature"),
      ),
      humidity: buildThresholdForm(
        "humidity",
        rules.find((r) => r.sensorType === "humidity"),
      ),
      illuminance: buildThresholdForm(
        "illuminance",
        rules.find((r) => r.sensorType === "illuminance"),
      ),
    });
    setThresholdTab("temperature");
    setThresholdError("");
    setThresholdLoading({});
    setOpenMenu(false);
    setThresholdModal(true);
  };

  const updateThresholdField = (sensorType, field, value) => {
    setThresholdForms((prev) => ({
      ...prev,
      [sensorType]: { ...prev[sensorType], [field]: value },
    }));
  };

  const handleSaveThreshold = async (sensorType) => {
    const form = thresholdForms[sensorType];
    const min = parseFloat(form.min);
    const max = parseFloat(form.max);
    const dur = parseInt(form.duration, 10);
    if (isNaN(min) || isNaN(max)) {
      setThresholdError("Min and max must be numbers.");
      return;
    }
    if (min >= max) {
      setThresholdError("Min must be less than max.");
      return;
    }
    if (isNaN(dur) || dur < 0) {
      setThresholdError("Duration must be a non-negative integer.");
      return;
    }
    setThresholdError("");
    setThresholdLoading((p) => ({ ...p, [sensorType]: true }));
    try {
      let saved;
      if (form.ruleId) {
        saved = await updateRule(form.ruleId, {
          minThreshold: min,
          maxThreshold: max,
          durationThreshold: dur,
          isActive: form.isActive,
        });
      } else {
        saved = await createRule(fridgeId, {
          name: form.name.slice(0, 20),
          sensorType,
          minThreshold: min,
          maxThreshold: max,
          durationThreshold: dur,
          isActive: form.isActive,
        });
      }
      setRules((prev) =>
        prev.some((r) => r.sensorType === sensorType)
          ? prev.map((r) => (r.sensorType === sensorType ? saved : r))
          : [...prev, saved],
      );
      setThresholdForms((p) => ({
        ...p,
        [sensorType]: buildThresholdForm(sensorType, saved),
      }));
    } catch (e) {
      setThresholdError(e.message);
    } finally {
      setThresholdLoading((p) => ({ ...p, [sensorType]: false }));
    }
  };

  // --- Members ---
  const openMembersModal = async () => {
    setOpenMenu(false);
    setInviteName("");
    setInviteError("");
    setMembersModal(true);
    setMembersLoading(true);
    try {
      const data = await listFridgeMembers(fridgeId);
      setMembersList(Array.isArray(data) ? data : []);
    } catch {
      setMembersList([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteName.trim()) {
      setInviteError("Name is required.");
      return;
    }
    setInviteLoading(true);
    setInviteError("");
    try {
      await inviteMember(fridgeId, inviteName.trim());
      setInviteName("");
      const data = await listFridgeMembers(fridgeId);
      setMembersList(Array.isArray(data) ? data : []);
    } catch (e) {
      setInviteError(e.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setRemovingId(memberId);
    try {
      await removeMember(fridgeId, memberId);
      setMembersList((prev) => prev.filter((m) => m.id !== memberId));
    } catch {}
    setRemovingId(null);
  };

  // --- Delete ---
  const openDeleteModal = () => {
    setDeleteError("");
    setOpenMenu(false);
    setDeleteModal(true);
  };

  const handleDeleteFridge = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteFridge(fridgeId);
      navigate("/fridges");
    } catch (e) {
      setDeleteError(e.message);
      setDeleteLoading(false);
    }
  };

  // --- Monitor detail ---
  const openMonitorModal = () => {
    setOpenMenu(false);
    setMonitorModal(true);
  };

  // --- Pair Monitor ---
  const openPairModal = async () => {
    setOpenMenu(false);
    setPairError("");
    setPairingId(null);
    setPairModal(true);
    setPairLoading(true);
    try {
      const res = await listGateways();
      const gatewayList = res.itemList || [];
      const withMonitors = await Promise.all(
        gatewayList.map(async (gw) => {
          try {
            const mRes = await listGatewayMonitors(gw.id || gw._id);
            return { ...gw, monitors: mRes.itemList || [] };
          } catch {
            return { ...gw, monitors: [] };
          }
        }),
      );
      setAllGateways(withMonitors);
    } catch (e) {
      setPairError(e.message);
    } finally {
      setPairLoading(false);
    }
  };

  const handlePairMonitor = async (monitorId) => {
    setPairingId(monitorId);
    setPairError("");
    try {
      await addMonitorToFridge(monitorId, fridgeId);
      const updated = await getFridge(fridgeId);
      setFridge(updated);
      setPairModal(false);
    } catch (e) {
      setPairError(e.message);
    } finally {
      setPairingId(null);
    }
  };

  const handleUnpairMonitor = async () => {
    if (!fridge?.monitorId) return;
    try {
      await removeMonitorFromFridge(fridge.monitorId, fridgeId);
      setFridge((f) => ({ ...f, monitorId: null }));
      setMonitor(null);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!fridge) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Fridge not found.</p>
      </div>
    );
  }

  const tempCfg = gaugeConfig(rules, "temperature");
  const humidCfg = gaugeConfig(rules, "humidity");
  const tempVal =
    measurement?.temperature != null
      ? Number(measurement.temperature)
      : undefined;
  const humidVal =
    measurement?.humidity != null ? Number(measurement.humidity) : undefined;
  const isOwner = String(fridge.ownerId) === String(user?.id);
  const tempRule = rules.find(
    (r) => r.sensorType === "temperature" && r.isActive,
  );
  const humidRule = rules.find(
    (r) => r.sensorType === "humidity" && r.isActive,
  );

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate(-1)}
              className="mt-0.5 rounded p-1 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{fridge.name}</h1>
                <RoleBadge isOwner={isOwner} />
              </div>
              {fridge.location && (
                <p className="text-sm text-muted-foreground">
                  {fridge.location}
                </p>
              )}
              {fridge.description && (
                <p className="text-xs text-muted-foreground">
                  {fridge.description}
                </p>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              className="rounded p-1 hover:bg-muted"
              onClick={() => setOpenMenu((v) => !v)}
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            {openMenu && (
              <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border bg-white p-1 shadow-lg">
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={openEditModal}
                >
                  Edit
                </button>
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={openThresholdModal}
                >
                  Thresholds
                </button>
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={openMembersModal}
                >
                  Members
                </button>
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    setOpenMenu(false);
                    navigate(`/fridges/${fridgeId}/rules`);
                  }}
                >
                  Rules
                </button>
                {fridge.monitorId ? (
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={openMonitorModal}
                  >
                    Fridge Monitor
                  </button>
                ) : (
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={openPairModal}
                  >
                    Pair Monitor
                  </button>
                )}
                {isOwner && (
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    onClick={openDeleteModal}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Latest measurement */}
        <Card className="mb-4">
          <CardContent>
            <p className="mb-2 text-sm font-medium">
              Last update:{" "}
              {measurement
                ? formatTime(measurement.createdAt || measurement.timestamp)
                : "no data"}
            </p>
            <div className="flex justify-around">
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

        {/* Charts */}
        <div className="flex flex-col gap-4">
          <SensorLineChart
            title="Temperature"
            unit="°C"
            data={tempHistory}
            thresholdMin={tempRule?.minThreshold}
            thresholdMax={tempRule?.maxThreshold}
            timeRange={tempRange}
            onTimeRangeChange={handleTempRangeChange}
            isAlert={isAlert(tempVal, rules, "temperature")}
          />
          <SensorLineChart
            title="Humidity"
            unit="%"
            data={humidHistory}
            thresholdMin={humidRule?.minThreshold}
            thresholdMax={humidRule?.maxThreshold}
            timeRange={humidRange}
            onTimeRangeChange={handleHumidRangeChange}
            isAlert={isAlert(humidVal, rules, "humidity")}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setEditModal(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 text-xl font-bold">Edit Fridge</h2>
            <div className="mb-3">
              <label className="mb-1 block text-sm">Name:</label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="..."
              />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm">Location:</label>
              <Input
                value={editForm.location}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, location: e.target.value }))
                }
                placeholder="..."
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm">Description:</label>
              <Input
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="..."
              />
            </div>
            {editError && (
              <p className="mb-3 text-sm text-red-500">{editError}</p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditModal(false)}
              >
                Cancel
              </Button>
              <button
                onClick={handleUpdateFridge}
                disabled={editLoading}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {editLoading ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thresholds Modal */}
      {thresholdModal && thresholdForms.temperature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setThresholdModal(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-bold">Thresholds</h2>
            {/* Tabs */}
            <div className="mb-4 flex rounded-lg border p-0.5">
              {["temperature", "humidity", "illuminance"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setThresholdTab(type);
                    setThresholdError("");
                  }}
                  className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${
                    thresholdTab === type
                      ? "bg-blue-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {THRESHOLD_LABELS[type]}
                </button>
              ))}
            </div>
            {(() => {
              const type = thresholdTab;
              const form = thresholdForms[type];
              const isLoadingType = thresholdLoading[type];
              const unit = THRESHOLD_UNITS[type];
              if (!form) return null;
              return (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    {form.ruleId ? (
                      <span className="text-xs text-green-600">
                        Rule active
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No rule
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="mb-0.5 block text-xs text-muted-foreground">
                        Min ({unit})
                      </label>
                      <Input
                        value={form.min}
                        onChange={(e) =>
                          updateThresholdField(type, "min", e.target.value)
                        }
                        placeholder="e.g. 2"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-0.5 block text-xs text-muted-foreground">
                        Max ({unit})
                      </label>
                      <Input
                        value={form.max}
                        onChange={(e) =>
                          updateThresholdField(type, "max", e.target.value)
                        }
                        placeholder="e.g. 6"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="mb-0.5 block text-xs text-muted-foreground">
                      Duration (s)
                    </label>
                    <Input
                      value={form.duration}
                      onChange={(e) =>
                        updateThresholdField(type, "duration", e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="threshold-active"
                      checked={form.isActive}
                      onChange={(e) =>
                        updateThresholdField(type, "isActive", e.target.checked)
                      }
                      className="h-4 w-4"
                    />
                    <label htmlFor="threshold-active" className="text-xs">
                      Active
                    </label>
                  </div>
                  <button
                    onClick={() => handleSaveThreshold(type)}
                    disabled={isLoadingType}
                    className="mt-3 w-full rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoadingType
                      ? "Saving…"
                      : form.ruleId
                        ? "Update"
                        : "Create"}
                  </button>
                </div>
              );
            })()}
            {thresholdError && (
              <p className="mt-3 text-sm text-red-500">{thresholdError}</p>
            )}
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setThresholdModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {membersModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setMembersModal(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-bold">Members</h2>
            {membersLoading ? (
              <p className="mb-4 text-sm text-muted-foreground">Loading...</p>
            ) : membersList.length === 0 ? (
              <p className="mb-4 text-sm text-muted-foreground">No members</p>
            ) : (
              <div className="mb-4 divide-y rounded-lg border">
                {membersList.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div>
                      <span className="text-sm">{m.name}</span>
                      {m.email && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {m.email}
                        </span>
                      )}
                    </div>
                    {isOwner && m.id !== String(fridge?.ownerId) && (
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        disabled={removingId === m.id}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {isOwner && (
              <div className="mb-4">
                <label className="mb-1 block text-sm">
                  Invite by username:
                </label>
                <div className="flex gap-2">
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Username..."
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  />
                  <button
                    onClick={handleInvite}
                    disabled={inviteLoading}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inviteLoading ? "…" : "Invite"}
                  </button>
                </div>
                {inviteError && (
                  <p className="mt-1 text-xs text-red-500">{inviteError}</p>
                )}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setMembersModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteModal(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 text-xl font-bold">Delete Fridge</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{fridge.name}</span>
              ?
            </p>
            {deleteError && (
              <p className="mb-3 text-sm text-red-500">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteModal(false)}
              >
                Cancel
              </Button>
              <button
                onClick={handleDeleteFridge}
                disabled={deleteLoading}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monitor Detail Modal */}
      {monitorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setMonitorModal(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-bold">Fridge Monitor</h2>
            {monitor ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono text-xs">{monitor.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      monitor.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {monitor.status}
                  </span>
                </div>
                {monitor.batteryLevel != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Battery</span>
                    <span>{monitor.batteryLevel}%</span>
                  </div>
                )}
                {monitor.firmwareVersion && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Firmware</span>
                    <span className="font-mono text-xs">
                      {monitor.firmwareVersion}
                    </span>
                  </div>
                )}
                {monitor.pairedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Paired</span>
                    <span>
                      {new Date(monitor.pairedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {monitor.gatewayId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gateway</span>
                    <span className="font-mono text-xs">
                      {monitor.gatewayId}
                    </span>
                  </div>
                )}
                {isOwner && (
                  <button
                    onClick={async () => {
                      await handleUnpairMonitor();
                      setMonitorModal(false);
                    }}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Unpair monitor
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
            <Button
              variant="outline"
              className="mt-5 w-full"
              onClick={() => setMonitorModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Pair Monitor Modal */}
      {pairModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPairModal(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-bold">Pair Monitor</h2>
            {pairLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : allGateways.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No gateways found.
              </p>
            ) : (
              <div className="mb-4 max-h-64 overflow-y-auto">
                {allGateways.map((gw) => (
                  <div key={gw.id || gw._id} className="mb-3">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                      {gw.name}
                    </p>
                    {gw.monitors.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No monitors
                      </p>
                    ) : (
                      <div className="divide-y rounded-lg border">
                        {gw.monitors.map((mon) => {
                          const monId = mon.id || mon._id;
                          return (
                            <div
                              key={monId}
                              className="flex items-center justify-between px-3 py-2"
                            >
                              <div>
                                <span className="font-mono text-sm">
                                  {monId}
                                </span>
                                <span
                                  className={`ml-2 text-xs ${
                                    mon.status === "active"
                                      ? "text-green-600"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {mon.status}
                                </span>
                              </div>
                              <button
                                onClick={() => handlePairMonitor(monId)}
                                disabled={pairingId === monId}
                                className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                {pairingId === monId ? "Pairing…" : "Pair"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {pairError && (
              <p className="mb-3 text-sm text-red-500">{pairError}</p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPairModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

export default FridgeDetailPage;
