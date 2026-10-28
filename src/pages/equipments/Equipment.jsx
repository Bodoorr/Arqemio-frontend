import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  X,
  Pencil,
  Archive,
  Package,
  Building2,
  Boxes,
} from "lucide-react";
import Client from "../../services/api";
import {
  GetAllEquipments,
  CreateEquipment,
  UpdateEquipment,
  ArchiveEquipment,
} from "../../services/equipment";
import ErrorMessage from "../../components/ErrorMessage";

const initialForm = {
  companyId: "",
  name: "",
  description: "",
  imageUrl: "",
  status: "AVAILABLE",
  quantity: 1,
};

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const Equipment = () => {
  const [equipments, setEquipments] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [archivingId, setArchivingId] = useState(null);

  const ownerCompanies = memberships.filter(
    (membership) =>
      membership.role === "OWNER" && membership.status === "ACTIVE",
  );

  const availableCompanies = ownerCompanies.map((membership) => ({
    companyId: membership.companyId,
    name: membership.companyName,
  }));

  const canManage = (companyId) =>
    ownerCompanies.some(
      (membership) => Number(membership.companyId) === Number(companyId),
    );

  const loadEquipment = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await GetAllEquipments();
      setEquipments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load equipment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();

    const loadProfile = async () => {
      try {
        const response = await Client.get("/users/profile");
        setMemberships(response.data.memberships || []);
      } catch (err) {
        console.error("Unable to load profile", err);
      }
    };

    loadProfile();
  }, []);

  const activeEquipments = equipments.filter(
    (equipment) => equipment.status !== "ARCHIVED",
  );

  const filteredEquipments = activeEquipments.filter((equipment) => {
    const matchesSearch = [
      equipment.name,
      equipment.description,
      equipment.companyName,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );

    const matchesCompany =
      !companyFilter || String(equipment.companyId) === companyFilter;

    const matchesStatus = !statusFilter || equipment.status === statusFilter;

    return matchesSearch && matchesCompany && matchesStatus;
  });

  const statuses = [
    ...new Set(
      activeEquipments.map((equipment) => equipment.status).filter(Boolean),
    ),
  ];

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...initialForm,
      companyId:
        availableCompanies.length === 1
          ? String(availableCompanies[0].companyId)
          : "",
    });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (equipment) => {
    setEditing(equipment);
    setForm({
      companyId: String(equipment.companyId),
      name: equipment.name || "",
      description: equipment.description || "",
      imageUrl: equipment.imageUrl || "",
      status: equipment.status || "AVAILABLE",
      quantity: equipment.quantity,
    });
    setFormError("");
    setShowModal(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!canManage(form.companyId)) {
      setFormError("You must own the selected company.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Equipment name is required.");
      return;
    }

    if (!form.status.trim()) {
      setFormError("Equipment status is required.");
      return;
    }

    if (
      !Number.isInteger(Number(form.quantity)) ||
      Number(form.quantity) <= 0
    ) {
      setFormError("Quantity must be a positive whole number.");
      return;
    }

    const payload = {
      companyId: Number(form.companyId),
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      status: form.status.trim(),
      quantity: Number(form.quantity),
    };

    setSaving(true);

    try {
      if (editing) {
        const updated = await UpdateEquipment(editing.id, payload);
        setEquipments((previous) =>
          previous.map((equipment) =>
            equipment.id === editing.id ? updated : equipment,
          ),
        );
        setSuccess("Equipment updated successfully.");
      } else {
        const created = await CreateEquipment(payload);
        setEquipments((previous) => [created, ...previous]);
        setSuccess("Equipment created successfully.");
      }

      setShowModal(false);
      setEditing(null);
      setForm(initialForm);
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to save equipment.");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (equipment) => {
    if (!window.confirm(`Archive "${equipment.name}"?`)) return;

    setArchivingId(equipment.id);
    setError("");

    try {
      const archived = await ArchiveEquipment(equipment.id);
      setEquipments((previous) =>
        previous.map((item) => (item.id === equipment.id ? archived : item)),
      );
      setSuccess("Equipment archived successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to archive equipment.");
    } finally {
      setArchivingId(null);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#c3c8c1] bg-white px-4 py-3 text-sm outline-none focus:border-[#7a7359]";

  return (
    <div className="min-h-screen bg-[#e2e4e6] px-5 py-8 text-[#35362c] md:px-12">
      <main className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.15em] text-[#7a7359]">
              Workspace / Equipment
            </p>
            <h1 className="text-4xl font-normal tracking-tight">Equipment</h1>
            <p className="mt-3 text-sm text-[#7a7359]">
              Manage your company's construction equipment.
            </p>
          </div>

          {availableCompanies.length > 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-[#d4e14b] px-5 py-3 text-sm font-medium transition hover:brightness-95"
            >
              <Plus size={17} />
              Add Equipment
            </button>
          )}
        </div>

        {success && (
          <p
            role="status"
            className="mb-6 rounded-lg border border-[#c3c8c1] bg-white/75 px-5 py-4 text-sm"
          >
            {success}
          </p>
        )}

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        <div className="mb-7 flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7359]"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search equipment..."
              className="w-full rounded-lg border border-[#c3c8c1] bg-white/75 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#7a7359]"
            />
          </div>

          <select
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            className={inputClass + " w-auto"}
          >
            <option value="">All companies</option>
            {[
              ...new Map(
                equipments.map((equipment) => [
                  equipment.companyId,
                  {
                    id: equipment.companyId,
                    name: equipment.companyName,
                  },
                ]),
              ).values(),
            ].map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={inputClass + " w-auto"}
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {label(status)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-[#7a7359]">Loading equipment...</p>
        ) : filteredEquipments.length === 0 ? (
          <div className="rounded-xl border border-[#c3c8c1] bg-white/70 px-6 py-16 text-center">
            <Package size={35} className="mx-auto mb-4 text-[#7a7359]" />
            <h2 className="text-lg font-medium">No equipment found</h2>
            <p className="mt-2 text-sm text-[#7a7359]">
              {search || companyFilter || statusFilter
                ? "Try adjusting your filters."
                : "Equipment will appear here once added."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-5 text-xs uppercase tracking-wider text-[#7a7359]">
              {filteredEquipments.length} equipment items
            </p>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredEquipments.map((equipment) => (
                <div
                  key={equipment.id}
                  className="overflow-hidden rounded-xl border border-[#c3c8c1] bg-white/75 transition hover:border-[#7a7359] hover:bg-white"
                >
                  <div className="flex h-44 items-center justify-center bg-[#f0f1ed]">
                    {equipment.imageUrl ? (
                      <img
                        src={equipment.imageUrl}
                        alt={equipment.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package size={46} className="text-[#a5aa9e]" />
                    )}
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="mb-1 flex items-center gap-1 text-xs text-[#7a7359]">
                          <Building2 size={13} />
                          {equipment.companyName}
                        </p>
                        <h2 className="truncate text-xl font-medium">
                          {equipment.name}
                        </h2>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#e2e4e6] px-3 py-1 text-xs">
                        {label(equipment.status)}
                      </span>
                    </div>

                    <p className="mb-5 line-clamp-2 min-h-10 text-sm leading-5 text-[#7a7359]">
                      {equipment.description || "No description provided."}
                    </p>

                    <div className="flex items-center gap-2 border-t border-[#c3c8c1] pt-4 text-sm">
                      <Boxes size={16} />
                      Quantity: {equipment.quantity}
                    </div>

                    {canManage(equipment.companyId) && (
                      <div className="mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(equipment)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#c3c8c1] px-3 py-2.5 text-sm transition hover:bg-[#e2e4e6]"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={archivingId === equipment.id}
                          onClick={() => handleArchive(equipment)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#c3c8c1] px-3 py-2.5 text-sm transition hover:bg-[#f5e9e9] disabled:opacity-50"
                        >
                          <Archive size={15} />
                          {archivingId === equipment.id
                            ? "Archiving..."
                            : "Archive"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) {
                setShowModal(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="equipment-modal-title"
              className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl bg-[#e2e4e6] p-6 shadow-xl md:p-8"
            >
              <div className="mb-7 flex items-start justify-between">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-[#7a7359]">
                    Equipment Management
                  </p>
                  <h2
                    id="equipment-modal-title"
                    className="text-2xl font-medium"
                  >
                    {editing ? "Edit Equipment" : "Add Equipment"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  aria-label="Close"
                >
                  <X size={21} />
                </button>
              </div>

              {formError && (
                <div className="mb-5">
                  <ErrorMessage message={formError} />
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Company
                    </label>
                    <select
                      name="companyId"
                      value={form.companyId}
                      onChange={handleChange}
                      disabled={!!editing}
                      required
                      className={inputClass}
                    >
                      <option value="">Select company</option>
                      {availableCompanies.map((company) => (
                        <option
                          key={company.companyId}
                          value={company.companyId}
                        >
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Equipment Name
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="e.g. Excavator"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Status
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      {[
                        ...new Set(["AVAILABLE", ...statuses, form.status]),
                      ].map((status) => (
                        <option key={status} value={status}>
                          {label(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Image URL
                    </label>
                    <input
                      type="url"
                      name="imageUrl"
                      value={form.imageUrl}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="https://example.com/equipment.jpg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={4}
                      className={inputClass}
                      placeholder="Describe the equipment..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-[#c3c8c1] pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                    className="rounded-lg border border-[#c3c8c1] px-5 py-3 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[#d4e14b] px-6 py-3 text-sm font-medium disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editing
                        ? "Save Changes"
                        : "Add Equipment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Equipment;
