import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getFridge,
  listRules,
  createRule,
  updateRule,
  deleteRule,
} from "@/api/fridgeApi";

const SENSOR_TYPES = ["temperature", "humidity", "illuminance"];
const UNITS = { temperature: "°C", humidity: "%", illuminance: "lux" };

const emptyForm = () => ({
  name: "",
  sensorType: "temperature",
  min: "",
  max: "",
  duration: "0",
  isActive: true,
});

function FridgeRulesPage() {
  const { id: fridgeId } = useParams();
  const navigate = useNavigate();
  const [fridge, setFridge] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [conflictRule, setConflictRule] = useState(null);

  useEffect(() => {
    Promise.allSettled([getFridge(fridgeId), listRules(fridgeId)]).then(
      ([fridgeRes, rulesRes]) => {
        if (fridgeRes.status === "fulfilled") setFridge(fridgeRes.value);
        if (
          rulesRes.status === "fulfilled" &&
          Array.isArray(rulesRes.value?.itemList)
        )
          setRules(rulesRes.value.itemList);
        setLoading(false);
      },
    );
  }, [fridgeId]);

  const openCreate = () => {
    setForm(emptyForm());
    setFormError("");
    setModal({ mode: "create" });
  };

  const openEdit = (rule) => {
    setForm({
      name: rule.name,
      sensorType: rule.sensorType,
      min: String(rule.minThreshold),
      max: String(rule.maxThreshold),
      duration: String(rule.durationThreshold),
      isActive: rule.isActive,
    });
    setFormError("");
    setModal({ mode: "edit", rule });
  };

  const validateForm = () => {
    const min = parseFloat(form.min);
    const max = parseFloat(form.max);
    const dur = parseInt(form.duration, 10);
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return false;
    }
    if (isNaN(min) || isNaN(max)) {
      setFormError("Min and max must be numbers.");
      return false;
    }
    if (min >= max) {
      setFormError("Min must be less than max.");
      return false;
    }
    if (isNaN(dur) || dur < 0) {
      setFormError("Duration must be a non-negative integer.");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (form.isActive) {
      const sensorType =
        modal.mode === "create" ? form.sensorType : modal.rule.sensorType;
      const existing = rules.find(
        (r) =>
          r.sensorType === sensorType && r.isActive && r.id !== modal.rule?.id,
      );
      if (existing) {
        setConflictRule(existing);
        return;
      }
    }

    performSubmit();
  };

  const handleConfirmConflict = async () => {
    const toDeactivate = conflictRule;
    setConflictRule(null);
    try {
      const deactivated = await updateRule(toDeactivate.id, {
        isActive: false,
      });
      setRules((prev) =>
        prev.map((r) => (r.id === toDeactivate.id ? deactivated : r)),
      );
    } catch {}
    performSubmit();
  };

  const performSubmit = async () => {
    const min = parseFloat(form.min);
    const max = parseFloat(form.max);
    const dur = parseInt(form.duration, 10);
    setFormLoading(true);
    setFormError("");
    try {
      if (modal.mode === "create") {
        const saved = await createRule(fridgeId, {
          name: form.name.trim().slice(0, 20),
          sensorType: form.sensorType,
          minThreshold: min,
          maxThreshold: max,
          durationThreshold: dur,
          isActive: form.isActive,
        });
        setRules((prev) => [...prev, saved]);
      } else {
        const saved = await updateRule(modal.rule.id, {
          name: form.name.trim().slice(0, 20),
          minThreshold: min,
          maxThreshold: max,
          durationThreshold: dur,
          isActive: form.isActive,
        });
        setRules((prev) =>
          prev.map((r) => (r.id === modal.rule.id ? saved : r)),
        );
      }
      setModal(null);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteRule(deleteTarget.id);
      setRules((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {}
    setDeleteLoading(false);
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
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(`/fridges/${fridgeId}`)}
            className="rounded p-1 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">
            Rules{fridge ? ` — ${fridge.name}` : ""}
          </h1>
        </div>

        {rules.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-muted-foreground">No rules</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rule.name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            rule.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                        {rule.sensorType}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm">
                        <span>
                          Min:{" "}
                          <span className="font-medium">
                            {rule.minThreshold} {UNITS[rule.sensorType]}
                          </span>
                        </span>
                        <span>
                          Max:{" "}
                          <span className="font-medium">
                            {rule.maxThreshold} {UNITS[rule.sensorType]}
                          </span>
                        </span>
                        {rule.durationThreshold > 0 && (
                          <span>
                            Duration:{" "}
                            <span className="font-medium">
                              {rule.durationThreshold}s
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(rule)}
                        className="rounded p-1.5 hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(rule)}
                        className="rounded p-1.5 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={openCreate}
            className="rounded-full bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Rule
          </button>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setModal(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 text-xl font-bold">
              {modal.mode === "create" ? "Add Rule" : "Edit Rule"}
            </h2>
            <div className="mb-3">
              <label className="mb-1 block text-sm">Name:</label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Fridge alert"
              />
            </div>
            {modal.mode === "create" && (
              <div className="mb-3">
                <label className="mb-1 block text-sm">Sensor type:</label>
                <select
                  value={form.sensorType}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sensorType: e.target.value }))
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  {SENSOR_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mb-3 flex gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Min ({UNITS[form.sensorType]})
                </label>
                <Input
                  value={form.min}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, min: e.target.value }))
                  }
                  placeholder="e.g. 2"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Max ({UNITS[form.sensorType]})
                </label>
                <Input
                  value={form.max}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, max: e.target.value }))
                  }
                  placeholder="e.g. 6"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-sm">Duration (s):</label>
              <Input
                value={form.duration}
                onChange={(e) =>
                  setForm((p) => ({ ...p, duration: e.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="rule-active"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isActive: e.target.checked }))
                }
                className="h-4 w-4"
              />
              <label htmlFor="rule-active" className="text-sm">
                Active
              </label>
            </div>
            {formError && (
              <p className="mb-3 text-sm text-red-500">{formError}</p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setModal(null)}
              >
                Cancel
              </Button>
              <button
                onClick={handleSubmit}
                disabled={formLoading}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {formLoading
                  ? "Saving…"
                  : modal.mode === "create"
                    ? "Create"
                    : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 text-xl font-bold">Delete Rule</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Are you sure you want to delete rule{" "}
              <span className="font-medium text-foreground">
                {deleteTarget.name}
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Confirmation Modal */}
      {conflictRule && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50"
          style={{ zIndex: 60 }}
          onClick={() => setConflictRule(null)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 text-xl font-bold">Warning</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Rule{" "}
              <span className="font-medium text-foreground">
                {conflictRule.name}
              </span>{" "}
              is already active for{" "}
              <span className="font-medium text-foreground capitalize">
                {conflictRule.sensorType}
              </span>
              . Do you want to deactivate it and activate this one instead?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConflictRule(null)}
              >
                Cancel
              </Button>
              <button
                onClick={handleConfirmConflict}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Yes, replace
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default FridgeRulesPage;
