import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Archive, RefreshCw, Users } from "lucide-react";
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
  const [memberships, setMemberships] = useState([]);
  const [members, setMembers] = useState([]);
  const [teamError, setTeamError] = useState(false);

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

  const card = "rounded-xl border border-[#c3c8c1] bg-white p-5";
  const input =
    "mt-2 w-full rounded-lg border border-[#c3c8c1] bg-white p-3 text-sm outline-none focus:border-[#7a7359]";

  const label = (value) => String(value || "").replaceAll("_", " ");
  const money = (amount) => `${Number(amount || 0).toFixed(3)} BHD`;

  const isOwner = memberships.some(
    (membership) =>
      membership.role === "OWNER" &&
      membership.status === "ACTIVE" &&
      Number(membership.companyId) === Number(project?.companyId),
  );

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
      Client.get("/users/profile"),
      Client.get("/company/projects/tasks"),
      Client.get("/company/projects/expenses"),
      Client.get(`/company/projects/updates/project/${projectId}`),
      Client.get(`/company/projects/${projectId}/members`),
    ]);

    if (results[0].status === "fulfilled") {
      setMemberships(results[0].value.data.memberships || []);
    } else {
      setMemberships([]);
    }

    if (results[1].status === "fulfilled") {
      setTasks(
        results[1].value.data.filter(
          (task) => Number(task.projectId) === Number(projectId),
        ),
      );
      setTasksError(false);
    } else {
      setTasks([]);
      setTasksError(true);
    }

    if (results[2].status === "fulfilled") {
      setExpenses(
        results[2].value.data.filter(
          (expense) => Number(expense.projectId) === Number(projectId),
        ),
      );
      setExpensesError(false);
    } else {
      setExpenses([]);
      setExpensesError(true);
    }

    if (results[3].status === "fulfilled") {
      setUpdates(results[3].value.data || []);
      setUpdatesError(false);
    } else {
      setUpdates([]);
      setUpdatesError(true);
    }

    if (results[4].status === "fulfilled") {
      setMembers(
        Array.isArray(results[4].value.data) ? results[4].value.data : [],
      );
      setTeamError(false);
    } else {
      setMembers([]);
      setTeamError(true);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const managers = members.filter((member) => member.role === "MANAGER");
  const workers = members.filter((member) => member.role === "WORKER");

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
  const budgetProgress = budget
    ? Math.round((totalExpenses / budget) * 100)
    : 0;

  const statusColor = (status) => {
    if (status === "COMPLETED") return "bg-[#DC5C5C] text-white";
    if (status === "IN_PROGRESS" || status === "NORMAL")
      return "bg-[#d4e14b] text-[#35362c]";
    return "bg-[#e2e4e6] text-[#35362c]";
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!isOwner) return;

    if (form.expectedEndDate < form.startDate) {
      alert("End date cannot be before start date.");
      return;
    }

    setSaving(true);

    try {
      const updated = await UpdateProject(projectId, {
        companyId: Number(project.companyId),
        name: form.name.trim(),
        description: form.description || "",
        location: form.location.trim(),
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
    if (!isOwner) return;
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

  const editFields = [
    { name: "name", title: "Project Name", required: true },
    { name: "location", title: "Location", required: true },
    {
      name: "budget",
      title: "Budget (BHD)",
      type: "number",
      required: true,
    },
    {
      name: "startDate",
      title: "Start Date",
      type: "date",
      required: true,
    },
    {
      name: "expectedEndDate",
      title: "Expected End Date",
      type: "date",
      required: true,
    },
  ];

  const getMemberName = (member) =>
    member.userName || member.name || "Unknown Member";

  const getMemberImage = (member) =>
    member.profileImage || member.profilePicture;

  const MemberAvatar = ({ member, manager = false }) => {
    const name = getMemberName(member);
    const image = getMemberImage(member);

    return (
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-semibold ${
          manager ? "bg-[#d4e14b]" : "bg-[#e2e4e6]"
        }`}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement.innerText = name
                .charAt(0)
                .toUpperCase();
            }}
          />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e2e4e6] p-8">Loading project...</div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <p>{error || "Project not found."}</p>
        <button
          onClick={() => navigate("/projects")}
          className="mt-4 text-sm underline"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e2e4e6] px-5 py-8 text-[#35362c] md:px-12">
      <main className="mx-auto max-w-7xl space-y-5">
        <button
          onClick={() => navigate("/projects")}
          className="group flex items-center gap-2 text-sm font-medium hover:text-[#7a7359]"
        >
          <ArrowLeft
            size={17}
            className="transition group-hover:-translate-x-1"
          />
          Back to Projects
        </button>

        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[#7a7359]">
                Workspace / Project Details
              </p>
              <h1 className="text-3xl font-semibold">{project.name}</h1>
              <p className="mt-2 text-sm text-[#7a7359]">
                {project.companyName} · {project.location}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-xs ${statusColor(
                  project.status,
                )}`}
              >
                {label(project.status)}
              </span>

              <button
                onClick={loadData}
                title="Refresh"
                className="rounded-lg border border-[#c3c8c1] p-2"
              >
                <RefreshCw size={16} />
              </button>

              {isOwner && project.status !== "ARCHIVED" && (
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

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#c3c8c1] pt-5 md:grid-cols-4">
            {[
              ["Total Tasks", tasksError ? "N/A" : activeTasks.length],
              ["Completed", tasksError ? "N/A" : completed],
              ["Total Expenses", expensesError ? "N/A" : money(totalExpenses)],
              ["Remaining Budget", expensesError ? "N/A" : money(remaining)],
            ].map(([title, value]) => (
              <div key={title}>
                <p className="text-xs text-[#7a7359]">{title}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {isOwner && editing && (
          <form onSubmit={handleUpdate} className={card}>
            <h2 className="mb-6 text-2xl font-semibold">Edit Project</h2>

            <div className="grid gap-5 md:grid-cols-3">
              {editFields.map((field) => (
                <label key={field.name} className="block text-sm font-medium">
                  {field.title}
                  <input
                    name={field.name}
                    type={field.type || "text"}
                    value={form[field.name] ?? ""}
                    onChange={handleChange}
                    required={field.required}
                    min={
                      field.name === "expectedEndDate"
                        ? form.startDate
                        : field.name === "budget"
                          ? "0"
                          : undefined
                    }
                    step={field.name === "budget" ? "0.001" : undefined}
                    className={input}
                  />
                </label>
              ))}

              <label className="block text-sm font-medium">
                Status
                <select
                  name="status"
                  value={form.status || ""}
                  onChange={handleChange}
                  className={input}
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

              <label className="block text-sm font-medium md:col-span-3">
                Description
                <textarea
                  name="description"
                  value={form.description || ""}
                  onChange={handleChange}
                  rows={3}
                  className={input}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#c3c8c1] pt-5">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-[#c3c8c1] px-5 py-3 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#d4e14b] px-5 py-3 text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className={`${card} lg:col-span-2`}>
            <h2 className="mb-5 text-lg font-semibold">Project Overview</h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex justify-between">
                  <p className="text-sm text-[#7a7359]">Task Progress</p>
                  <p className="font-semibold">
                    {tasksError ? "N/A" : `${taskProgress}%`}
                  </p>
                </div>
                <div className="h-2 rounded-full bg-[#e2e4e6]">
                  <div
                    className="h-2 rounded-full bg-[#d4e14b]"
                    style={{
                      width: tasksError ? "0%" : `${taskProgress}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-[#7a7359]">
                  {tasksError
                    ? "Unable to load tasks"
                    : `${completed} completed · ${inProgress} in progress`}
                </p>
              </div>

              <div>
                <div className="mb-2 flex justify-between">
                  <p className="text-sm text-[#7a7359]">Budget Usage</p>
                  <p className="font-semibold">
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

            <div className="mt-6 border-t border-[#c3c8c1] pt-4">
              <div className="mb-3 flex justify-between">
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
                        className="flex items-center justify-between gap-3 py-3"
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
                          className={`shrink-0 rounded-full px-3 py-1 text-xs ${statusColor(
                            task.status,
                          )}`}
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
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Project Team</h2>
              <Users size={19} className="text-[#7a7359]" />
            </div>

            {teamError ? (
              <p className="text-sm text-[#DC5C5C]">
                Unable to load project team.
              </p>
            ) : (
              <>
                <p className="mb-3 text-xs font-medium tracking-wide text-[#7a7359]">
                  PROJECT MANAGERS
                </p>

                {managers.length === 0 ? (
                  <p className="text-sm text-[#7a7359]">
                    No managers assigned.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {managers.map((manager, index) => (
                      <div
                        key={manager.membershipId ?? index}
                        className="flex items-center gap-3"
                      >
                        <MemberAvatar member={manager} manager />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {getMemberName(manager)}
                          </p>
                          <p className="text-xs text-[#7a7359]">
                            Project Manager
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 border-t border-[#c3c8c1] pt-4">
                  <div className="mb-4 flex justify-between">
                    <p className="text-xs font-medium tracking-wide text-[#7a7359]">
                      WORKERS
                    </p>
                    <span className="text-xs text-[#7a7359]">
                      {workers.length} members
                    </span>
                  </div>

                  {workers.length === 0 ? (
                    <p className="text-sm text-[#7a7359]">
                      No workers assigned.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {workers.map((worker, index) => (
                        <div
                          key={worker.membershipId ?? index}
                          className="flex min-w-0 flex-col items-center gap-2 text-center"
                        >
                          <MemberAvatar member={worker} />
                          <p className="w-full truncate text-xs font-medium">
                            {getMemberName(worker)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className={card}>
            <h2 className="mb-4 text-lg font-semibold">Recent Expenses</h2>

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
                      className="flex justify-between gap-3 py-3"
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
            <h2 className="mb-4 text-lg font-semibold">Project Updates</h2>

            {updatesError ? (
              <p className="text-sm text-[#7a7359]">Unable to load updates.</p>
            ) : updates.length === 0 ? (
              <p className="text-sm text-[#7a7359]">No updates yet.</p>
            ) : (
              <div className="divide-y divide-[#e2e4e6]">
                {updates.slice(0, 3).map((update) => (
                  <div key={update.id} className="py-3">
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
            <h2 className="mb-4 text-lg font-semibold">Project Information</h2>

            <div className="space-y-4 text-sm">
              {[
                ["Start Date", project.startDate || "-"],
                ["Expected End", project.expectedEndDate || "-"],
                ["Budget", money(budget)],
                ["Project ID", `#${project.projectId ?? project.id}`],
              ].map(([title, value]) => (
                <div key={title} className="flex justify-between gap-3">
                  <span className="text-[#7a7359]">{title}</span>
                  <span className="text-right">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-[#c3c8c1] pt-4">
              <p className="text-xs text-[#7a7359]">Description</p>
              <p className="mt-2 line-clamp-3 text-sm">
                {project.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetails;
