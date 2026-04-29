import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { GaugeChart } from "@/components/GaugeChart";
import { SensorLineChart } from "@/components/SensorLineChart";
import { getFridge, listRules, listMeasurements } from "@/api/fridgeApi";

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
    default: // 7d
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
  const [tempHistory, setTempHistory] = useState([]);
  const [humidHistory, setHumidHistory] = useState([]);
  const [tempRange, setTempRange] = useState("7d");
  const [humidRange, setHumidRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  /* useEffect(() => {
    Promise.allSettled([
      getFridge(fridgeId),
      listRules(fridgeId),
      listMeasurements(fridgeId, rangeToParams("7d")),
    ]).then(([fridgeRes, rulesRes ,measRes, historyRes]) => {
      if (fridgeRes.status === "fulfilled") setFridge(fridgeRes.value);
      if (measRes.status === "fulfilled") setMeasurement(measRes.value);
      if (
        rulesRes.status === "fulfilled" &&
        Array.isArray(rulesRes.value?.itemList)
      ) {
        setRules(rulesRes.value.itemList);
      }
      if (
        historyRes.status === "fulfilled" &&
        Array.isArray(historyRes.value?.itemList)
      ) {
        const items = historyRes.value.itemList;
        setTempHistory(toChartData(items, "temperature", "7d"));
        setHumidHistory(toChartData(items, "humidity", "7d"));
      }
      setLoading(false);
    });
  }, [fridgeId]); */

  useEffect(() => {
    let ignore = false;

    const loadDetail = async () => {
      setLoading(true);

      const [fridgeRes, rulesRes, historyRes] = await Promise.allSettled([
        getFridge(fridgeId),
        listRules(fridgeId),
        listMeasurements(fridgeId, rangeToParams("7d")),
      ]);

      if (ignore) return;

      if (fridgeRes.status === "fulfilled") {
        setFridge(fridgeRes.value);
      }

      if (
        rulesRes.status === "fulfilled" &&
        Array.isArray(rulesRes.value?.itemList)
      ) {
        setRules(rulesRes.value.itemList);
      }

      if (
        historyRes.status === "fulfilled" &&
        Array.isArray(historyRes.value?.itemList)
      ) {
        const items = historyRes.value.itemList;

        setMeasurement(items[items.length - 1] ?? null);

        setTempHistory(toChartData(items, "temperature", "7d"));
        setHumidHistory(toChartData(items, "humidity", "7d"));
      }

      setLoading(false);
    };

    loadDetail();

    return () => {
      ignore = true;
    };
  }, [fridgeId]);

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
          <button className="rounded p-1 hover:bg-muted">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <Card className="mb-4">
          <CardContent>
            <p className="mb-2 text-sm font-medium">
              Last update:{" "}
              {measurement
                ? formatTime(measurement.timestamp || measurement.createdAt)
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
    </main>
  );
}

export default FridgeDetailPage;
