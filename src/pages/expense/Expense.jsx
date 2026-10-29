import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Receipt,
  Wallet,
  Archive,
  Pencil,
  Eye,
  X,
  LoaderCircle,
  AlertCircle,
  CalendarDays,
  Building2,
  UserRound,
  CheckCircle2,
} from "lucide-react";
import Client from "../../services/api";
import {
  GetAllExpenses,
  CreateExpense,
  UpdateExpense,
  ArchiveExpense,
} from "../../services/expense";
import ArqemioDateTimePicker from "../../components/ArqemioDateTimePicker";

const emptyForm = {
  projectId: "",
  title: "",
  amount: "",
  category: "",
  description: "",
  expenseDateTime: "",
};

const inputClass =
  "w-full rounded-xl border border-[#c3c8c1] bg-white px-4 py-3 text-sm text-[#35362c] outline-none focus:border-[#a9b82b]";

const labelClass = "mb-2 block text-sm font-medium text-[#35362c]";

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("en-BH", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} BHD`;

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

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [projectFilter, setProjectFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    setLoading(true);
    setError("");

    const [expenseResult, projectResult] = await Promise.allSettled([
      GetAllExpenses(),
      Client.get("/company/projects"),
    ]);

    if (expenseResult.status === "fulfilled") {
      setExpenses(
        Array.isArray(expenseResult.value) ? expenseResult.value : [],
      );
    } else {
      setError(
        getErrorMessage(expenseResult.reason, "Unable to load expenses."),
      );
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

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        !query ||
        [
          expense.title,
          expense.category,
          expense.projectName,
          expense.memberName,
          expense.description,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );

      const matchesStatus =
        statusFilter === "ALL" || expense.status === statusFilter;

      const matchesProject =
        projectFilter === "ALL" || String(expense.projectId) === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [expenses, search, statusFilter, projectFilter]);

  const activeExpenses = expenses.filter(
    (expense) => expense.status === "ACTIVE",
  );

  const totalAmount = activeExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0,
  );

  const archivedCount = expenses.filter(
    (expense) => expense.status === "ARCHIVED",
  ).length;

  const openCreate = () => {
    setEditingExpense(null);
    setViewingExpense(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditingExpense(expense);
    setViewingExpense(null);
    setForm({
      projectId: String(expense.projectId || ""),
      title: expense.title || "",
      amount: String(expense.amount ?? ""),
      category: expense.category || "",
      description: expense.description || "",
      expenseDateTime: expense.expenseDateTime
        ? expense.expenseDateTime.slice(0, 16)
        : "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingExpense(null);
    setFormError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError("");

    if (
      !form.projectId ||
      !form.title.trim() ||
      !form.category.trim() ||
      !form.expenseDateTime
    ) {
      setFormError("Please complete all required fields.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    const payload = {
      projectId: Number(form.projectId),
      title: form.title.trim(),
      amount,
      category: form.category.trim(),
      description: form.description.trim(),
      expenseDateTime: form.expenseDateTime,
    };

    setSaving(true);

    try {
      if (editingExpense) {
        await UpdateExpense(editingExpense.id, payload);
      } else {
        await CreateExpense(payload);
      }

      setModalOpen(false);
      setEditingExpense(null);
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to save expense."));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (expense) => {
    const confirmed = window.confirm(
      `Archive "${expense.title}"? This will change its status to ARCHIVED.`,
    );

    if (!confirmed) return;

    setArchiving(expense.id);
    setError("");

    try {
      await ArchiveExpense(expense.id);
      setViewingExpense(null);
      await loadData();
    } catch (error) {
      setError(getErrorMessage(error, "Unable to archive expense."));
    } finally {
      setArchiving(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#e2e4e6] px-5 py-6 text-[#35362c] md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#7a7359]">
              Financial Management
            </p>
            <h1 className="text-3xl font-semibold">Expenses</h1>
            <p className="mt-2 text-sm text-[#7a7359]">
              Track and manage construction project expenses.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-[#d4e14b] px-5 py-3 text-sm font-semibold transition-colors hover:bg-[#c5d33c]"
          >
            <Plus size={18} />
            New Expense
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
              label: "Total Active Expenses",
              value: formatMoney(totalAmount),
              icon: Wallet,
            },
            {
              label: "Active Records",
              value: activeExpenses.length,
              icon: Receipt,
            },
            {
              label: "Archived Records",
              value: archivedCount,
              icon: Archive,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-[#c3c8c1] bg-white p-5"
            >
              <div>
                <p className="text-sm text-[#7a7359]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
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
              placeholder="Search expenses..."
              className={`${inputClass} pl-11`}
            />
          </div>

          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className={`${inputClass} sm:w-52`}
          >
            <option value="ALL">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${inputClass} sm:w-44`}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderCircle size={28} className="animate-spin text-[#7a7359]" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="rounded-xl border border-[#c3c8c1] bg-white px-6 py-16 text-center">
            <Receipt size={42} className="mx-auto mb-4 text-[#7a7359]" />
            <h2 className="text-lg font-semibold">No expenses found</h2>
            <p className="mt-2 text-sm text-[#7a7359]">
              Create an expense or adjust your filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="rounded-xl border border-[#c3c8c1] bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-xl bg-[#e2e4e6] p-3">
                      <Receipt size={22} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        {expense.title}
                      </h2>
                      <p className="mt-1 text-xs text-[#7a7359]">
                        Expense #{expense.id}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      expense.status === "ACTIVE"
                        ? "bg-[#d4e14b]"
                        : "bg-[#e2e4e6]"
                    }`}
                  >
                    {expense.status}
                  </span>
                </div>

                <p className="mt-5 text-3xl font-semibold">
                  {formatMoney(expense.amount)}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-[#f3f4f0] p-4 text-sm">
                  <div>
                    <p className="text-xs text-[#7a7359]">Category</p>
                    <p className="mt-1 font-medium">{expense.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#7a7359]">Expense Date</p>
                    <p className="mt-1 font-medium">
                      {formatDate(expense.expenseDateTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#7a7359]">Project</p>
                    <p className="mt-1 font-medium">{expense.projectName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#7a7359]">Recorded By</p>
                    <p className="mt-1 font-medium">{expense.memberName}</p>
                  </div>
                </div>

                {expense.description && (
                  <p className="mt-4 line-clamp-2 text-sm text-[#7a7359]">
                    {expense.description}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e2e4e6] pt-4">
                  <button
                    type="button"
                    onClick={() => setViewingExpense(expense)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#c3c8c1] px-4 py-2.5 text-xs font-medium hover:bg-[#e2e4e6]"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  {expense.status === "ACTIVE" && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(expense)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#c3c8c1] px-4 py-2.5 text-xs font-medium hover:bg-[#e2e4e6]"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={archiving === expense.id}
                        onClick={() => handleArchive(expense)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Archive size={15} />
                        Archive
                      </button>
                    </>
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
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#f5f6f3] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#c3c8c1] px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingExpense ? "Edit Expense" : "New Expense"}
                </h2>
                <p className="mt-1 text-sm text-[#7a7359]">
                  {editingExpense
                    ? "Update the expense information."
                    : "Record a new project expense."}
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeModal}
                className="rounded-lg p-2 hover:bg-[#e2e4e6]"
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {formError && (
                  <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={17} />
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Project *</label>
                    <select
                      required
                      disabled={Boolean(editingExpense)}
                      value={form.projectId}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          projectId: event.target.value,
                        }))
                      }
                      className={`${inputClass} disabled:opacity-60`}
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
                    <label className={labelClass}>Category *</label>
                    <input
                      required
                      value={form.category}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          category: event.target.value,
                        }))
                      }
                      placeholder="e.g. Materials"
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Expense Title *</label>
                    <input
                      required
                      value={form.title}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          title: event.target.value,
                        }))
                      }
                      placeholder="e.g. Cement purchase"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Amount (BHD) *</label>
                    <input
                      type="number"
                      required
                      min="0.001"
                      step="0.001"
                      value={form.amount}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          amount: event.target.value,
                        }))
                      }
                      placeholder="0.000"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Expense Date *</label>
                    <ArqemioDateTimePicker
                      centered
                      required
                      value={form.expenseDateTime}
                      onChange={(value) =>
                        setForm((previous) => ({
                          ...previous,
                          expenseDateTime: value,
                        }))
                      }
                    />
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
                      placeholder="Additional expense details..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#c3c8c1] bg-white px-6 py-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeModal}
                  className="rounded-xl border border-[#c3c8c1] px-5 py-2.5 text-sm font-medium hover:bg-[#e2e4e6]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#d4e14b] px-5 py-2.5 text-sm font-semibold hover:bg-[#c5d33c] disabled:opacity-50"
                >
                  {saving && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {saving
                    ? "Saving..."
                    : editingExpense
                      ? "Save Changes"
                      : "Create Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl bg-[#f5f6f3] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#7a7359]">
                  Expense #{viewingExpense.id}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {viewingExpense.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="rounded-lg p-2 hover:bg-[#e2e4e6]"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-5 text-3xl font-semibold">
              {formatMoney(viewingExpense.amount)}
            </p>

            <div className="mt-5 space-y-4 rounded-xl bg-white p-5 text-sm">
              {[
                {
                  icon: Building2,
                  label: "Project",
                  value: viewingExpense.projectName,
                },
                {
                  icon: Receipt,
                  label: "Category",
                  value: viewingExpense.category,
                },
                {
                  icon: CalendarDays,
                  label: "Date",
                  value: formatDate(viewingExpense.expenseDateTime),
                },
                {
                  icon: UserRound,
                  label: "Recorded By",
                  value: viewingExpense.memberName,
                },
                {
                  icon: CheckCircle2,
                  label: "Status",
                  value: viewingExpense.status,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon size={18} className="mt-0.5 text-[#7a7359]" />
                  <div>
                    <p className="text-xs text-[#7a7359]">{item.label}</p>
                    <p className="mt-1 font-medium">{item.value || "—"}</p>
                  </div>
                </div>
              ))}

              {viewingExpense.description && (
                <div className="border-t border-[#e2e4e6] pt-4">
                  <p className="text-xs text-[#7a7359]">Description</p>
                  <p className="mt-2 whitespace-pre-wrap">
                    {viewingExpense.description}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewingExpense(null)}
              className="mt-5 w-full rounded-xl bg-[#d4e14b] px-5 py-3 text-sm font-semibold hover:bg-[#c5d33c]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
