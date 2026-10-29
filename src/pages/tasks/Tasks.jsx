import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Pencil,
  Archive,
  X,
  ClipboardList,
  Search,
  ArrowUpRight,
  CalendarDays,
  FolderKanban,
} from "lucide-react";
import Client from "../../services/api";
import ArqemioDateTimePicker from "../../components/ArqemioDateTimePicker";
import {
  GetAllTasks,
  CreateTask,
  UpdateTask,
  ArchiveTask,
} from "../../services/task";

const emptyForm = {
  projectId: "",
  title: "",
  description: "",
  status: "PENDING",
  priority: "MEDIUM",
  dueDateTime: "",
};

const inputStyle =
  "w-full rounded-lg border border-[#c3c8c1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a9b82b]";

const cardStyle = "rounded-2xl border border-[#c3c8c1] bg-white p-5";

const format = (value) => String(value || "").replaceAll("_", " ");

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not set";

const statusStyle = (status) => {
  if (status === "COMPLETED") return "bg-[#eef3ce] text-[#596523]";
  if (status === "IN_PROGRESS") return "bg-[#e9ecf7] text-[#56658e]";
  if (status === "ARCHIVED") return "bg-gray-100 text-gray-500";
  return "bg-[#f2f3ed] text-[#7a7359]";
};

const priorityStyle = (priority) => {
  if (priority === "HIGH") return "bg-red-50 text-red-700";
  if (priority === "MEDIUM") return "bg-amber-50 text-amber-700";
  return "bg-[#e2e4e6] text-[#7a7359]";
};

