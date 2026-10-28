import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  X,
  ArrowUpRight,
  MapPin,
  CalendarDays,
  FolderKanban,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateProject, GetProjects } from "../../services/project";
import { GetCompanies } from "../../services/Company";
import Client from "../../services/api";
import ErrorMessage from "../../components/ErrorMessage";

const initialForm = {
  companyId: "",
  name: "",
  description: "",
  location: "",
  startDate: "",
  expectedEndDate: "",
  budget: "",
  status: "PLANNED",
};

const Projects = () => {
  const navigate = useNavigate();

  const [memberships, setMemberships] = useState([]);
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const ownerCompanies = memberships.filter(
    (membership) =>
      membership.role === "OWNER" && membership.status === "ACTIVE",
  );

  const isOwner = ownerCompanies.length > 0;

  const availableCompanies = ownerCompanies.map((membership) => ({
    companyId: membership.companyId,
    name: membership.companyName,
  }));

  const loadProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await GetProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();

    const loadProfile = async () => {
      try {
        const response = await Client.get("/users/profile");
        setMemberships(response.data.memberships || []);
      } catch (err) {
        console.error("Unable to load profile", err);
      }
    };

    const loadCompanies = async () => {
      try {
        const data = await GetCompanies();
        setCompanies(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Unable to load companies", err);
      }
    };

    loadProfile();
    loadCompanies();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = [
      project.name,
      project.description,
      project.location,
      project.companyName,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );

    const matchesCompany =
      !companyFilter || String(project.companyId) === companyFilter;

    return matchesSearch && matchesCompany;
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!isOwner) {
      setFormError("Only company owners can create projects.");
      return;
    }

    const ownsSelectedCompany = ownerCompanies.some(
      (membership) => Number(membership.companyId) === Number(form.companyId),
    );

    if (!form.companyId || !ownsSelectedCompany) {
      setFormError("Please select a company you own.");
      return;
    }

    if (!form.name.trim()) {
      setFormError("Project name is required.");
      return;
    }

    if (!form.startDate || !form.expectedEndDate) {
      setFormError("Please select both project dates.");
      return;
    }

    if (form.expectedEndDate < form.startDate) {
      setFormError("Expected end date cannot be before the start date.");
      return;
    }

    if (form.budget === "" || Number(form.budget) < 0) {
      setFormError("Please enter a valid budget.");
      return;
    }

    setSaving(true);

    try {
      await CreateProject({
        companyId: Number(form.companyId),
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        startDate: form.startDate,
        expectedEndDate: form.expectedEndDate,
        budget: Number(form.budget),
        status: form.status,
      });

      setShowModal(false);
      setForm(initialForm);
      setSuccess("Project created successfully.");
      await loadProjects();
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to create project.");
    } finally {
      setSaving(false);
    }
  };

  const openModal = () => {
    if (!isOwner) return;

    setForm(initialForm);
    setFormError("");
    setSuccess("");
    setShowModal(true);
  };

  const inputClass =
    "w-full rounded-lg border border-[#c3c8c1] bg-white px-4 py-3 text-sm outline-none focus:border-[#7a7359]";

  return (
    <div className="min-h-screen bg-[#e2e4e6] px-5 py-8 text-[#35362c] md:px-12">
      <main className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.15em] text-[#7a7359]">
              Workspace / Projects
            </p>

            <h1 className="text-4xl font-normal tracking-tight">Projects</h1>

            <p className="mt-3 text-sm text-[#7a7359]">
              Manage your construction projects in one place.
            </p>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={openModal}
              className="flex items-center gap-2 rounded-lg bg-[#d4e14b] px-5 py-3 text-sm font-medium transition hover:brightness-95"
            >
              <Plus size={17} />
              New project
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

        <div className="mb-7 flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7359]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-lg border border-[#c3c8c1] bg-white/75 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#7a7359]"
            />
          </div>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="rounded-lg border border-[#c3c8c1] bg-white/75 px-4 py-3 text-sm outline-none"
          >
            <option value="">All companies</option>

            {[
              ...new Map(
                projects.map((project) => [
                  project.companyId,
                  {
                    companyId: project.companyId,
                    name: project.companyName,
                  },
                ]),
              ).values(),
            ].map((company) => (
              <option key={company.companyId} value={company.companyId}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-[#7a7359]">Loading projects...</p>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-xl border border-[#c3c8c1] bg-white/70 px-6 py-16 text-center">
            <FolderKanban size={35} className="mx-auto mb-4 text-[#7a7359]" />

            <h2 className="text-lg font-medium">No projects found</h2>

            <p className="mt-2 text-sm text-[#7a7359]">
              {search || companyFilter
                ? "Try adjusting your search or filters."
                : "Your projects will appear here once created."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-5 text-xs uppercase tracking-wider text-[#7a7359]">
              {filteredProjects.length} projects
            </p>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <button
                  key={project.projectId ?? project.id}
                  type="button"
                  onClick={() =>
                    navigate(`/projects/${project.projectId ?? project.id}`)
                  }
                  className="group rounded-xl border border-[#c3c8c1] bg-white/75 p-6 text-left transition hover:border-[#7a7359] hover:bg-white"
                >
                  <div className="mb-7 flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e2e4e6]">
                      <FolderKanban size={21} />
                    </div>

                    <ArrowUpRight
                      size={19}
                      className="text-[#7a7359] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>

                  <p className="mb-2 text-xs uppercase tracking-wider text-[#7a7359]">
                    {project.companyName}
                  </p>

                  <h2 className="mb-3 text-xl font-medium">{project.name}</h2>

                  <p className="mb-6 line-clamp-2 min-h-10 text-sm leading-6 text-[#7a7359]">
                    {project.description || "No description provided."}
                  </p>

                  <div className="space-y-3 border-t border-[#c3c8c1] pt-5">
                    <div className="flex items-center gap-2 text-sm text-[#7a7359]">
                      <MapPin size={15} />
                      {project.location || "Not provided"}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#7a7359]">
                      <CalendarDays size={15} />
                      {project.expectedEndDate || "No end date"}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">
                        {project.budget != null
                          ? `${Number(project.budget).toLocaleString()} BHD`
                          : "No budget"}
                      </span>

                      <span className="rounded-full bg-[#e2e4e6] px-3 py-1 text-xs">
                        {project.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {isOwner && showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !saving) {
                setShowModal(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-project-title"
              className="max-h-full w-full max-w-xl overflow-y-auto rounded-xl bg-[#e2e4e6] p-6 shadow-xl md:max-w-2xl md:p-8 lg:max-w-4xl"
            >
              <div className="mb-7 flex items-start justify-between">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-[#7a7359]">
                    Project Management
                  </p>

                  <h2
                    id="create-project-title"
                    className="text-2xl font-medium"
                  >
                    Create new project
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

              <form onSubmit={handleCreate} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Company
                    </label>

                    <select
                      name="companyId"
                      value={form.companyId}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">Select company</option>

                      {availableCompanies.map((company) => (
                        <option
                          key={company.companyId ?? company.id}
                          value={company.companyId ?? company.id}
                        >
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Project name
                    </label>

                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Enter project name"
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
                      rows={3}
                      className={inputClass}
                      placeholder="Describe the project"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Location
                    </label>

                    <input
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="Project location"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Start date
                    </label>

                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Expected end date
                    </label>

                    <input
                      type="date"
                      name="expectedEndDate"
                      value={form.expectedEndDate}
                      onChange={handleChange}
                      min={form.startDate || undefined}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Budget (BHD)
                    </label>

                    <input
                      type="number"
                      name="budget"
                      value={form.budget}
                      onChange={handleChange}
                      min="0"
                      step="0.001"
                      required
                      className={inputClass}
                      placeholder="0.000"
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
                      className={inputClass}
                    >
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ON_HOLD">On hold</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-[#7a7359]">
                  You must be an active company owner to create a project.
                </p>

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
                    disabled={saving || availableCompanies.length === 0}
                    className="rounded-lg bg-[#d4e14b] px-6 py-3 text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create project"}
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

export default Projects;
