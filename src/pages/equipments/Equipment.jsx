import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Package,
  Building2,
  Boxes,
  CalendarDays,
  Pencil,
  Archive,
  X,
  Upload,
  ImagePlus,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import Client from "../../services/api";
import {
  GetAllEquipments,
  GetAllReservations,
  CreateEquipment,
  UpdateEquipment,
  ArchiveEquipment,
  UploadEquipmentImage,
} from "../../services/equipment";

const initialForm = {
  companyId: "",
  name: "",
  description: "",
  status: "AVAILABLE",
  quantity: 1,
  imageUrl: "",
};

const statusOptions = [
  { value: "AVAILABLE", label: "Available" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "UNAVAILABLE", label: "Unavailable" },
];

const formatStatus = (status) =>
  String(status || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getErrorMessage = (error, fallback) => {
  const data = error.response?.data;

  if (typeof data === "string") return data;

  return data?.message || data?.error || fallback;
};

const getAvailability = (equipment, reservations, now) => {
  if (equipment.status !== "AVAILABLE") {
    return {
      available: 0,
      reserved: 0,
      label: formatStatus(equipment.status),
      operational: false,
    };
  }

  const reserved = reservations
    .filter(
      (reservation) =>
        Number(reservation.equipmentId) === Number(equipment.id) &&
        reservation.status === "RESERVED" &&
        new Date(reservation.startDateTime) <= now &&
        new Date(reservation.endDateTime) > now,
    )
    .reduce(
      (total, reservation) => total + Number(reservation.quantity || 0),
      0,
    );

  const available = Math.max(0, Number(equipment.quantity || 0) - reserved);

  return {
    available,
    reserved,
    label: available === 0 ? "Fully Booked" : "Available",
    operational: true,
  };
};

const Equipment = () => {
  const navigate = useNavigate();

  const [equipments, setEquipments] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [memberships, setMemberships] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [now] = useState(() => new Date());

  const loadData = async () => {
    setLoading(true);
    setPageError("");

    try {
      const [equipmentData, reservationData, profileResponse] =
        await Promise.all([
          GetAllEquipments(),
          GetAllReservations(),
          Client.get("/users/profile"),
        ]);

      setEquipments(Array.isArray(equipmentData) ? equipmentData : []);

      setReservations(Array.isArray(reservationData) ? reservationData : []);

      const profile = profileResponse.data;

      setMemberships(
        Array.isArray(profile.memberships) ? profile.memberships : [],
      );
    } catch (error) {
      setPageError(getErrorMessage(error, "Unable to load equipment."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedFile) return;

    const url = URL.createObjectURL(selectedFile);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const ownerMemberships = useMemo(
    () =>
      memberships.filter(
        (membership) =>
          membership.role === "OWNER" && membership.status === "ACTIVE",
      ),
    [memberships],
  );

  const companies = useMemo(() => {
    const map = new Map();

    equipments.forEach((equipment) => {
      if (equipment.companyId) {
        map.set(equipment.companyId, {
          id: equipment.companyId,
          name: equipment.companyName,
        });
      }
    });

    memberships.forEach((membership) => {
      const companyId = membership.companyId ?? membership.company?.id;

      const companyName = membership.companyName ?? membership.company?.name;

      if (companyId) {
        map.set(companyId, {
          id: companyId,
          name: companyName || `Company ${companyId}`,
        });
      }
    });

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [equipments, memberships]);

  const canManage = (equipment) =>
    ownerMemberships.some(
      (membership) =>
        Number(membership.companyId ?? membership.company?.id) ===
        Number(equipment.companyId),
    );

  const equipmentWithAvailability = useMemo(
    () =>
      equipments
        .filter((equipment) => equipment.status !== "ARCHIVED")
        .map((equipment) => ({
          ...equipment,
          availability: getAvailability(equipment, reservations, now),
        })),
    [equipments, reservations, now],
  );

  const filteredEquipments = useMemo(
    () =>
      equipmentWithAvailability.filter((equipment) => {
        const query = search.trim().toLowerCase();

        const matchesSearch =
          !query ||
          equipment.name?.toLowerCase().includes(query) ||
          equipment.companyName?.toLowerCase().includes(query) ||
          equipment.description?.toLowerCase().includes(query);

        const matchesCompany =
          companyFilter === "ALL" ||
          String(equipment.companyId) === companyFilter;

        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "FULLY_BOOKED"
            ? equipment.availability.label === "Fully Booked"
            : statusFilter === "AVAILABLE"
              ? equipment.availability.label === "Available"
              : equipment.status === statusFilter);

        return matchesSearch && matchesCompany && matchesStatus;
      }),
    [equipmentWithAvailability, search, companyFilter, statusFilter],
  );

  const totalUnits = equipmentWithAvailability.reduce(
    (total, equipment) => total + Number(equipment.quantity || 0),
    0,
  );

  const fullyBookedCount = equipmentWithAvailability.filter(
    (equipment) => equipment.availability.label === "Fully Booked",
  ).length;

  const openCreateModal = () => {
    setEditingEquipment(null);
    setForm({
      ...initialForm,
      companyId:
        ownerMemberships[0]?.companyId ??
        ownerMemberships[0]?.company?.id ??
        "",
    });
    setSelectedFile(null);
    setImagePreview("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (equipment) => {
    setEditingEquipment(equipment);
    setForm({
      companyId: equipment.companyId,
      name: equipment.name || "",
      description: equipment.description || "",
      status: equipment.status || "AVAILABLE",
      quantity: equipment.quantity || 1,
      imageUrl: equipment.imageUrl || "",
    });
    setSelectedFile(null);
    setImagePreview(equipment.imageUrl || "");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingEquipment(null);
    setSelectedFile(null);
    setImagePreview("");
    setFormError("");
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setFormError("");
    setSelectedFile(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.companyId) {
      setFormError("Please select a company.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Equipment name is required.");
      return;
    }

    if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 1) {
      setFormError("Quantity must be at least 1.");
      return;
    }

    setSaving(true);

    try {
      let imageUrl = form.imageUrl || null;

      if (selectedFile) {
        imageUrl = await UploadEquipmentImage(selectedFile, form.companyId);
      }

      const payload = {
        companyId: Number(form.companyId),
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        quantity: Number(form.quantity),
        imageUrl,
      };

      if (editingEquipment) {
        await UpdateEquipment(editingEquipment.id, payload);
      } else {
        await CreateEquipment(payload);
      }

      setModalOpen(false);
      setEditingEquipment(null);
      setSelectedFile(null);
      setImagePreview("");
      await loadData();
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          selectedFile
            ? "Unable to upload the image or save equipment."
            : "Unable to save equipment.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (equipment) => {
    const confirmed = window.confirm(
      `Are you sure you want to archive "${equipment.name}"?`,
    );

    if (!confirmed) return;

    try {
      await ArchiveEquipment(equipment.id);
      await loadData();
    } catch (error) {
      setPageError(getErrorMessage(error, "Unable to archive equipment."));
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#c3c8c1] bg-white px-4 py-3 text-sm text-[#35362c] outline-none transition-colors focus:border-[#7a7359]";

  const labelClass = "mb-2 block text-sm font-medium text-[#35362c]";

  return (
    <div className="min-h-screen bg-[#e2e4e6] px-5 py-6 text-[#35362c] md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#7a7359]">
              Company Resources
            </p>
            <h1 className="text-3xl font-semibold">Equipment</h1>
            <p className="mt-2 text-sm text-[#7a7359]">
              Manage equipment, availability, and inventory.
            </p>
          </div>

          {ownerMemberships.length > 0 && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-[#d4e14b] px-5 py-3 text-sm font-semibold transition-colors hover:bg-[#c5d33c]"
            >
              <Plus size={18} />
              Add Equipment
            </button>
          )}
        </div>

        {pageError && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {pageError}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Equipment Types",
              value: equipmentWithAvailability.length,
              icon: Package,
            },
            {
              label: "Total Units",
              value: totalUnits,
              icon: Boxes,
            },
            {
              label: "Fully Booked Now",
              value: fullyBookedCount,
              icon: CalendarDays,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-between rounded-xl border border-[#c3c8c1] bg-white/80 p-5"
            >
              <div>
                <p className="text-sm text-[#7a7359]">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
              </div>

              <div className="rounded-xl bg-[#e2e4e6] p-3">
                <stat.icon size={22} />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7359]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search equipment..."
              className="w-full rounded-xl border border-[#c3c8c1] bg-white px-4 py-3 pl-11 text-sm outline-none focus:border-[#7a7359]"
            />
          </div>

          <select
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            className="rounded-xl border border-[#c3c8c1] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="ALL">All Companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-[#c3c8c1] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available Now</option>
            <option value="FULLY_BOOKED">Fully Booked Now</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderCircle size={28} className="animate-spin text-[#7a7359]" />
          </div>
        ) : filteredEquipments.length === 0 ? (
          <div className="rounded-xl border border-[#c3c8c1] bg-white/80 px-6 py-16 text-center">
            <Package size={42} className="mx-auto mb-4 text-[#7a7359]" />
            <h2 className="text-lg font-semibold">No equipment found</h2>
            <p className="mt-2 text-sm text-[#7a7359]">
              Try changing your filters or add new equipment.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredEquipments.map((equipment) => (
              <div
                key={equipment.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/equipment/${equipment.id}`)}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    navigate(`/equipment/${equipment.id}`);
                  }
                }}
                className="group cursor-pointer overflow-hidden rounded-xl border border-[#c3c8c1] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7a7359] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#7a7359]"
              >
                <div className="relative h-36 overflow-hidden bg-[#eef0e9]">
                  {equipment.imageUrl ? (
                    <img
                      src={equipment.imageUrl}
                      alt={equipment.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package size={48} className="text-[#a5aa9e]" />
                    </div>
                  )}

                  <span
                    className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
                      equipment.availability.label === "Available"
                        ? "bg-[#d4e14b] text-[#35362c]"
                        : "bg-[#35362c] text-white"
                    }`}
                  >
                    {equipment.availability.label}
                  </span>
                </div>

                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        {equipment.name}
                      </h2>

                      <p className="mt-1 flex items-center gap-1.5 text-xs text-[#7a7359]">
                        <Building2 size={13} />
                        {equipment.companyName}
                      </p>
                    </div>

                    <ChevronRight
                      size={19}
                      className="shrink-0 text-[#7a7359] transition-transform group-hover:translate-x-1"
                    />
                  </div>

                  <p className="mb-4 line-clamp-2 min-h-9 text-xs leading-5 text-[#7a7359]">
                    {equipment.description || "No description available."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#e2e4e6] p-3">
                    <div>
                      <p className="text-xs text-[#7a7359]">Total Units</p>
                      <p className="mt-1 text-lg font-semibold">
                        {equipment.quantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#7a7359]">Available Now</p>
                      <p className="mt-1 text-lg font-semibold">
                        {equipment.availability.operational
                          ? equipment.availability.available
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {canManage(equipment) && (
                    <div className="mt-4 flex gap-2 border-t border-[#e2e4e6] pt-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(equipment);
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#c3c8c1] px-3 py-2 text-xs font-medium hover:bg-[#e2e4e6]"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleArchive(equipment);
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#c3c8c1] px-3 py-2 text-xs font-medium hover:bg-[#e2e4e6]"
                      >
                        <Archive size={14} />
                        Archive
                      </button>
                    </div>
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
            aria-labelledby="equipment-form-title"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#f5f6f3] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#c3c8c1] px-6 py-5 md:px-8">
              <div>
                <h2 id="equipment-form-title" className="text-xl font-semibold">
                  {editingEquipment ? "Edit Equipment" : "Add Equipment"}
                </h2>
                <p className="mt-1 text-sm text-[#7a7359]">
                  {editingEquipment
                    ? "Update equipment information."
                    : "Add equipment to your company inventory."}
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
              onSubmit={handleSave}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 md:px-8">
                {formError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Equipment Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          name: event.target.value,
                        }))
                      }
                      placeholder="e.g. Excavator"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Company *</label>
                    <select
                      required
                      value={form.companyId}
                      disabled={Boolean(editingEquipment)}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          companyId: event.target.value,
                        }))
                      }
                      className={`${inputClass} disabled:bg-[#e2e4e6]`}
                    >
                      <option value="">Select company</option>

                      {ownerMemberships.map((membership) => {
                        const companyId =
                          membership.companyId ?? membership.company?.id;

                        const companyName =
                          membership.companyName ??
                          membership.company?.name ??
                          `Company ${companyId}`;

                        return (
                          <option key={companyId} value={companyId}>
                            {companyName}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
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
                    <label className={labelClass}>Status *</label>
                    <select
                      required
                      value={form.status}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          status: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
                      placeholder="Describe the equipment..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Equipment Image</label>

                    <div className="grid gap-4 rounded-xl border border-dashed border-[#c3c8c1] bg-white p-4 sm:grid-cols-[180px_1fr]">
                      <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg bg-[#e2e4e6]">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Equipment preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImagePlus size={38} className="text-[#7a7359]" />
                        )}
                      </div>

                      <div className="flex flex-col justify-center gap-3">
                        <p className="text-sm text-[#7a7359]">
                          Upload a photo of your equipment. JPG, PNG, or WebP,
                          up to 5 MB.
                        </p>

                        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-[#c3c8c1] bg-[#f5f6f3] px-4 py-2.5 text-sm font-medium hover:bg-[#e2e4e6]">
                          <Upload size={16} />
                          {imagePreview ? "Change Image" : "Choose Image"}

                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            disabled={saving}
                            className="hidden"
                          />
                        </label>

                        {selectedFile && (
                          <p className="break-all text-xs text-[#7a7359]">
                            {selectedFile.name}
                          </p>
                        )}

                        {!selectedFile && imagePreview && (
                          <p className="flex items-center gap-1.5 text-xs text-[#7a7359]">
                            <CheckCircle2 size={14} />
                            Current equipment image
                          </p>
                        )}
                      </div>
                    </div>
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
                  disabled={saving}
                  className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-[#d4e14b] px-5 py-2.5 text-sm font-semibold hover:bg-[#c5d33c] disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingEquipment
                      ? "Save Changes"
                      : "Create Equipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipment;
