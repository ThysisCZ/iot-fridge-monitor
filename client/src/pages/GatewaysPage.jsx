import { useEffect, useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  listGateways,
  listGatewayMonitors,
  registerGateway,
  updateGateway,
  deleteGateway,
} from "@/api/gatewayApi";
import { getMonitor } from "@/api/monitorApi";
import {ButtonSkeleton, GatewaySkeleton} from "@/components/Skeleton"

function GatewaysPage() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState("form");
  const [gatewayName, setGatewayName] = useState("");
  const [createdGateway, setCreatedGateway] = useState(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [editGateway, setEditGateway] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [monitorModal, setMonitorModal] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [monitorLoading, setMonitorLoading] = useState(false);

  const getGatewayId = (gateway) => gateway.id;

  const getMonitorId = (monitor) => monitor.id;

  const loadGateways = async () => {
    try {
      setLoading(true);
      setError("");

      const gatewaysRes = await listGateways();
      const gatewayList = gatewaysRes.itemList || [];

      const gatewaysWithMonitors = await Promise.all(
        gatewayList.map(async (gateway) => {
          try {
            const monitorsRes = await listGatewayMonitors(getGatewayId(gateway));

            return {
              ...gateway,
              monitors: monitorsRes.itemList || [],
            };
          } catch {
            return {
              ...gateway,
              monitors: [],
              monitorLoadFailed: true,
            };
          }
        }),
      );

      setGateways(gatewaysWithMonitors);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load gateways.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGateways();
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setModalStep("form");
    setGatewayName("");
    setCreatedGateway(null);
    setFormError("");
    setFormLoading(false);
  };

  const handleRegisterGateway = async () => {
    if (!gatewayName.trim()) {
      setFormError("Gateway name is required.");
      return;
    }

    if (gatewayName.trim().length > 20) {
      setFormError("Gateway name can have max 20 characters.");
      return;
    }

    try {
      setFormLoading(true);
      setFormError("");

      const created = await registerGateway({
        name: gatewayName.trim(),
      });

      setCreatedGateway(created);
      setModalStep("apiKey");
    } catch (err) {
      setFormError(err.message || "Failed to create gateway.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmSaved = async () => {
    closeModal();
    await loadGateways();
  };

  const openEditModal = (gateway) => {
    setEditGateway(gateway);
    setEditName(gateway.name || "");
    setOpenMenuId(null);
    setActionError("");
  };

  const handleUpdateGateway = async () => {
    if (!editName.trim()) {
      setActionError("Gateway name is required.");
      return;
    }

    if (editName.trim().length > 20) {
      setActionError("Gateway name can have max 20 characters.");
      return;
    }

    try {
      setActionLoading(true);
      setActionError("");

      await updateGateway(getGatewayId(editGateway), {
        name: editName.trim(),
      });

      setEditGateway(null);
      setEditName("");
      await loadGateways();
    } catch (err) {
      setActionError(err.message || "Failed to update gateway.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteDialog = (gateway) => {
    setDeleteTarget(gateway);
    setOpenMenuId(null);
    setActionError("");
  };

  const handleDeleteGateway = async () => {
    try {
      setActionLoading(true);
      setActionError("");

      await deleteGateway(getGatewayId(deleteTarget));

      setDeleteTarget(null);
      await loadGateways();
    } catch (err) {
      setActionError(err.message || "Failed to delete gateway.");
    } finally {
      setActionLoading(false);
    }
  };

  const openMonitorModal = async (monitor) => {
    const monitorId = getMonitorId(monitor);

    setSelectedMonitor(monitor);
    setMonitorModal(true);
    setMonitorLoading(true);

    try {
      const fullMonitor = await getMonitor(monitorId);
      setSelectedMonitor(fullMonitor);
    } catch {
      setSelectedMonitor(monitor);
    } finally {
      setMonitorLoading(false);
    }
  };

  const closeMonitorModal = () => {
    setMonitorModal(false);
    setSelectedMonitor(null);
    setMonitorLoading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <h1 className="mt-1 mb-6 text-xl font-bold sm:text-2xl">Gateways</h1>
            <ButtonSkeleton />
          </div>
          <GatewaySkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold sm:text-2xl">Gateways</h1>

          <Button
            onClick={() => setShowModal(true)}
            className="shrink-0 rounded-full px-3 text-xs sm:px-8 sm:text-sm"
          >
            + Add Gateway
          </Button>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        )}

        {gateways.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">No gateways</p>
          </div>
        ) : (
          <div className="mx-auto mt-6 flex w-full flex-col gap-4">
            {gateways.map((gateway) => (
              <Card
                key={getGatewayId(gateway)}
                className="rounded-2xl border bg-card shadow-sm"
              >
                <CardContent>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold">
                        {gateway.name}
                      </h2>

                      <p className={`text-xs ${gateway.status === "active" ? "text-green-600" : "text-orange-500" }  capitalize`}>
                        {gateway.status}
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        className="rounded-md p-1 hover:bg-muted"
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === getGatewayId(gateway)
                              ? null
                              : getGatewayId(gateway),
                          )
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {openMenuId === getGatewayId(gateway) && (
                        <div className="absolute right-0 top-8 z-20 w-32 rounded-xl border bg-white p-1 shadow-lg">
                          <button
                            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => openEditModal(gateway)}
                          >
                            Edit
                          </button>

                          <button
                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            onClick={() => openDeleteDialog(gateway)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-muted-foreground">
                      Monitors:
                    </p>

                    {gateway.monitors.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        No monitors
                      </p>
                    ) : (
                      <div className="mt-3 divide-y rounded-md border">
                        {gateway.monitors.map((monitor) => (
                          <div
                            key={getMonitorId(monitor)}
                            className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm hover:bg-muted"
                            onClick={() => openMonitorModal(monitor)}
                          >
                            <div>
                              <span>
                                {monitor.name || monitor.id}
                              </span>

                              <span className="ml-2 text-xs text-muted-foreground capitalize">
                                {monitor.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={closeModal}
          >
            <div
              className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {modalStep === "form" && (
                <>
                  <h2 className="mb-5 text-xl font-bold">Add Gateway</h2>

                  <div className="mb-4">
                    <label className="mb-1 block text-sm">Gateway name:</label>
                    <Input
                      value={gatewayName}
                      onChange={(e) => setGatewayName(e.target.value)}
                      placeholder="..."
                    />
                  </div>

                  {formError && (
                    <p className="mb-3 text-sm text-red-500">{formError}</p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={closeModal}
                    >
                      Cancel
                    </Button>

                    <Button
                      className="flex-1"
                      onClick={handleRegisterGateway}
                      disabled={formLoading}
                    >
                      {formLoading ? "Creating..." : "Continue"}
                    </Button>
                  </div>
                </>
              )}

              {modalStep === "apiKey" && (
                <>
                  <h2 className="mb-5 text-xl font-bold">Add Gateway</h2>

                  <div className="mb-4">
                    <p className="mb-1 text-sm font-medium">API key:</p>
                    <p className="break-all rounded-lg bg-gray-100 p-3 text-sm">
                      {createdGateway?.apiKey}
                    </p>
                  </div>

                  <p className="mb-4 text-sm text-muted-foreground">
                    Copy this API key to your Node-RED dashboard.
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={closeModal}
                    >
                      Cancel
                    </Button>

                    <Button
                      className="flex-1"
                      onClick={() => setModalStep("confirm")}
                    >
                      Continue
                    </Button>
                  </div>
                </>
              )}

              {modalStep === "confirm" && (
                <>
                  <h2 className="mb-3 text-xl font-bold">
                    Did you save the API key?
                  </h2>

                  <p className="mb-5 text-sm text-muted-foreground">
                    You will not be able to see this API key again. Make sure you
                    copied it to your Node-RED dashboard.
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setModalStep("apiKey")}
                    >
                      Back
                    </Button>

                    <Button className="flex-1" onClick={handleConfirmSaved}>
                      Yes, I saved it
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {editGateway && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setEditGateway(null)}
          >
            <div
              className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-5 text-xl font-bold">Edit Gateway</h2>

              <div className="mb-4">
                <label className="mb-1 block text-sm">Gateway name:</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Gateway name"
                />
              </div>

              {actionError && (
                <p className="mb-3 text-sm text-red-500">{actionError}</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setEditGateway(null)}
                >
                  Cancel
                </Button>

                <Button
                  className="flex-1"
                  onClick={handleUpdateGateway}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setDeleteTarget(null)}
          >
            <div
              className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-3 text-xl font-bold">Delete Gateway</h2>

              <p className="mb-5 text-sm text-muted-foreground">
                Are you sure you want to delete gateway{" "}
                <span className="font-medium text-foreground">
                  {deleteTarget.name}
                </span>
                ?
              </p>

              {actionError && (
                <p className="mb-3 text-sm text-red-500">{actionError}</p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </Button>

                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleDeleteGateway}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {monitorModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={closeMonitorModal}
          >
            <div
              className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-xl font-bold">Monitor</h2>

              {monitorLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : selectedMonitor ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-mono text-xs">
                      {selectedMonitor.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        selectedMonitor.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {selectedMonitor.status || "unknown"}
                    </span>
                  </div>

                  {selectedMonitor.batteryLevel != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Battery</span>
                      <span>{selectedMonitor.batteryLevel}%</span>
                    </div>
                  )}

                  {selectedMonitor.firmwareVersion && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Firmware</span>
                      <span className="font-mono text-xs">
                        {selectedMonitor.firmwareVersion}
                      </span>
                    </div>
                  )}

                  {selectedMonitor.pairedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Paired</span>
                      <span>
                        {new Date(selectedMonitor.pairedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {selectedMonitor.gatewayId && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Gateway</span>
                      <span className="font-mono text-xs">
                        {selectedMonitor.gatewayId}
                      </span>
                    </div>
                  )}

                  {selectedMonitor.fridgeId && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Fridge</span>
                      <span className="font-mono text-xs">
                        {selectedMonitor.fridgeId}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Monitor not found.
                </p>
              )}

              <Button
                variant="outline"
                className="mt-5 w-full"
                onClick={closeMonitorModal}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default GatewaysPage;