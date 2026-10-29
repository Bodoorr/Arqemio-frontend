import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Receipt,
  Wallet,
  Archive,
  Pencil,
  X,
  LoaderCircle,
  CalendarDays,
  Building2,
  UserRound,
  CheckCircle2,
  ImagePlus,
  ExternalLink,
} from "lucide-react";

import Client from "../../services/api";
import {
  GetAllExpenses,
  CreateExpense,
  UpdateExpense,
  ArchiveExpense,
} from "../../services/expense";
import {
  UploadExpenseAttachment,
  GetExpenseAttachments,
} from "../../services/attachment";
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
  "w-full rounded-xl border border-[#c3c8c1] bg-white px-4 py-3 text-sm outline-none focus:border-[#a9b82b]";
const labelClass = "mb-2 block text-sm font-medium";
const buttonClass = "rounded-xl px-5 py-2.5 text-sm font-medium";

const money = (value) => `${Number(value || 0).toFixed(3)} BHD`;

const date = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const errorText = (error) => {
  const data = error.response?.data;
  return (
    (typeof data === "string" ? data : data?.message) ||
    error.message ||
    "Something went wrong."
  );
};

export default function Expenses() {
  const [searchParams] = useSearchParams();

  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [projectFilter, setProjectFilter] = useState(
    searchParams.get("projectId") || "ALL",
  );

  const [form, setForm] = useState({ ...emptyForm });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);

  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [savedExpenseId, setSavedExpenseId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Automatically filter expenses by project from the URL
  useEffect(() => {
    setProjectFilter(searchParams.get("projectId") || "ALL");
  }, [searchParams]);

  useEffect(() => {
    if (!receipt) {
      setReceiptPreview("");
      return;
    }

    const url = URL.createObjectURL(receipt);
    setReceiptPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [receipt]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      GetAllExpenses(),
      Client.get("/company/projects"),
    ]);

    if (results[0].status === "fulfilled") {
      setExpenses(Array.isArray(results[0].value) ? results[0].value : []);
    } else {
      setError(errorText(results[0].reason));
    }

    if (results[1].status === "fulfilled") {
      setProjects(
        Array.isArray(results[1].value.data) ? results[1].value.data : [],
      );
    } else {
      setError((previous) => `${previous} Unable to load projects.`.trim());
    }

    setLoading(false);
  };

  const activeExpenses = expenses.filter(
    (expense) => expense.status === "ACTIVE",
  );
  const archivedExpenses = expenses.filter(
    (expense) => expense.status === "ARCHIVED",
  );

  const totalAmount = activeExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0,
  );

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = [
      expense.title,
      expense.category,
      expense.projectName,
      expense.memberName,
      expense.description,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );

    const matchesStatus =
      statusFilter === "ALL" || expense.status === statusFilter;
    const matchesProject =
      projectFilter === "ALL" || String(expense.projectId) === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const openCreate = () => {
    setForm({
      ...emptyForm,
      projectId: projectFilter === "ALL" ? "" : projectFilter,
    });
    setEditingExpense(null);
    setReceipt(null);
    setSavedExpenseId(null);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setViewingExpense(null);
    setEditingExpense(expense);
    setReceipt(null);
    setSavedExpenseId(null);
    setFormError("");

    setForm({
      projectId: String(expense.projectId),
      title: expense.title || "",
      amount: String(expense.amount),
      category: expense.category || "",
      description: expense.description || "",
      expenseDateTime: expense.expenseDateTime?.slice(0, 16) || "",
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingExpense(null);
    setReceipt(null);
    setSavedExpenseId(null);
    setFormError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      projectId: Number(form.projectId),
      title: form.title.trim(),
      amount,
      category: form.category.trim(),
      description: form.description.trim(),
      expenseDateTime: form.expenseDateTime,
    };

    try {
      let savedExpense;

      if (savedExpenseId) {
        savedExpense = {
          id: savedExpenseId,
          projectId: payload.projectId,
        };
      } else if (editingExpense) {
        savedExpense = await UpdateExpense(editingExpense.id, payload);
      } else {
        savedExpense = await CreateExpense(payload);
      }

      const id = savedExpense?.id || editingExpense?.id;

      if (receipt) {
        try {
          await UploadExpenseAttachment(
            receipt,
            savedExpense?.projectId || payload.projectId,
            id,
          );
        } catch (uploadError) {
          setSavedExpenseId(id);
          setFormError(
            "Expense saved, but receipt upload failed: " +
              errorText(uploadError),
          );
          await loadData();
          return;
        }
      }

      setModalOpen(false);
      setEditingExpense(null);
      setReceipt(null);
      setSavedExpenseId(null);
      setForm({ ...emptyForm });
      await loadData();
    } catch (error) {
      setFormError(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (expense) => {
    if (!window.confirm(`Archive "${expense.title}"?`)) return;

    setArchiving(expense.id);

    try {
      await ArchiveExpense(expense.id);
      setViewingExpense(null);
      await loadData();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setArchiving(null);
    }
  };

  const openDetails = async (expense) => {
    setViewingExpense(expense);
    setAttachments([]);
    setAttachmentError("");
    setAttachmentLoading(true);

    try {
      const data = await GetExpenseAttachments(expense.id);
      setAttachments(Array.isArray(data) ? data : []);
    } catch (error) {
      setAttachmentError(errorText(error));
    } finally {
      setAttachmentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent px-5 py-6 text-[#35362c] md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#7a7359]">
              Financial Management
            </p>
            <h1 className="mt-1 text-3xl font-semibold">Expenses</h1>
            <p className="mt-2 text-sm text-[#7a7359]">
              Track and manage construction project expenses.
            </p>
          </div>

          <button
            onClick={openCreate}
            className={`${buttonClass} flex items-center gap-2 bg-[#d4e14b]`}
          >
            <Plus size={18} /> New Expense
          </button>
        </div>

        {error && (
          <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Total Active Expenses", money(totalAmount), Wallet],
            ["Active Records", activeExpenses.length, Receipt],
            ["Archived Records", archivedExpenses.length, Archive],
          ].map(([label, value, Icon]) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-[#c3c8c1] bg-white p-5"
            >
              <div>
                <p className="text-sm text-[#7a7359]">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </div>
              <Icon size={22} />
            </div>
          ))}
        </div>

        {/* Filters */}
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

        {/* Expense Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderCircle className="animate-spin" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="rounded-xl bg-white p-16 text-center text-[#7a7359]">
            No expenses found.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                role="button"
                tabIndex={0}
                onClick={() => openDetails(expense)}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    openDetails(expense);
                  }
                }}
                className="cursor-pointer rounded-xl border border-[#c3c8c1] bg-white p-5 transition-all hover:-translate-y-1 hover:border-[#a9b82b] hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#e2e4e6] p-3">
                      <Receipt size={22} />
                    </div>
                    <div>
                      <h2 className="font-semibold">{expense.title}</h2>
                      <p className="text-xs text-[#7a7359]">
                        Expense #{expense.id}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#e2e4e6] px-3 py-1 text-xs">
                    {expense.status}
                  </span>
                </div>

                <p className="my-5 text-3xl font-semibold">
                  {money(expense.amount)}
                </p>

                <div className="grid grid-cols-2 gap-4 rounded-lg bg-[#f3f4f0] p-4 text-sm">
                  {[
                    ["Category", expense.category],
                    ["Expense Date", date(expense.expenseDateTime)],
                    ["Project", expense.projectName],
                    ["Recorded By", expense.memberName],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-[#7a7359]">{label}</p>
                      <p className="mt-1 font-medium">{value || "—"}</p>
                    </div>
                  ))}
                </div>

                {expense.description && (
                  <p className="mt-4 line-clamp-2 text-sm text-[#7a7359]">
                    {expense.description}
                  </p>
                )}

                {expense.status === "ACTIVE" && (
                  <div
                    className="mt-5 flex gap-2 border-t border-[#e2e4e6] pt-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      onClick={() => openEdit(expense)}
                      className={`${buttonClass} flex flex-1 items-center justify-center gap-2 border border-[#c3c8c1]`}
                    >
                      <Pencil size={15} /> Edit
                    </button>
                    <button
                      disabled={archiving === expense.id}
                      onClick={() => handleArchive(expense)}
                      className={`${buttonClass} flex flex-1 items-center justify-center gap-2 border border-red-200 text-red-700 disabled:opacity-50`}
                    >
                      <Archive size={15} /> Archive
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#f5f6f3] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingExpense ? "Edit Expense" : "New Expense"}
              </h2>
              <button onClick={closeModal} disabled={saving}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              {formError && (
                <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Project *</label>
                  <select
                    required
                    disabled={
                      Boolean(editingExpense) || Boolean(savedExpenseId)
                    }
                    value={form.projectId}
                    onChange={(event) =>
                      updateForm("projectId", event.target.value)
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
                  <label className={labelClass}>Category *</label>
                  <input
                    required
                    disabled={Boolean(savedExpenseId)}
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                    placeholder="e.g. Materials"
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Expense Title *</label>
                  <input
                    required
                    disabled={Boolean(savedExpenseId)}
                    value={form.title}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
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
                    disabled={Boolean(savedExpenseId)}
                    value={form.amount}
                    onChange={(event) =>
                      updateForm("amount", event.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Expense Date *</label>
                  <ArqemioDateTimePicker
                    centered
                    required
                    value={form.expenseDateTime}
                    onChange={(value) => updateForm("expenseDateTime", value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea
                    rows={3}
                    disabled={Boolean(savedExpenseId)}
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Receipt / Invoice Image</label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c3c8c1] bg-white p-6">
                    <ImagePlus size={28} className="mb-2 text-[#7a7359]" />
                    <span className="text-sm">
                      {receipt?.name || "Click to upload receipt"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        setReceipt(event.target.files?.[0] || null)
                      }
                    />
                  </label>

                  {receiptPreview && (
                    <div className="mt-4 flex justify-center">
                      <div className="relative rounded-xl border bg-white p-3">
                        <img
                          src={receiptPreview}
                          alt="Receipt preview"
                          className="max-h-56 max-w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setReceipt(null)}
                          disabled={saving}
                          className="absolute right-2 top-2 rounded-full bg-white p-1 shadow"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className={`${buttonClass} border bg-white`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`${buttonClass} bg-[#d4e14b] disabled:opacity-50`}
                >
                  {saving
                    ? "Saving..."
                    : savedExpenseId
                      ? "Retry Receipt Upload"
                      : editingExpense
                        ? "Save Changes"
                        : "Create Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Details Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-[#f5f6f3] p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#7a7359]">
                  Expense Details · #{viewingExpense.id}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {viewingExpense.title}
                </h2>
              </div>
              <button
                onClick={() => setViewingExpense(null)}
                className="rounded-lg p-1.5 hover:bg-[#e2e4e6]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#d4e14b] px-5 py-3">
              <span className="text-sm font-medium">Expense Amount</span>
              <span className="text-2xl font-semibold">
                {money(viewingExpense.amount)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-white p-4 text-sm md:grid-cols-3">
              {[
                [Building2, "Project", viewingExpense.projectName],
                [Receipt, "Category", viewingExpense.category],
                [
                  CalendarDays,
                  "Expense Date",
                  date(viewingExpense.expenseDateTime),
                ],
                [UserRound, "Recorded By", viewingExpense.memberName],
                [CheckCircle2, "Status", viewingExpense.status],
              ].map(([Icon, label, value]) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="rounded-lg bg-[#e2e4e6] p-2">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#7a7359]">{label}</p>
                    <p className="truncate font-medium">{value || "—"}</p>
                  </div>
                </div>
              ))}

              <div className="col-span-2 border-t border-[#e2e4e6] pt-3 md:col-span-3">
                <p className="font-semibold">Description</p>
                <p className="mt-1 whitespace-pre-wrap text-[#7a7359]">
                  {viewingExpense.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ImagePlus size={17} /> Receipts & Attachments
              </h3>

              {attachmentLoading ? (
                <p className="text-sm text-[#7a7359]">Loading receipts...</p>
              ) : attachmentError ? (
                <p className="text-sm text-red-700">{attachmentError}</p>
              ) : attachments.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-[#7a7359]">
                  No receipts uploaded.
                </p>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  {attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full max-w-[220px] overflow-hidden rounded-lg border border-[#c3c8c1] hover:shadow-md"
                    >
                      <div className="flex h-36 items-center justify-center bg-[#f5f6f3] p-2">
                        <img
                          src={attachment.fileUrl}
                          alt={attachment.fileName || "Receipt"}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
                        <span className="truncate text-xs">
                          {attachment.fileName}
                        </span>
                        <ExternalLink size={13} />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setViewingExpense(null)}
                className={`${buttonClass} border bg-white`}
              >
                Close
              </button>

              {viewingExpense.status === "ACTIVE" && (
                <button
                  onClick={() => openEdit(viewingExpense)}
                  className={`${buttonClass} flex items-center gap-2 bg-[#d4e14b]`}
                >
                  <Pencil size={15} /> Edit Expense
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
