import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GetCompanies, CreateCompany } from "../../services/Company";
import ErrorMessage from "../../components/ErrorMessage";

const Companies = () => {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    address: "",
  });

  const loadCompanies = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await GetCompanies();

      if (Array.isArray(data)) {
        setCompanies(data);
      } else {
        setCompanies([]);
        setError("The company list response was not recognized.");
      }
    } catch (err) {
      setCompanies([]);
      setError(err.response?.data?.message || "Unable to load companies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const data = await CreateCompany(form);

      setSuccess(data.message || "Company created successfully.");

      setShowForm(false);

      setForm({
        name: "",
        description: "",
        location: "",
        address: "",
      });

      await loadCompanies();
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to create company.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e2e4e6] px-5 py-8 text-[#35362c] md:px-12">
      <main className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/admin/dashboard")}
          className="mb-12 flex items-center gap-2 text-sm text-[#7a7359] hover:text-[#35362c]"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>

        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.15em] text-[#7a7359]">
              Platform Administration
            </p>

            <h1 className="text-4xl font-normal tracking-tight">Companies</h1>

            <p className="mt-3 text-sm text-[#7a7359]">
              Manage construction companies registered on Arqemio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError("");
              setSuccess("");
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-full bg-[#d4e14b] px-5 py-3 text-sm font-medium hover:brightness-95"
          >
            <Plus size={17} />
            New company
          </button>
        </div>

        {success && (
          <p
            role="status"
            className="mb-6 rounded-lg border border-[#c3c8c1] bg-white/70 px-4 py-3 text-sm"
          >
            {success}
          </p>
        )}

        <ErrorMessage message={error} />

        <section className="mt-6 overflow-hidden rounded-xl border border-[#c3c8c1] bg-white/75">
          <div className="grid grid-cols-[1fr_auto] border-b border-[#c3c8c1] px-6 py-5">
            <h2 className="text-base font-medium">Registered companies</h2>

            <span className="text-sm text-[#7a7359]">
              {companies.length}{" "}
              {companies.length === 1 ? "company" : "companies"}
            </span>
          </div>

          {loading ? (
            <p className="px-6 py-12 text-center text-sm text-[#7a7359]">
              Loading companies...
            </p>
          ) : error ? (
            <p className="px-6 py-12 text-center text-sm text-[#7a7359]">
              Company list unavailable.
            </p>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <Building2
                size={30}
                strokeWidth={1.5}
                className="mb-4 text-[#7a7359]"
              />

              <p className="font-medium">No companies to display</p>

              <p className="mt-2 text-sm text-[#7a7359]">
                Create your first company to get started.
              </p>
            </div>
          ) : (
            companies.map((company) => (
              <button
                key={company.companyId}
                type="button"
                onClick={() =>
                  navigate(`/admin/companies/${company.companyId}`)
                }
                className="flex w-full flex-wrap items-center justify-between gap-4 border-b border-[#c3c8c1] px-6 py-5 text-left transition-colors hover:bg-[#e2e4e6]/50 last:border-b-0"
              >
                <div>
                  <h3 className="font-medium">{company.name}</h3>

                  <p className="mt-1 text-sm text-[#7a7359]">
                    {company.location || "Location not specified"}
                  </p>

                  {company.description && (
                    <p className="mt-2 text-sm text-[#7a7359]">
                      {company.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="rounded-full border border-[#c3c8c1] px-3 py-1 text-xs">
                    {company.status || "—"}
                  </span>

                  <ArrowRight size={18} className="text-[#7a7359]" />
                </div>
              </button>
            ))
          )}
        </section>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-company-title"
            className="max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-[#f2f3f0] p-7 shadow-xl"
          >
            <div className="mb-7 flex items-start justify-between">
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-[#7a7359]">
                  Platform / Companies
                </p>

                <h2 id="create-company-title" className="text-2xl font-medium">
                  New company
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="text-[#7a7359] hover:text-[#35362c]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                {
                  name: "name",
                  label: "Company name",
                  required: true,
                },
                {
                  name: "description",
                  label: "Description",
                },
                {
                  name: "location",
                  label: "Location",
                },
                {
                  name: "address",
                  label: "Address",
                },
              ].map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="mb-2 block text-sm font-medium"
                  >
                    {field.label}
                  </label>

                  <input
                    id={field.name}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    required={field.required || false}
                    className="w-full rounded-lg border border-[#c3c8c1] bg-white px-4 py-3 text-sm outline-none focus:border-[#7a7359]"
                  />
                </div>
              ))}

              <ErrorMessage message={formError} />

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#d4e14b] py-3 text-sm font-medium hover:brightness-95 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create company"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
