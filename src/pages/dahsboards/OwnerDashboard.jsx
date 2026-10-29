import { useEffect, useState } from "react";
import {
  Building2,
  FolderKanban,
  Users,
  Mail,
  ArrowRight,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import Client, { errorText } from "../../services/api";

const OwnerDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [profileResponse, projectsResponse] = await Promise.all([
        Client.get("/users/profile"),
        Client.get("/company/projects"),
      ]);

      setProfile(profileResponse.data);
      setProjects(
        Array.isArray(projectsResponse.data) ? projectsResponse.data : [],
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const membership =
    profile?.memberships?.find(
      (item) => item.role === "OWNER" && item.status === "ACTIVE",
    ) || profile?.memberships?.find((item) => item.role === "OWNER");

  const companyProjects = membership
    ? projects.filter(
        (project) => String(project.companyId) === String(membership.companyId),
      )
    : [];

  const activeProjects = companyProjects.filter(
    (project) =>
      !["COMPLETED", "ARCHIVED", "CANCELLED"].includes(
        project.status?.toUpperCase(),
      ),
  );

  const stats = [
    {
      label: "Total Projects",
      value: companyProjects.length,
      icon: FolderKanban,
    },
    {
      label: "Active Projects",
      value: activeProjects.length,
      icon: Building2,
    },
    {
      label: "Team Members",
      value: "—",
      icon: Users,
    },
    {
      label: "Pending Invitations",
      value: "—",
      icon: Mail,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-[#7a7359]">
            COMPANY MANAGEMENT
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#35362c] sm:text-4xl">
            Owner Dashboard
          </h1>
          <p className="mt-2 text-sm text-[#7a7359]">
            Welcome back{profile?.name ? `, ${profile.name}` : ""}. Manage your
            company's projects and team.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-[#e2e4e6] bg-white px-4 py-2.5 text-sm font-medium text-[#35362c] hover:bg-[#f5f6f3] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[#e2e4e6] bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#d4e14b]">
            <Building2 size={26} className="text-[#35362c]" />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#7a7359]">
              Your Company
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#35362c]">
              {loading
                ? "Loading..."
                : membership?.companyName || "No company assigned"}
            </h2>
            {membership && (
              <p className="mt-2 text-sm text-[#7a7359]">
                Your role: {membership.role}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-[#e2e4e6] bg-white p-5"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f4d4]">
              <Icon size={21} className="text-[#35362c]" />
            </div>

            <p className="text-sm text-[#7a7359]">{label}</p>
            <p className="mt-2 text-3xl font-bold text-[#35362c]">
              {loading ? "..." : value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#e2e4e6] bg-white">
        <div className="flex items-center justify-between border-b border-[#e2e4e6] px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#35362c]">
              Recent Projects
            </h2>
            <p className="mt-1 text-sm text-[#7a7359]">
              Projects belonging to your company
            </p>
          </div>

          <Link
            to="/projects"
            className="flex items-center gap-2 text-sm font-semibold text-[#35362c] hover:underline"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="p-5">
          {!loading && companyProjects.length === 0 ? (
            <div className="py-12 text-center">
              <FolderKanban size={35} className="mx-auto mb-4 text-[#7a7359]" />
              <p className="font-semibold text-[#35362c]">No projects found</p>
              <p className="mt-2 text-sm text-[#7a7359]">
                Your company projects will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {companyProjects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e2e4e6] p-4 transition hover:bg-[#f8f9f4]"
                >
                  <div>
                    <h3 className="font-semibold text-[#35362c]">
                      {project.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#7a7359]">
                      <MapPin size={13} />
                      {project.location || "No location"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-[#f1f4d4] px-3 py-1.5 text-xs font-semibold text-[#35362c]">
                      {project.status?.replaceAll("_", " ") || "Unknown"}
                    </span>
                    <ArrowRight size={17} className="text-[#7a7359]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