const Tasks = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [projectMembers, setProjectMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(
    searchParams.get("projectId") || "ALL",
  );
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToArchive, setTaskToArchive] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    setProjectFilter(searchParams.get("projectId") || "ALL");
  }, [searchParams]);

  const activeMemberships = memberships.filter((m) => m.status === "ACTIVE");

  const canManage = (projectId) => {
    const project = projects.find((p) => Number(p.id) === Number(projectId));
    if (!project) return false;

    const owner = activeMemberships.some(
      (m) =>
        Number(m.companyId) === Number(project.companyId) && m.role === "OWNER",
    );

    const assigned = projectMembers[projectId] || [];

    const manager = activeMemberships.some(
      (m) =>
        Number(m.companyId) === Number(project.companyId) &&
        m.role === "MANAGER" &&
        assigned.some(
          (member) =>
            member.role === "MANAGER" &&
            Number(member.membershipId) === Number(m.membershipId),
        ),
    );

    return owner || manager;
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      GetAllTasks(),
      Client.get("/company/projects"),
      Client.get("/users/profile"),
    ]);

    if (results[0].status === "fulfilled") {
      setTasks(results[0].value || []);
    } else {
      setError("Failed to load tasks.");
    }

    if (results[1].status === "fulfilled") {
      const projectList = results[1].value.data || [];
      setProjects(projectList);

      const memberResults = await Promise.allSettled(
        projectList.map((p) => Client.get(`/company/projects/${p.id}/members`)),
      );

      const memberMap = {};
      projectList.forEach((p, i) => {
        memberMap[p.id] =
          memberResults[i].status === "fulfilled"
            ? memberResults[i].value.data
            : [];
      });
      setProjectMembers(memberMap);
    }

    if (results[2].status === "fulfilled") {
      setMemberships(results[2].value.data.memberships || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const manageableProjects = projects.filter(
    (project) => canManage(project.id) && project.status !== "ARCHIVED",
  );

  const visibleTasks = tasks
    .filter((task) => {
      if (projectFilter !== "ALL" && String(task.projectId) !== projectFilter)
        return false;

      if (statusFilter !== "ALL" && task.status !== statusFilter) return false;

      const term = search.toLowerCase();

      return `${task.title} ${task.description || ""} ${task.projectName || ""}`
        .toLowerCase()
        .includes(term);
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0),
    );

  const openCreate = () => {
    setEditingTask(null);
    setForm({
      ...emptyForm,
      projectId:
        projectFilter !== "ALL" &&
        manageableProjects.some((p) => String(p.id) === projectFilter)
          ? projectFilter
          : String(manageableProjects[0]?.id || ""),
    });
    setActionError("");
    setShowForm(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      projectId: String(task.projectId),
      title: task.title || "",
      description: task.description || "",
      status: task.status || "PENDING",
      priority: task.priority || "MEDIUM",
      dueDateTime: task.dueDateTime ? task.dueDateTime.slice(0, 16) : "",
    });
    setActionError("");
    setShowForm(true);
  };

  const saveTask = async (e) => {
    e.preventDefault();
    if (!form.dueDateTime) {
      setActionError("Please select a due date.");
      return;
    }

    setSaving(true);
    setActionError("");

    const data = {
      ...form,
      projectId: Number(form.projectId),
      dueDateTime: `${form.dueDateTime}:00`,
    };

    try {
      if (editingTask) {
        await UpdateTask(editingTask.id, data);
      } else {
        await CreateTask(data);
      }

      setShowForm(false);
      await loadData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to save task.");
    } finally {
      setSaving(false);
    }
  };

  const archiveTask = async () => {
    if (!taskToArchive || saving) return;

    setSaving(true);
    setActionError("");

    try {
      await ArchiveTask(taskToArchive.id);
      setTaskToArchive(null);
      await loadData();
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to archive task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent px-5 py-8 text-[#35362c] md:px-10">
      <main className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Tasks</h1>
            <p className="mt-1 text-sm text-[#7a7359]">
              Track and manage work across your projects.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-lg border border-[#c3c8c1] bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              <RefreshCw size={16} /> Refresh
            </button>

            {manageableProjects.length > 0 && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 rounded-lg bg-[#d4e14b] px-4 py-2.5 text-sm font-semibold hover:brightness-95"
              >
                <Plus size={17} /> New Task
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [
              "Total Tasks",
              tasks.filter((t) => t.status !== "ARCHIVED").length,
            ],
            [
              "In Progress",
              tasks.filter((t) => t.status === "IN_PROGRESS").length,
            ],
            ["Completed", tasks.filter((t) => t.status === "COMPLETED").length],
          ].map(([title, count]) => (
            <div key={title} className={cardStyle}>
              <p className="text-sm text-[#7a7359]">{title}</p>
              <p className="mt-2 text-3xl font-semibold">{count}</p>
            </div>
          ))}
        </div>

        <div className={cardStyle}>
          <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-3 text-[#7a7359]"
              />
              <input
                className={`${inputStyle} pl-10`}
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className={inputStyle}
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              className={inputStyle}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"].map((s) => (
                <option key={s} value={s}>
                  {format(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <div className={cardStyle}>Loading tasks...</div>
        ) : visibleTasks.length === 0 ? (
          <div className={`${cardStyle} py-16 text-center`}>
            <ClipboardList size={32} className="mx-auto text-[#7a7359]" />
            <h2 className="mt-3 font-semibold">No tasks found</h2>
            <p className="mt-1 text-sm text-[#7a7359]">
              Try another filter or create a new task.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleTasks.map((task) => (
              <article
                key={task.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/tasks/${task.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/tasks/${task.id}`);
                  }
                }}
                className="group relative flex cursor-pointer flex-col rounded-2xl border border-[#c3c8c1] bg-white p-5 transition-all duration-200 hover:border-[#aab66b] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4e14b]"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="inline-flex min-w-0 items-center gap-2 rounded-lg bg-[#f3f4ed] px-3 py-1.5 text-xs font-semibold text-[#7a7359]">
                    <FolderKanban size={14} />
                    <span className="truncate">{task.projectName}</span>
                  </span>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e2e4e6] text-[#7a7359] transition-colors group-hover:border-[#d4e14b] group-hover:bg-[#d4e14b] group-hover:text-[#35362c]">
                    <ArrowUpRight size={17} />
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyle(task.status)}`}
                  >
                    {format(task.status)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${priorityStyle(task.priority)}`}
                  >
                    {format(task.priority)}
                  </span>
                </div>

                <h3 className="line-clamp-2 text-lg font-semibold tracking-tight">
                  {task.title}
                </h3>
                <p className="mt-2 line-clamp-2 min-h-10 flex-1 text-sm leading-6 text-[#7a7359]">
                  {task.description || "No description provided."}
                </p>

                <div className="mt-6 flex items-center justify-between gap-2 border-t border-[#e2e4e6] pt-4">
                  <span className="flex items-center gap-2 text-xs text-[#7a7359]">
                    <CalendarDays size={15} />
                    {formatDate(task.dueDateTime)}
                  </span>

                  {canManage(task.projectId) && task.status !== "ARCHIVED" && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Edit task"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(task);
                        }}
                        className="rounded-lg p-2 text-[#7a7359] hover:bg-[#e2e4e6]"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title="Archive task"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionError("");
                          setTaskToArchive(task);
                        }}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Archive size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#35362c]/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingTask ? "Edit Task" : "New Task"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveTask} className="space-y-4">
              <label className="block text-sm font-medium">
                Project
                <select
                  required
                  disabled={!!editingTask}
                  className={`mt-2 ${inputStyle}`}
                  value={form.projectId}
                  onChange={(e) =>
                    setForm({ ...form, projectId: e.target.value })
                  }
                >
                  {!form.projectId && <option value="">Select project</option>}
                  {(editingTask
                    ? projects.filter(
                        (p) => Number(p.id) === Number(form.projectId),
                      )
                    : manageableProjects
                  ).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Title
                <input
                  required
                  className={`mt-2 ${inputStyle}`}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>

              <label className="block text-sm font-medium">
                Description
                <textarea
                  rows={3}
                  className={`mt-2 ${inputStyle}`}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium">
                  Status
                  <select
                    className={`mt-2 ${inputStyle}`}
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    {["PENDING", "IN_PROGRESS", "COMPLETED"].map((s) => (
                      <option key={s} value={s}>
                        {format(s)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium">
                  Priority
                  <select
                    className={`mt-2 ${inputStyle}`}
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                  >
                    {["LOW", "MEDIUM", "HIGH"].map((p) => (
                      <option key={p} value={p}>
                        {format(p)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="text-sm font-medium">
                Due Date
                <ArqemioDateTimePicker
                  required
                  value={form.dueDateTime}
                  onChange={(value) => setForm({ ...form, dueDateTime: value })}
                />
              </div>

              {actionError && (
                <p className="text-sm text-red-600">{actionError}</p>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-[#c3c8c1] px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#d4e14b] px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingTask
                      ? "Save Changes"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {taskToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#35362c]/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Archive size={22} />
            </div>
            <h2 className="text-xl font-semibold">Archive this task?</h2>
            <p className="mt-2 text-sm text-[#7a7359]">
              Are you sure you want to archive{" "}
              <strong>{taskToArchive.title}</strong>?
            </p>

            {actionError && (
              <p className="mt-3 text-sm text-red-600">{actionError}</p>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                disabled={saving}
                onClick={() => setTaskToArchive(null)}
                className="rounded-lg border border-[#c3c8c1] px-5 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={archiveTask}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Archiving..." : "Archive Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
