import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Archive,
  RefreshCw,
  Users,
  UserRound,
} from "lucide-react";

import Client from "../../services/api";
import {
  GetProjectById,
  UpdateProject,
  ArchiveProject,
} from "../../services/project";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [updates, setUpdates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tasksError, setTasksError] = useState(false);
  const [expensesError, setExpensesError] = useState(false);
  const [updatesError, setUpdatesError] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await GetProjectById(projectId);
      setProject(data);
      setForm(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load project.");
      setLoading(false);
      return;
    }

    const results = await Promise.allSettled([
      Client.get("/company/projects/tasks"),
      Client.get("/company/projects/expenses"),
      Client.get(`/company/projects/updates/project/${projectId}`),
    ]);

    if (results[0].status === "fulfilled") {
      setTasks(
        results[0].value.data.filter(
          (task) => Number(task.projectId) === Number(projectId),
        ),
      );
      setTasksError(false);
    } else {
      setTasks([]);
      setTasksError(true);
    }

    if (results[1].status === "fulfilled") {
      setExpenses(
        results[1].value.data.filter(
          (expense) => Number(expense.projectId) === Number(projectId),
        ),
      );
      setExpensesError(false);
    } else {
      setExpenses([]);
      setExpensesError(true);
    }

    if (results[2].status === "fulfilled") {
      setUpdates(results[2].value.data);
      setUpdatesError(false);
    } else {
      setUpdates([]);
      setUpdatesError(true);
    }

    setLoading(false);
  };

  const activeTasks = tasks.filter((task) => task.status !== "ARCHIVED");
  const completed = activeTasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;
  const inProgress = activeTasks.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length;

  const taskProgress = activeTasks.length
    ? Math.round((completed / activeTasks.length) * 100)
    : 0;

  const activeExpenses = expenses.filter(
    (expense) => expense.status !== "ARCHIVED",
  );

  const totalExpenses = activeExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0,
  );

  const budget = Number(project?.budget || 0);
  const remaining = budget - totalExpenses;

  const budgetProgress =
    budget > 0 ? Math.round((totalExpenses / budget) * 100) : 0;

  const money = (amount) => `${Number(amount).toFixed(3)} BHD`;
  const label = (value) => String(value || "").replaceAll("_", " ");

  const statusColor = (status) => {
    if (status === "COMPLETED") return "bg-[#DC5C5C] text-white";
    if (status === "IN_PROGRESS" || status === "NORMAL") {
      return "bg-[#d4e14b] text-[#35362c]";
    }
    return "bg-[#e2e4e6] text-[#35362c]";
  };

  const card = "rounded-xl border border-[#c3c8c1] bg-white p-4";
  const input = "w-full rounded-lg border border-[#c3c8c1] p-3 text-sm";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (form.expectedEndDate < form.startDate) {
      alert("End date cannot be before start date.");
      return;
    }

    setSaving(true);

    try {
      const updated = await UpdateProject(projectId, {
        companyId: Number(project.companyId),
        name: form.name,
        description: form.description,
        location: form.location,
        startDate: form.startDate,
        expectedEndDate: form.expectedEndDate,
        budget: Number(form.budget),
        status: form.status,
      });

      setProject(updated);
      setForm(updated);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update project.");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Archive this project?")) return;

    try {
      const updated = await ArchiveProject(projectId);
      setProject(updated);
      setForm(updated);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to archive project.");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  if (error || !project) {
    return (
      <div className="p-8">
        <p>{error || "Project not found."}</p>
        <button
          onClick={() => navigate("/projects")}
          className="mt-3 flex items-center gap-2 text-sm font-medium text-[#35362c] hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e2e4e6] p-4 text-[#35362c] md:p-5">
      <div className="mx-auto max-w-7xl space-y-3">
        <button
          onClick={() => navigate("/projects")}
          className="group inline-flex items-center gap-2 text-sm font-medium text-[#35362c] transition-colors hover:text-[#7a7359]"
        >
          <ArrowLeft
            size={17}
            className="transition-transform group-hover:-translate-x-1"
          />
          Back to Projects
        </button>

        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{project.name}</h1>

              <p className="mt-1 text-sm text-[#7a7359]">
                {project.companyName} · {project.location}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-xs ${statusColor(project.status)}`}
              >
                {label(project.status)}
              </span>

              <button
                onClick={loadData}
                className="rounded-lg border border-[#c3c8c1] p-2"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>

              {project.status !== "ARCHIVED" && (
                <>
                  <button
                    onClick={() => {
                      setForm(project);
                      setEditing(!editing);
                    }}
                    className="flex items-center gap-2 rounded-lg border border-[#c3c8c1] px-3 py-2 text-sm"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    onClick={handleArchive}
                    className="flex items-center gap-2 rounded-lg bg-[#35362c] px-3 py-2 text-sm text-white"
                  >
                    <Archive size={15} />
                    Archive
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 border-t border-[#c3c8c1] pt-4 md:grid-cols-4">
            {[
              ["Total Tasks", tasksError ? "N/A" : activeTasks.length],
              ["Completed", tasksError ? "N/A" : completed],
              ["Total Expenses", expensesError ? "N/A" : money(totalExpenses)],
              ["Remaining Budget", expensesError ? "N/A" : money(remaining)],
            ].map(([title, value]) => (
              <div key={title} className="px-3 py-2 first:pl-0">
                <p className="text-xs text-[#7a7359]">{title}</p>
                <p className="mt-1 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {editing && (
          <form onSubmit={handleUpdate} className={card}>
            <h2 className="mb-3 text-lg font-semibold">Edit Project</h2>

            <div className="grid gap-3 md:grid-cols-3">
              <input
                name="name"
                value={form.name || ""}
                onChange={handleChange}
                placeholder="Project Name"
                required
                className={input}
              />

              <input
                name="location"
                value={form.location || ""}
                onChange={handleChange}
                placeholder="Location"
                required
                className={input}
              />

              <input
                name="budget"
                type="number"
                min="0"
                step="0.001"
                value={form.budget ?? ""}
                onChange={handleChange}
                placeholder="Budget"
                required
                className={input}
              />

              <label className="text-xs">
                Start Date
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate || ""}
                  onChange={handleChange}
                  required
                  className={`mt-1 ${input}`}
                />
              </label>

              <label className="text-xs">
                Expected End Date
                <input
                  name="expectedEndDate"
                  type="date"
                  value={form.expectedEndDate || ""}
                  onChange={handleChange}
                  required
                  className={`mt-1 ${input}`}
                />
              </label>

              <label className="text-xs">
                Status
                <select
                  name="status"
                  value={form.status || ""}
                  onChange={handleChange}
                  className={`mt-1 ${input}`}
                >
                  {[
                    "PLANNED",
                    "IN_PROGRESS",
                    "ON_HOLD",
                    "COMPLETED",
                    form.status,
                  ]
                    .filter(
                      (status, index, list) =>
                        status && list.indexOf(status) === index,
                    )
                    .map((status) => (
                      <option key={status} value={status}>
                        {label(status)}
                      </option>
                    ))}
                </select>
              </label>

              <textarea
                name="description"
                value={form.description || ""}
                onChange={handleChange}
                placeholder="Description"
                rows={2}
                className={`${input} md:col-span-3`}
              />
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-[#c3c8c1] px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#d4e14b] px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-3 lg:grid-cols-3">
          <div className={`${card} lg:col-span-2`}>
            <h2 className="mb-4 text-base font-semibold">Project Overview</h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-[#7a7359]">Task Progress</p>
                  <p className="text-lg font-semibold">
                    {tasksError ? "N/A" : `${taskProgress}%`}
                  </p>
                </div>

                <div className="h-2 rounded-full bg-[#e2e4e6]">
                  <div
                    className="h-2 rounded-full bg-[#d4e14b]"
                    style={{ width: tasksError ? "0%" : `${taskProgress}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-[#7a7359]">
                  {tasksError
                    ? "Unable to load tasks"
                    : `${completed} completed · ${inProgress} in progress`}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-[#7a7359]">Budget Usage</p>
                  <p className="text-lg font-semibold">
                    {expensesError || !budget ? "N/A" : `${budgetProgress}%`}
                  </p>
                </div>

                <div className="h-2 rounded-full bg-[#e2e4e6]">
                  <div
                    className="h-2 rounded-full bg-[#d4e14b]"
                    style={{
                      width: expensesError
                        ? "0%"
                        : `${Math.min(budgetProgress, 100)}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-[#7a7359]">
                  {expensesError
                    ? "Unable to load expenses"
                    : `${money(totalExpenses)} of ${money(budget)}`}
                </p>

                {!expensesError && remaining < 0 && (
                  <p className="mt-1 text-xs text-[#DC5C5C]">Budget exceeded</p>
                )}
              </div>
            </div>

            <div className="mt-4 border-t border-[#c3c8c1] pt-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Recent Tasks</h3>
                <span className="text-xs text-[#7a7359]">
                  {tasksError ? "N/A" : `${activeTasks.length} tasks`}
                </span>
              </div>

              {tasksError ? (
                <p className="text-sm text-[#7a7359]">Unable to load tasks.</p>
              ) : activeTasks.length === 0 ? (
                <p className="text-sm text-[#7a7359]">No tasks yet.</p>
              ) : (
                <div className="divide-y divide-[#e2e4e6]">
                  {[...activeTasks]
                    .sort(
                      (a, b) =>
                        new Date(b.updatedAt || b.createdAt || 0) -
                        new Date(a.updatedAt || a.createdAt || 0),
                    )
                    .slice(0, 3)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {task.title}
                          </p>
                          <p className="text-xs text-[#7a7359]">
                            {label(task.priority)}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${statusColor(task.status)}`}
                        >
                          {label(task.status)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className={card}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Project Team</h2>
              <Users size={18} className="text-[#7a7359]" />
            </div>

            <p className="mb-3 text-xs font-medium text-[#7a7359]">
              PROJECT MANAGERS
            </p>

            {project.managers?.length > 0 ? (
              <div className="space-y-3">
                {project.managers.map((manager) => (
                  <div
                    key={manager.membershipId}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d4e14b]">
                      {manager.profileImage ? (
                        <img
                          src={manager.profileImage}
                          alt={manager.userName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound size={23} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {manager.userName}
                      </p>
                      <p className="text-xs text-[#7a7359]">Project Manager</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7a7359]">
                Manager information unavailable.
              </p>
            )}

            <div className="mt-4 border-t border-[#c3c8c1] pt-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-[#7a7359]">WORKERS</p>

                {project.workers && (
                  <span className="text-xs text-[#7a7359]">
                    {project.workers.length} members
                  </span>
                )}
              </div>

              {project.workers?.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {project.workers.map((worker) => (
                    <div
                      key={worker.membershipId}
                      className="flex min-w-0 flex-col items-center gap-2 text-center"
                    >
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#e2e4e6]">
                        {worker.profileImage ? (
                          <img
                            src={worker.profileImage}
                            alt={worker.userName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound size={22} />
                        )}
                      </div>

                      <p className="w-full truncate text-xs font-medium">
                        {worker.userName}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#7a7359]">
                  Worker information unavailable.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className={card}>
            <h2 className="mb-3 text-base font-semibold">Recent Expenses</h2>

            {expensesError ? (
              <p className="text-sm text-[#7a7359]">Unable to load expenses.</p>
            ) : activeExpenses.length === 0 ? (
              <p className="text-sm text-[#7a7359]">No expenses yet.</p>
            ) : (
              <div className="divide-y divide-[#e2e4e6]">
                {[...activeExpenses]
                  .sort(
                    (a, b) =>
                      new Date(b.expenseDateTime || 0) -
                      new Date(a.expenseDateTime || 0),
                  )
                  .slice(0, 3)
                  .map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {expense.title}
                        </p>
                        <p className="text-xs text-[#7a7359]">
                          {label(expense.category)}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        {money(expense.amount)}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className={card}>
            <h2 className="mb-3 text-base font-semibold">Project Updates</h2>

            {updatesError ? (
              <p className="text-sm text-[#7a7359]">Unable to load updates.</p>
            ) : updates.length === 0 ? (
              <p className="text-sm text-[#7a7359]">No updates yet.</p>
            ) : (
              <div className="divide-y divide-[#e2e4e6]">
                {updates.slice(0, 3).map((update) => (
                  <div key={update.id} className="py-2.5">
                    <p className="text-sm font-medium">
                      {update.title || `Update #${update.id}`}
                    </p>

                    <p className="mt-1 line-clamp-2 text-xs text-[#7a7359]">
                      {update.description || "No description"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={card}>
            <h2 className="mb-3 text-base font-semibold">
              Project Information
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-[#7a7359]">Start Date</span>
                <span>{project.startDate || "-"}</span>
              </div>

              <div className="flex justify-between gap-2">
                <span className="text-[#7a7359]">Expected End</span>
                <span>{project.expectedEndDate || "-"}</span>
              </div>

              <div className="flex justify-between gap-2">
                <span className="text-[#7a7359]">Budget</span>
                <span>{money(budget)}</span>
              </div>

              <div className="flex justify-between gap-2">
                <span className="text-[#7a7359]">Project ID</span>
                <span>#{project.id}</span>
              </div>
            </div>

            <div className="mt-3 border-t border-[#c3c8c1] pt-3">
              <p className="text-xs text-[#7a7359]">Description</p>
              <p className="mt-1 line-clamp-3 text-sm">
                {project.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
