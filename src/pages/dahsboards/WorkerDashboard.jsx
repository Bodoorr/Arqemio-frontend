import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  ClipboardList,
  CheckCircle2,
  Clock3,
  ArrowRight,
  HardHat,
} from "lucide-react";
import Client from "../../services/api";

const WorkerDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const results = await Promise.allSettled([
          Client.get("/company/projects"),
          Client.get("/company/projects/tasks"),
        ]);

        if (results[0].status === "fulfilled") {
          setProjects(results[0].value.data || []);
        }

        if (results[1].status === "fulfilled") {
          setTasks(results[1].value.data || []);
        }
      } catch (error) {
        console.error("Unable to load worker dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const activeTasks = tasks.filter((task) => task.status === "IN_PROGRESS");

  const completedTasks = tasks.filter((task) => task.status === "COMPLETED");

  const pendingTasks = tasks.filter((task) => task.status === "PENDING");

  const stats = [
    {
      title: "My Projects",
      value: projects.length,
      icon: FolderKanban,
    },
    {
      title: "Total Tasks",
      value: tasks.length,
      icon: ClipboardList,
    },
    {
      title: "In Progress",
      value: activeTasks.length,
      icon: Clock3,
    },
    {
      title: "Completed",
      value: completedTasks.length,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7 py-5 text-[#35362c]">
      <div>
        <p className="text-sm font-medium text-[#7a7359]">Arqemio Workspace</p>

        <h1 className="mt-1 text-3xl font-bold">Worker Dashboard</h1>

        <p className="mt-2 text-sm text-[#7a7359]">
          Track your assigned projects, tasks, and progress.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ title, value, icon: Icon }) => (
          <div
            key={title}
            className="rounded-2xl border border-[#e2e4e6] bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#7a7359]">{title}</span>

              <Icon size={20} className="text-[#7a7359]" />
            </div>

            <p className="mt-5 text-3xl font-bold">{loading ? "..." : value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-[#e2e4e6] bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">My Tasks</h2>
              <p className="mt-1 text-sm text-[#7a7359]">
                Your recent task activities
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
            {tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#7a7359]">
                {loading ? "Loading tasks..." : "No tasks available."}
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

        <section className="rounded-2xl border border-[#e2e4e6] bg-white p-6">
          <h2 className="text-lg font-semibold">Task Overview</h2>

          <p className="mt-1 text-sm text-[#7a7359]">Current task progress</p>

          <div className="mt-6 space-y-5">
            {[
              {
                label: "Pending",
                count: pendingTasks.length,
              },
              {
                label: "In Progress",
                count: activeTasks.length,
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
                    className="h-full rounded-full bg-[#d4e14b]"
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

      <section className="rounded-2xl border border-[#e2e4e6] bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">My Projects</h2>

            <p className="mt-1 text-sm text-[#7a7359]">
              Projects you're working on
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
          {projects.length === 0 ? (
            <p className="text-sm text-[#7a7359]">
              {loading ? "Loading projects..." : "No projects available."}
            </p>
          ) : (
            projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="rounded-xl border border-[#e2e4e6] p-4 transition hover:bg-[#f5f6f3]"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#e9edcf] p-3">
                    <HardHat size={20} />
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
    </div>
  );
};

export default WorkerDashboard;
