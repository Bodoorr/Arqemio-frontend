import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  ClipboardList,
  CheckCircle2,
  Clock3,
  ArrowRight,
  Users,
  HardHat,
  CalendarDays,
  Activity,
} from "lucide-react";
import Client from "../../services/api";
import { GetAllTasks } from "../../services/task";

const card = "rounded-2xl border border-[#e2e4e6] bg-white p-6";

const ManagerDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        Client.get("/company/projects"),
        GetAllTasks(),
      ]);

      if (results[0].status === "fulfilled") {
        const data = results[0].value.data;
        setProjects(Array.isArray(data) ? data : data?.content || []);
      }

      if (results[1].status === "fulfilled") {
        const data = results[1].value?.data ?? results[1].value;

        setTasks(Array.isArray(data) ? data : data?.content || []);
      }

      if (results.some((result) => result.status === "rejected")) {
        setError("Some dashboard information could not be loaded.");
      }

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const pendingTasks = tasks.filter((task) => task.status === "PENDING");

  const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS");

  const completedTasks = tasks.filter((task) => task.status === "COMPLETED");

  const stats = [
    {
      title: "My Projects",
      value: projects.length,
      icon: FolderKanban,
      path: "/projects",
    },
    {
      title: "Total Tasks",
      value: tasks.length,
      icon: ClipboardList,
      path: "/tasks",
    },
    {
      title: "In Progress",
      value: inProgressTasks.length,
      icon: Clock3,
      path: "/tasks",
    },
    {
      title: "Completed",
      value: completedTasks.length,
      icon: CheckCircle2,
      path: "/tasks",
    },
  ];

  const quickActions = [
    {
      title: "Manage Projects",
      description: "View projects and monitor progress.",
      icon: FolderKanban,
      path: "/projects",
    },
    {
      title: "Manage Tasks",
      description: "Create tasks and assign project workers.",
      icon: Users,
      path: "/tasks",
    },
    {
      title: "Equipment",
      description: "View available construction equipment.",
      icon: HardHat,
      path: "/equipment",
    },
    {
      title: "Reservations",
      description: "Manage equipment reservations.",
      icon: CalendarDays,
      path: "/reservations",
    },
    {
      title: "Project Updates",
      description: "View and manage project progress updates.",
      icon: Activity,
      path: "/updates",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7 py-5 text-[#35362c]">
      <div>
        <p className="text-sm font-medium text-[#7a7359]">Arqemio Workspace</p>

        <h1 className="mt-1 text-3xl font-bold">Manager Dashboard</h1>

        <p className="mt-2 text-sm text-[#7a7359]">
          Manage your projects, assign workers, and track task progress.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, path }) => (
          <Link
            key={title}
            to={path}
            className="rounded-2xl border border-[#e2e4e6] bg-white p-5 transition hover:border-[#d4e14b]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7a7359]">{title}</span>

              <Icon size={20} className="text-[#7a7359]" />
            </div>

            <p className="mt-5 text-3xl font-bold">{loading ? "..." : value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Project Tasks</h2>

              <p className="mt-1 text-sm text-[#7a7359]">
                Recent tasks across your projects
              </p>
            </div>

            <Link
              to="/tasks"
              className="flex items-center gap-1 text-sm font-semibold"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="py-8 text-center text-sm text-[#7a7359]">
                Loading tasks...
              </p>
            ) : tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#7a7359]">
                No tasks available.
              </p>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[#e2e4e6] p-4 transition hover:bg-[#f5f6f3]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-[#7a7359]">
                      {task.projectName || "Project task"}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-lg bg-[#f5f6f3] px-3 py-1.5 text-xs font-medium">
                    {task.status?.replaceAll("_", " ")}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className={card}>
          <h2 className="text-lg font-semibold">Task Overview</h2>

          <p className="mt-1 text-sm text-[#7a7359]">
            Task progress across your projects
          </p>

          <div className="mt-6 space-y-5">
            {[
              {
                label: "Pending",
                count: pendingTasks.length,
              },
              {
                label: "In Progress",
                count: inProgressTasks.length,
              },
              {
                label: "Completed",
                count: completedTasks.length,
              },
            ].map(({ label, count }) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-semibold">{count}</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[#e2e4e6]">
                  <div
                    className="h-full rounded-full bg-[#d4e14b] transition-all"
                    style={{
                      width: `${
                        tasks.length ? (count / tasks.length) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={card}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">My Projects</h2>

            <p className="mt-1 text-sm text-[#7a7359]">
              Projects you are managing
            </p>
          </div>

          <Link
            to="/projects"
            className="flex items-center gap-1 text-sm font-semibold"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {loading ? (
            <p className="text-sm text-[#7a7359]">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-[#7a7359]">No projects available.</p>
          ) : (
            projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="rounded-xl border border-[#e2e4e6] p-4 transition hover:bg-[#f5f6f3]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#e9edcf] p-3">
                    <FolderKanban size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {project.name}
                    </p>

                    <p className="mt-1 text-xs text-[#7a7359]">
                      {project.status?.replaceAll("_", " ") || "Project"}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold">Quick Actions</h2>

        <p className="mt-1 text-sm text-[#7a7359]">
          Access your management tools
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ title, description, icon: Icon, path }) => (
            <Link
              key={title}
              to={path}
              className="rounded-xl border border-[#e2e4e6] p-4 transition hover:border-[#d4e14b] hover:bg-[#f5f6f3]"
            >
              <div className="mb-4 inline-flex rounded-xl bg-[#e9edcf] p-3">
                <Icon size={20} />
              </div>

              <p className="text-sm font-semibold">{title}</p>

              <p className="mt-2 text-xs leading-5 text-[#7a7359]">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ManagerDashboard;
