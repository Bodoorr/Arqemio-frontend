import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Plus,
  Search,
  X,
  Package,
  Building2,
  Clock3,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  Ban,
  ArrowRight,
} from "lucide-react";
import Client from "../../../services/api";
import { GetAllEquipments } from "../../../services/equipment";
import {
  CreateReservation,
  GetAllReservations,
  GetEquipmentAvailability,
  CancelReservation,
} from "../../../services/reservation";
import ArqemioDateTimePicker from "../../../components/ArqemioDateTimePicker";

const initialForm = {
  equipmentId: "",
  projectId: "",
  quantity: 1,
  startDateTime: "",
  endDateTime: "",
  description: "",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const getErrorMessage = (error, fallback) => {
  const data = error.response?.data;

  return typeof data === "string"
    ? data
    : data?.message || data?.error || fallback;
};

const Reservations = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reservations, setReservations] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    setError("");

    const [reservationResult, equipmentResult, projectResult] =
      await Promise.allSettled([
        GetAllReservations(),
        GetAllEquipments(),
        Client.get("/company/projects"),
      ]);

    if (reservationResult.status === "fulfilled") {
      setReservations(
        Array.isArray(reservationResult.value) ? reservationResult.value : [],
      );
    } else {
      setError(
        getErrorMessage(
          reservationResult.reason,
          "Unable to load reservations.",
        ),
      );
    }

    if (equipmentResult.status === "fulfilled") {
      setEquipments(
        Array.isArray(equipmentResult.value) ? equipmentResult.value : [],
      );
    } else {
      setError((previous) => `${previous} Unable to load equipment.`.trim());
    }

    if (projectResult.status === "fulfilled") {
      setProjects(
        Array.isArray(projectResult.value.data) ? projectResult.value.data : [],
      );
    } else {
      setError((previous) => `${previous} Unable to load projects.`.trim());
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const equipmentId = searchParams.get("equipmentId");

    if (equipmentId && searchParams.get("create") === "true") {
      setForm({
        ...initialForm,
        equipmentId,
      });

      setFormError("");
      setAvailabilityError("");
      setAvailableQuantity(null);
      setModalOpen(true);

      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (
      !form.equipmentId ||
      !form.startDateTime ||
      !form.endDateTime ||
      form.endDateTime <= form.startDateTime
    ) {
      setAvailableQuantity(null);
      setAvailabilityError("");
      setChecking(false);
      return;
    }

    let active = true;

    const checkAvailability = async () => {
      setChecking(true);
      setAvailableQuantity(null);
      setAvailabilityError("");

      try {
        const result = await GetEquipmentAvailability(
          form.equipmentId,
          form.startDateTime,
          form.endDateTime,
        );

        if (active) {
          setAvailableQuantity(Number(result));
        }
      } catch (error) {
        if (active) {
          setAvailabilityError(
            getErrorMessage(error, "Unable to check equipment availability."),
          );
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };

    checkAvailability();

    return () => {
      active = false;
    };
  }, [form.equipmentId, form.startDateTime, form.endDateTime]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        reservation.equipmentName?.toLowerCase().includes(query) ||
        reservation.projectName?.toLowerCase().includes(query) ||
        reservation.reservedByName?.toLowerCase().includes(query);

      return (
        matchesSearch &&
        (statusFilter === "ALL" || reservation.status === statusFilter)
      );
    });
  }, [reservations, search, statusFilter]);

  const reservedCount = reservations.filter(
    (reservation) => reservation.status === "RESERVED",
  ).length;

  const cancelledCount = reservations.filter(
    (reservation) => reservation.status === "CANCELLED",
  ).length;

  const openModal = () => {
    setForm(initialForm);
    setFormError("");
    setAvailabilityError("");
    setAvailableQuantity(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setFormError("");
    setAvailabilityError("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.equipmentId || !form.projectId) {
      setFormError("Please select equipment and project.");
      return;
    }

    if (
      !form.startDateTime ||
      !form.endDateTime ||
      form.endDateTime <= form.startDateTime
    ) {
      setFormError("End date must be after start date.");
      return;
    }

    const quantity = Number(form.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setFormError("Quantity must be at least 1.");
      return;
    }

    if (
      checking ||
      availableQuantity === null ||
      quantity > availableQuantity
    ) {
      setFormError("Please select a quantity within the available units.");
      return;
    }

    setSaving(true);

    try {
      await CreateReservation({
        equipmentId: Number(form.equipmentId),
        projectId: Number(form.projectId),
        quantity,
        startDateTime: form.startDateTime,
        endDateTime: form.endDateTime,
        description: form.description.trim(),
      });

      setModalOpen(false);
      setForm(initialForm);
      await loadData();
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create reservation."));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (reservation) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel the reservation for "${reservation.equipmentName}"?`,
    );

    if (!confirmed) return;

    try {
      await CancelReservation(reservation.id);
      await loadData();
    } catch (error) {
      setError(getErrorMessage(error, "Unable to cancel reservation."));
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#c3c8c1] bg-white px-4 py-3 text-sm text-[#35362c] outline-none transition-colors focus:border-[#7a7359]";

  const labelClass = "mb-2 block text-sm font-medium text-[#35362c]";

  return (
    <div className="min-h-screen bg-transparent px-5 py-6 text-[#35362c] md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#7a7359]">
              Equipment Management
            </p>

            <h1 className="text-3xl font-semibold">Reservations</h1>

            <p className="mt-2 text-sm text-[#7a7359]">
              Manage equipment bookings and availability.
            </p>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="flex items-center gap-2 rounded-xl bg-[#d4e14b] px-5 py-3 text-sm font-semibold transition-colors hover:bg-[#c5d33c]"
          >
            <Plus size={18} />
            New Reservation
          </button>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Reservations",
              value: reservations.length,
              icon: CalendarDays,
            },
            {
              label: "Reserved",
              value: reservedCount,
              icon: CheckCircle2,
            },
            {
              label: "Cancelled",
              value: cancelledCount,
              icon: Ban,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-[#c3c8c1] bg-white p-5"
            >
              <div>
                <p className="text-sm text-[#7a7359]">{item.label}</p>

                <p className="mt-2 text-3xl font-semibold">{item.value}</p>
              </div>

              <div className="rounded-xl bg-[#e2e4e6] p-3">
                <item.icon size={22} />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7359]"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search equipment, projects, or users..."
              className={`${inputClass} pl-11`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${inputClass} sm:w-48`}
          >
            <option value="ALL">All Statuses</option>
            <option value="RESERVED">Reserved</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderCircle size={28} className="animate-spin text-[#7a7359]" />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="rounded-xl border border-[#c3c8c1] bg-white px-6 py-16 text-center">
            <CalendarDays size={42} className="mx-auto mb-4 text-[#7a7359]" />

            <h2 className="text-lg font-semibold">No reservations found</h2>

            <p className="mt-2 text-sm text-[#7a7359]">
              Create a reservation to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="rounded-xl border border-[#c3c8c1] bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-xl bg-[#e2e4e6] p-3">
                      <Package size={22} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        {reservation.equipmentName}
                      </h2>

                      <p className="mt-1 text-xs text-[#7a7359]">
                        Reservation #{reservation.id}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      reservation.status === "RESERVED"
                        ? "bg-[#d4e14b] text-[#35362c]"
                        : "bg-[#e2e4e6] text-[#35362c]"
                    }`}
                  >
                    {reservation.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-[#f3f4f0] p-4 text-sm">
                  <div>
                    <p className="text-xs text-[#7a7359]">Start Date</p>

                    <p className="mt-1 font-medium">
                      {formatDate(reservation.startDateTime)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#7a7359]">End Date</p>

                    <p className="mt-1 font-medium">
                      {formatDate(reservation.endDateTime)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#7a7359]">Quantity</p>

                    <p className="mt-1 font-medium">{reservation.quantity}</p>
                  </div>

                  <div>
                    <p className="text-xs text-[#7a7359]">Reserved By</p>

                    <p className="mt-1 font-medium">
                      {reservation.reservedByName}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-[#7a7359]">
                  <Building2 size={16} />
                  <span>{reservation.projectName}</span>
                </div>

                {reservation.description && (
                  <p className="mt-3 text-sm leading-6 text-[#7a7359]">
                    {reservation.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e2e4e6] pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/equipment/${reservation.equipmentId}`)
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#c3c8c1] px-4 py-2.5 text-xs font-medium transition-colors hover:bg-[#e2e4e6]"
                  >
                    View Equipment
                    <ArrowRight size={15} />
                  </button>

                  {reservation.status === "RESERVED" && (
                    <button
                      type="button"
                      onClick={() => handleCancel(reservation)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                    >
                      <Ban size={15} />
                      Cancel Reservation
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#f5f6f3] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#c3c8c1] px-6 py-5 md:px-8">
              <div>
                <h2 className="text-xl font-semibold">New Reservation</h2>

                <p className="mt-1 text-sm text-[#7a7359]">
                  Reserve equipment for a project.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 hover:bg-[#e2e4e6] disabled:opacity-50"
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-8">
                {formError && (
                  <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={17} />
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Equipment *</label>

                    <select
                      required
                      value={form.equipmentId}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          equipmentId: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">Select equipment</option>

                      {equipments
                        .filter((equipment) => equipment.status === "AVAILABLE")
                        .map((equipment) => (
                          <option key={equipment.id} value={equipment.id}>
                            {equipment.name} ({equipment.quantity} units)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Project *</label>

                    <select
                      required
                      value={form.projectId}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          projectId: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">Select project</option>

                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Start Date *</label>

                    <ArqemioDateTimePicker
                      centered
                      required
                      value={form.startDateTime}
                      onChange={(value) =>
                        setForm((previous) => ({
                          ...previous,
                          startDateTime: value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>End Date *</label>

                    <ArqemioDateTimePicker
                      centered
                      required
                      value={form.endDateTime}
                      onChange={(value) =>
                        setForm((previous) => ({
                          ...previous,
                          endDateTime: value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Quantity *</label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      max={availableQuantity ?? undefined}
                      required
                      value={form.quantity}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          quantity: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Availability</label>

                    <div className="flex min-h-11 items-center gap-2 rounded-xl border border-[#c3c8c1] bg-white px-4 text-sm">
                      {checking ? (
                        <>
                          <LoaderCircle size={16} className="animate-spin" />
                          Checking availability...
                        </>
                      ) : availabilityError ? (
                        <span className="text-red-600">
                          {availabilityError}
                        </span>
                      ) : availableQuantity !== null ? (
                        <>
                          <CheckCircle2
                            size={17}
                            className={
                              availableQuantity > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          />
                          {availableQuantity} units available
                        </>
                      ) : (
                        <>
                          <Clock3 size={17} />
                          Select equipment and dates
                        </>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Description</label>

                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Reservation notes..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#c3c8c1] bg-white px-6 py-4 md:px-8">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-[#c3c8c1] px-5 py-2.5 text-sm font-medium hover:bg-[#e2e4e6] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    checking ||
                    availableQuantity === null ||
                    availableQuantity < Number(form.quantity) ||
                    Number(form.quantity) < 1
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#d4e14b] px-5 py-2.5 text-sm font-semibold hover:bg-[#c5d33c] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}

                  {saving ? "Creating..." : "Create Reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;
