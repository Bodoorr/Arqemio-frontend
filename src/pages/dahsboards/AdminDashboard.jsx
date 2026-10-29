import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Mail,
  MapPin,
  X,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  CreateCompany,
  GetCompanies,
  InviteCompanyOwner,
} from "../../services/company";
import { toast } from "sonner";

const emptyCompany = {
  name: "",
  description: "",
  location: "",
  address: "",
};

const AdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [inviteForm, setInviteForm] = useState({
    companyId: "",
    email: "",
  });
  const [message, setMessage] = useState("");

  const loadCompanies = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await GetCompanies();
      const list = Array.isArray(data)
        ? data
        : data?.content || data?.companies;

      if (!Array.isArray(list)) {
        throw new Error("Unexpected companies response.");
      }

      setCompanies(list);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load companies.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setCompanyForm(emptyCompany);
    setInviteForm({ companyId: "", email: "" });
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const company = await CreateCompany(companyForm);

      toast.success("Company created successfully.");
      setModal(null);
      setCompanyForm(emptyCompany);

      if (company?.companyId) {
        setInviteForm({
          companyId: String(company.companyId),
          email: "",
        });
      }

      await loadCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to create company.");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteOwner = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await InviteCompanyOwner({
        companyId: Number(inviteForm.companyId),
        email: inviteForm.email.trim(),
        role: "OWNER",
      });

      toast.success("Owner invitation sent successfully.");
      setModal(null);
      setInviteForm({ companyId: "", email: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to send invitation.");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = companies.filter(
    (company) => company.status === "ACTIVE",
  ).length;

  const ownerCount = companies.filter(
    (company) => company.ownerId != null,
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-7 text-[#35362c]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#8b8d80]">
            Platform Administration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Overview
          </h1>
          <p className="mt-2 text-sm text-[#858779]">
            Manage companies and their ownership in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMessage("");
            setModal("create");
          }}
          className="flex items-center gap-2 rounded-xl bg-[#d4e14b] px-5 py-3 text-sm font-semibold transition hover:bg-[#c6d23f]"
        >
          <Plus size={18} />
          New Company
        </button>
      </div>

      {message && (
        <div
          role="status"
          className="rounded-xl border border-[#e2e4e6] bg-white px-4 py-3 text-sm"
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Companies", value: companies.length },
          { label: "Active Companies", value: activeCount },
          { label: "Companies with Owners", value: ownerCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#ebede7] bg-white px-6 py-5"
          >
            <p className="text-sm text-[#858779]">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {loading || error ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#ebede7] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eff0eb] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">Companies</h2>
            <p className="mt-1 text-xs text-[#858779]">
              Your registered construction companies
            </p>
          </div>

          <button
            type="button"
            onClick={loadCompanies}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#62665d] hover:bg-[#f5f6f3] disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-[#858779]">
            Loading companies...
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={loadCompanies}
              className="mt-4 text-sm font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-[#f1f4d4] p-4">
              <Building2 size={27} />
            </div>
            <h3 className="mt-5 font-semibold">No companies yet</h3>
            <p className="mt-2 text-sm text-[#858779]">
              Create your first company to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#eff0eb]">
            {companies.map((company) => {
              const id = company.companyId ?? company.id;

              return (
                <div
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition hover:bg-[#fafbf8]"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f1f4d4]">
                      <Building2 size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{company.name}</h3>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#858779]">
                        {company.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {company.location}
                          </span>
                        )}
                        <span>{company.ownerName || "No owner assigned"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-[#f1f4d4] px-3 py-1 text-xs font-medium">
                      {company.status || "Unknown"}
                    </span>

                    {!company.ownerId && (
                      <button
                        type="button"
                        onClick={() => {
                          setMessage("");
                          setInviteForm({
                            companyId: String(id),
                            email: "",
                          });
                          setModal("invite");
                        }}
                        className="flex items-center gap-2 text-sm font-semibold hover:opacity-70"
                      >
                        <Mail size={16} />
                        Invite Owner
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#20221b]/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="admin-modal-title"
                  className="text-2xl font-semibold tracking-tight"
                >
                  {modal === "create"
                    ? "Create Company"
                    : "Invite Company Owner"}
                </h2>
                <p className="mt-2 text-sm text-[#858779]">
                  {modal === "create"
                    ? "Add a new company to Arqemio."
                    : "Send an invitation to the company's owner."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="rounded-lg p-2 hover:bg-[#f5f6f3]"
              >
                <X size={20} />
              </button>
            </div>

            {modal === "create" ? (
              <form onSubmit={handleCreateCompany} className="space-y-4">
                {[
                  { name: "name", label: "Company Name", required: true },
                  { name: "description", label: "Description" },
                  { name: "location", label: "Location" },
                  { name: "address", label: "Address" },
                ].map((field) => (
                  <label key={field.name} className="block">
                    <span className="mb-2 block text-sm font-medium">
                      {field.label}
                    </span>
                    <input
                      required={field.required}
                      value={companyForm[field.name]}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[#e2e4e6] bg-[#fafbf8] px-4 py-3 text-sm outline-none focus:border-[#aab850]"
                    />
                  </label>
                ))}

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-3 w-full rounded-xl bg-[#d4e14b] py-3 font-semibold disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Company"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleInviteOwner} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Company
                  </span>
                  <select
                    required
                    value={inviteForm.companyId}
                    onChange={(e) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        companyId: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#e2e4e6] bg-[#fafbf8] px-4 py-3 text-sm"
                  >
                    <option value="">Select company</option>
                    {companies.map((company) => (
                      <option
                        key={company.companyId ?? company.id}
                        value={company.companyId ?? company.id}
                      >
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Owner Email
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="owner@example.com"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#e2e4e6] bg-[#fafbf8] px-4 py-3 text-sm outline-none focus:border-[#aab850]"
                  />
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-3 w-full rounded-xl bg-[#d4e14b] py-3 font-semibold disabled:opacity-50"
                >
                  {saving ? "Sending..." : "Send Invitation"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
