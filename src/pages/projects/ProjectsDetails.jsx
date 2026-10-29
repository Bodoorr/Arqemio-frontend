import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Archive,
  RefreshCw,
  Users,
  UserPlus,
  X,
  Trash2,
  ImagePlus,
  ExternalLink,
} from "lucide-react";
import Client from "../../services/api";
import { GetExpenseAttachments } from "../../services/attachment";
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
  const [availableMembers, setAvailableMembers] = useState([]);
  const [teamError, setTeamError] = useState(false);
  const [availableError, setAvailableError] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedRole, setSelectedRole] = useState("MANAGER");
  const [selectedMember, setSelectedMember] = useState("");
  const [teamSaving, setTeamSaving] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [updates, setUpdates] = useState([]);

  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseAttachments, setExpenseAttachments] = useState([]);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");

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

  const loadAvailableMembers = async () => {
    try {
      const response = await Client.get(
        `/company/projects/${projectId}/available-members`,
      );
      setAvailableMembers(Array.isArray(response.data) ? response.data : []);
      setAvailableError(false);
    } catch (error) {
      setAvailableError(true);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    setShowAddMember(false);

    let projectData;

    try {
      projectData = await GetProjectById(projectId);
      setProject(projectData);
      setForm(projectData);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load project.");
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
      const userMemberships = results[0].value.data.memberships || [];
      setMemberships(userMemberships);

      const owner = userMemberships.some(
        (membership) =>
          membership.role === "OWNER" &&
          membership.status === "ACTIVE" &&
          Number(membership.companyId) === Number(projectData.companyId),
      );

      if (owner) await loadAvailableMembers();
      else setAvailableMembers([]);
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

  const refreshTeam = async () => {
    try {
      const response = await Client.get(
        `/company/projects/${projectId}/members`,
      );
      setMembers(Array.isArray(response.data) ? response.data : []);
      setTeamError(false);
    } catch (error) {
      setTeamError(true);
    }
    await loadAvailableMembers();
  };

  const handleAssignMember = async (event) => {
    event.preventDefault();
    if (!isOwner || !selectedMember || teamSaving) return;

    setTeamSaving(true);

    try {
      const type = selectedRole === "MANAGER" ? "managers" : "workers";
      await Client.post(
        `/company/projects/${projectId}/${type}/${selectedMember}`,
      );
      await refreshTeam();
      setSelectedMember("");
      setShowAddMember(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to assign member.");
    } finally {
      setTeamSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!isOwner || !memberToRemove || teamSaving) return;

    setTeamSaving(true);

    try {
      const type = memberToRemove.role === "MANAGER" ? "managers" : "workers";
      await Client.delete(
        `/company/projects/${projectId}/${type}/${memberToRemove.membershipId}`,
      );
      await refreshTeam();
      setMemberToRemove(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove member.");
    } finally {
      setTeamSaving(false);
    }
  };

  const openExpenseDetails = async (expense) => {
    setSelectedExpense(expense);
    setExpenseAttachments([]);
    setReceiptError("");
    setReceiptLoading(true);

    try {
      const data = await GetExpenseAttachments(expense.id);
      setExpenseAttachments(Array.isArray(data) ? data : []);
    } catch (error) {
      setReceiptError(
        error.response?.data?.message || "Unable to load receipts.",
      );
    } finally {
      setReceiptLoading(false);
    }
  };

  const selectableMembers = availableMembers.filter(
    (member) => member.role === selectedRole,
  );

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

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
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
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update project.");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!isOwner || !window.confirm("Archive this project?")) return;

    try {
      const updated = await ArchiveProject(projectId);
      setProject(updated);
      setForm(updated);
      setEditing(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to archive project.");
    }
  };

  const editFields = [
    { name: "name", title: "Project Name", required: true },
    { name: "location", title: "Location", required: true },
    { name: "budget", title: "Budget (BHD)", type: "number", required: true },
    { name: "startDate", title: "Start Date", type: "date", required: true },
    {
      name: "expectedEndDate",
      title: "Expected End Date",
      type: "date",
      required: true,
    },
  ];

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
          <ArrowLeft size={17} />
          Back to Projects
        </button>

        {/* Project Header */}
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
                className={`rounded-full px-3 py-1.5 text-xs ${statusColor(project.status)}`}
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
                    <Pencil size={15} /> Edit
                  </button>

                  <button
                    onClick={handleArchive}
                    className="flex items-center gap-2 rounded-lg bg-[#35362c] px-3 py-2 text-sm text-white"
                  >
                    <Archive size={15} /> Archive
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

        {/* Edit Project */}
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
          {/* Project Overview */}
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
                        : `${Math.min(Math.max(budgetProgress, 0), 100)}%`,
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

            {/* Recent Tasks */}
            <div className="mt-6 border-t border-[#c3c8c1] pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Recent Tasks</h3>
                <button
                  type="button"
                  onClick={() => navigate(`/tasks?projectId=${projectId}`)}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-[#7a7359] hover:bg-[#f3f5e9]"
                >
                  View All Tasks ({tasksError ? "N/A" : activeTasks.length})
                </button>
              </div>

              {tasksError ? (
                <p className="text-sm text-[#7a7359]">Unable to load tasks.</p>
              ) : activeTasks.length === 0 ? (
                <p className="text-sm text-[#7a7359]">No tasks yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...activeTasks]
                    .sort(
                      (a, b) =>
                        new Date(b.updatedAt || b.createdAt || 0) -
                        new Date(a.updatedAt || a.createdAt || 0),
                    )
                    .slice(0, 3)
                    .map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-[#e2e4e6] px-4 py-3 text-left hover:border-[#b4c25b] hover:bg-[#f8f9ef]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {task.title}
                          </p>
                          <p className="mt-1 text-xs text-[#7a7359]">
                            {label(task.priority)} Priority
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${statusColor(task.status)}`}
                          >
                            {label(task.status)}
                          </span>
                          <span className="text-lg text-[#7a7359]">›</span>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Project Team */}
          <div className={card}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Project Team</h2>
                <p className="mt-1 text-xs text-[#7a7359]">
                  {teamError
                    ? "Team unavailable"
                    : `${members.length} assigned members`}
                </p>
              </div>

              {isOwner && project.status !== "ARCHIVED" ? (
                <button
                  onClick={() => {
                    setShowAddMember(!showAddMember);
                    setSelectedMember("");
                  }}
                  className="flex items-center gap-2 rounded-lg bg-[#d4e14b] px-3 py-2 text-xs font-semibold"
                >
                  {showAddMember ? <X size={15} /> : <UserPlus size={15} />}
                  {showAddMember ? "Close" : "Add Member"}
                </button>
              ) : (
                <Users size={19} className="text-[#7a7359]" />
              )}
            </div>

            {isOwner && showAddMember && project.status !== "ARCHIVED" && (
              <form
                onSubmit={handleAssignMember}
                className="mb-5 rounded-xl border border-[#c3c8c1] bg-[#f7f8f5] p-4"
              >
                <h3 className="text-sm font-semibold">Assign to Project</h3>

                <label className="mt-3 block text-xs font-medium">
                  Role
                  <select
                    value={selectedRole}
                    onChange={(event) => {
                      setSelectedRole(event.target.value);
                      setSelectedMember("");
                    }}
                    className={input}
                  >
                    <option value="MANAGER">Manager</option>
                    <option value="WORKER">Worker</option>
                  </select>
                </label>

                <label className="mt-3 block text-xs font-medium">
                  Company Member
                  <select
                    value={selectedMember}
                    onChange={(event) => setSelectedMember(event.target.value)}
                    className={input}
                    disabled={availableError || selectableMembers.length === 0}
                  >
                    <option value="">Select a member</option>
                    {selectableMembers.map((member) => (
                      <option
                        key={member.membershipId}
                        value={member.membershipId}
                      >
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>

                {availableError ? (
                  <p className="mt-2 text-xs text-[#DC5C5C]">
                    Unable to load available members.
                  </p>
                ) : selectableMembers.length === 0 ? (
                  <p className="mt-2 text-xs text-[#7a7359]">
                    No available {selectedRole.toLowerCase()}s.
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={!selectedMember || teamSaving}
                  className="mt-4 w-full rounded-lg bg-[#35362c] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {teamSaving ? "Saving..." : "Assign Member"}
                </button>
              </form>
            )}

            {teamError ? (
              <p className="text-sm text-[#DC5C5C]">
                Unable to load project team.
              </p>
            ) : (
              <div className="space-y-5">
                {[
                  {
                    title: "PROJECT MANAGERS",
                    people: managers,
                    empty: "No managers assigned.",
                  },
                  {
                    title: "WORKERS",
                    people: workers,
                    empty: "No workers assigned.",
                  },
                ].map((group, index) => (
                  <div
                    key={group.title}
                    className={index ? "border-t border-[#e2e4e6] pt-5" : ""}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold tracking-wide text-[#7a7359]">
                        {group.title}
                      </p>
                      <span className="rounded-full bg-[#e2e4e6] px-2.5 py-1 text-xs">
                        {group.people.length}
                      </span>
                    </div>

                    {group.people.length === 0 ? (
                      <p className="text-sm text-[#7a7359]">{group.empty}</p>
                    ) : (
                      <div className="space-y-2">
                        {group.people.map((member) => (
                          <div
                            key={member.membershipId}
                            className="flex items-center gap-3 rounded-lg border border-[#e2e4e6] p-2.5"
                          >
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${
                                member.role === "MANAGER"
                                  ? "bg-[#d4e14b]"
                                  : "bg-[#e2e4e6]"
                              }`}
                            >
                              {(member.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {member.name}
                              </p>
                              <p className="text-xs text-[#7a7359]">
                                {member.role === "MANAGER"
                                  ? "Project Manager"
                                  : "Worker"}
                              </p>
                            </div>

                            {isOwner && project.status !== "ARCHIVED" && (
                              <button
                                onClick={() => setMemberToRemove(member)}
                                disabled={teamSaving}
                                className="rounded-lg p-2 text-[#7a7359] hover:bg-red-50 hover:text-[#DC5C5C]"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Recent Expenses */}
          <div className={card}>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Recent Expenses</h2>
              <button
                type="button"
                onClick={() => navigate(`/expenses?projectId=${projectId}`)}
                className="rounded-lg px-2 py-2 text-xs font-semibold text-[#7a7359] hover:bg-[#f3f5e9]"
              >
                View All Expenses (
                {expensesError ? "N/A" : activeExpenses.length})
              </button>
            </div>

            {expensesError ? (
              <p className="text-sm text-[#7a7359]">Unable to load expenses.</p>
            ) : activeExpenses.length === 0 ? (
              <p className="text-sm text-[#7a7359]">No expenses yet.</p>
            ) : (
              <div className="space-y-2">
                {[...activeExpenses]
                  .sort(
                    (a, b) =>
                      new Date(b.expenseDateTime || 0) -
                      new Date(a.expenseDateTime || 0),
                  )
                  .slice(0, 3)
                  .map((expense) => (
                    <button
                      key={expense.id}
                      type="button"
                      onClick={() => openExpenseDetails(expense)}
                      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-[#e2e4e6] px-3 py-3 text-left transition hover:border-[#b4c25b] hover:bg-[#f8f9ef]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {expense.title}
                        </p>
                        <p className="mt-1 text-xs text-[#7a7359]">
                          {label(expense.category)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <p className="text-sm font-semibold">
                          {money(expense.amount)}
                        </p>
                        <span className="text-lg text-[#7a7359] transition group-hover:translate-x-1">
                          ›
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Project Updates */}
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

          {/* Project Information */}
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

        {/* Expense Details Modal */}
        {selectedExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#35362c]/50 p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-[#f5f6f3] p-5 shadow-2xl md:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#7a7359]">
                    Expense Details · #{selectedExpense.id}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {selectedExpense.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="rounded-lg p-2 hover:bg-[#e2e4e6]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#d4e14b] px-5 py-3">
                <span className="text-sm font-medium">Expense Amount</span>
                <span className="text-2xl font-semibold">
                  {money(selectedExpense.amount)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-white p-4 text-sm md:grid-cols-3">
                {[
                  ["Project", selectedExpense.projectName || project.name],
                  ["Category", label(selectedExpense.category)],
                  [
                    "Expense Date",
                    selectedExpense.expenseDateTime
                      ? new Date(
                          selectedExpense.expenseDateTime,
                        ).toLocaleString("en-GB")
                      : "—",
                  ],
                  ["Recorded By", selectedExpense.memberName],
                  ["Status", label(selectedExpense.status)],
                ].map(([title, value]) => (
                  <div key={title}>
                    <p className="text-xs text-[#7a7359]">{title}</p>
                    <p className="mt-1 break-words font-medium">
                      {value || "—"}
                    </p>
                  </div>
                ))}

                <div className="col-span-2 border-t border-[#e2e4e6] pt-3 md:col-span-3">
                  <p className="font-semibold">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-[#7a7359]">
                    {selectedExpense.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ImagePlus size={17} /> Receipts & Attachments
                </h3>

                {receiptLoading ? (
                  <p className="text-sm text-[#7a7359]">Loading receipts...</p>
                ) : receiptError ? (
                  <p className="text-sm text-red-700">{receiptError}</p>
                ) : expenseAttachments.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-[#7a7359]">
                    No receipts uploaded.
                  </p>
                ) : (
                  <div className="flex flex-wrap justify-center gap-3">
                    {expenseAttachments.map((attachment) => (
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
                            alt={attachment.fileName || "Expense receipt"}
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

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="rounded-lg border border-[#c3c8c1] bg-white px-5 py-2.5 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Member Modal */}
        {memberToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#35362c]/50 p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-2xl border border-[#c3c8c1] bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#DC5C5C]">
                <Trash2 size={22} />
              </div>

              <h2 className="text-xl font-semibold">Remove team member?</h2>
              <p className="mt-2 text-sm leading-6 text-[#7a7359]">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-[#35362c]">
                  {memberToRemove.name}
                </span>{" "}
                from this project? They will no longer be assigned to the
                project.
              </p>

              <div className="mt-7 flex justify-end gap-3">
                <button
                  onClick={() => setMemberToRemove(null)}
                  disabled={teamSaving}
                  className="rounded-lg border border-[#c3c8c1] px-5 py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveMember}
                  disabled={teamSaving}
                  className="rounded-lg bg-[#DC5C5C] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {teamSaving ? "Removing..." : "Remove Member"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectDetails;
