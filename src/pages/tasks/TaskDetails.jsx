import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  RefreshCw,
  Pencil,
  X,
} from "lucide-react";
import Client from "../../services/api";
import ArqemioDateTimePicker from "../../components/ArqemioDateTimePicker";
import {
  GetTaskById,
  UpdateTask,
  AssignTaskWorker,
  RemoveTaskWorker,
  UpdateTaskStatus,
} from "../../services/task";

const input =
  "w-full rounded-lg border border-[#c3c8c1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a9b82b]";
const card = "rounded-2xl border border-[#c3c8c1] bg-white p-6";

const format = (value) => String(value || "").replaceAll("_", " ");

const date = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not set";

const Avatar = ({ name, picture }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d4e14b] font-semibold text-[#35362c]">
      {picture && !imageFailed ? (
        <img
          src={picture}
          alt={name || "Member"}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        (name || "?").charAt(0).toUpperCase()
      )}
    </div>
  );
};

const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [project, setProject] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [workerId, setWorkerId] = useState("");
  const [status, setStatus] = useState("");
  const [toRemove, setToRemove] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "PENDING",
    priority: "MEDIUM",
    dueDateTime: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const taskResponse = await GetTaskById(taskId);
      setTask(taskResponse);
      setStatus(taskResponse.status);
      setEditing(false);

      setForm({
        title: taskResponse.title || "",
        description: taskResponse.description || "",
        status: taskResponse.status || "PENDING",
        priority: taskResponse.priority || "MEDIUM",
        dueDateTime: taskResponse.dueDateTime
          ? taskResponse.dueDateTime.slice(0, 16)
          : "",
      });

      const results = await Promise.allSettled([
        Client.get(`/company/projects/${taskResponse.projectId}`),
        Client.get(`/company/projects/${taskResponse.projectId}/members`),
        Client.get("/users/profile"),
      ]);

      if (results[0].status === "fulfilled") setProject(results[0].value.data);

      if (results[1].status === "fulfilled")
        setMembers(results[1].value.data || []);

      if (results[2].status === "fulfilled")
        setMemberships(results[2].value.data.memberships || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load task.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [taskId]);

  const active = memberships.filter(
    (m) =>
      m.status === "ACTIVE" &&
      Number(m.companyId) === Number(project?.companyId),
  );

  const canManage = active.some(
    (m) =>
      m.role === "OWNER" ||
      (m.role === "MANAGER" &&
        members.some(
          (member) =>
            member.role === "MANAGER" &&
            Number(member.membershipId) === Number(m.membershipId),
        )),
  );

  const creatorName =
    task?.createdByName ||
    task?.creatorName ||
    task?.createdBy?.name ||
    task?.creator?.name ||
    null;

  const creatorPicture =
    task?.createdByProfilePicture ||
    task?.creatorProfilePicture ||
    task?.createdBy?.profilePicture ||
    task?.creator?.profilePicture ||
    null;

  const availableWorkers = members.filter(
    (member) =>
      member.role === "WORKER" &&
      !assigned.some(
        (a) => Number(a.membershipId) === Number(member.membershipId),
      ),
  );

  const assignWorker = async () => {
    if (!workerId || saving) return;

    setSaving(true);
    setError("");

    try {
      await AssignTaskWorker(taskId, {
        workerMembershipId: Number(workerId),
        assignedAt: null,
        dueAt: task.dueDateTime || null,
      });

      const worker = members.find(
        (m) => Number(m.membershipId) === Number(workerId),
      );

      setAssigned((previous) => [...previous, worker]);
      setWorkerId("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to assign worker.");
    } finally {
      setSaving(false);
    }
  };

  const removeWorker = async () => {
    if (!toRemove || saving) return;

    setSaving(true);
    setError("");

    try {
      await RemoveTaskWorker(taskId, toRemove.membershipId);

      setAssigned((previous) =>
        previous.filter((m) => m.membershipId !== toRemove.membershipId),
      );
      setToRemove(null);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove worker.");
    } finally {
      setSaving(false);
    }
  };

  const saveTask = async (event) => {
    event.preventDefault();
    if (saving || !task) return;

    if (!form.dueDateTime) {
      setError("Please select a due date.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await UpdateTask(taskId, {
        projectId: task.projectId,
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        dueDateTime: `${form.dueDateTime}:00`,
      });

      setTask(updated);
      setStatus(updated.status);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update task.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    if (saving || !task) return;

    setSaving(true);
    setError("");

    try {
      const updated = await UpdateTaskStatus(taskId, status);

      setTask(updated);
      setStatus(updated.status);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Only assigned workers can update this task's status.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e2e4e6] p-5 text-[#35362c] md:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/tasks")}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#7a7359] hover:text-[#35362c]"
        >
          <ArrowLeft size={18} />
          Back to Tasks
        </button>

        {loading ? (
          <div className={card}>Loading task...</div>
        ) : !task ? (
          <div className={card}>{error || "Task not found."}</div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#7a7359]">
                  {task.projectName}
                </p>
                <h1 className="mt-1 text-3xl font-bold">{task.title}</h1>
              </div>

              <div className="flex items-center gap-2">
                {canManage && task.status !== "ARCHIVED" && (
                  <button
                    onClick={() => {
                      setForm({
                        title: task.title || "",
                        description: task.description || "",
                        status: task.status,
                        priority: task.priority,
                        dueDateTime: task.dueDateTime
                          ? task.dueDateTime.slice(0, 16)
                          : "",
                      });
                      setEditing(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-[#d4e14b] px-4 py-2 text-sm font-semibold"
                  >
                    <Pencil size={16} />
                    Edit Task
                  </button>
                )}

                <button
                  onClick={loadData}
                  className="flex items-center gap-2 rounded-lg border border-[#c3c8c1] bg-white px-4 py-2 text-sm font-medium"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-3">
              <section className={`${card} lg:col-span-2`}>
                <h2 className="text-lg font-semibold">Task Information</h2>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#7a7359]">
                  {task.description || "No description provided."}
                </p>

                <div className="mt-6 grid gap-4 border-t border-[#e2e4e6] pt-5 sm:grid-cols-2">
                  {[
                    ["Status", format(task.status)],
                    ["Priority", format(task.priority)],
                    ["Due Date", date(task.dueDateTime)],
                    ["Created", date(task.createdAt)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-[#7a7359]">{label}</p>
                      <p className="mt-1 font-semibold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-[#e2e4e6] pt-5">
                  <p className="mb-3 text-xs font-medium text-[#7a7359]">
                    Created by
                  </p>

                  {creatorName ? (
                    <div className="flex items-center gap-3">
                      <Avatar name={creatorName} picture={creatorPicture} />
                      <span className="text-sm font-semibold">
                        {creatorName}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-[#7a7359]">
                      Creator information is not available for this task.
                    </p>
                  )}
                </div>

                {task.status !== "ARCHIVED" && (
                  <div className="mt-6 border-t border-[#e2e4e6] pt-5">
                    <h3 className="font-semibold">Update Status</h3>
                    <p className="mt-1 text-xs text-[#7a7359]">
                      Only workers assigned to this task can update its status.
                    </p>

                    <div className="mt-3 flex gap-2">
                      <select
                        className={input}
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        {["PENDING", "IN_PROGRESS", "COMPLETED"].map((s) => (
                          <option key={s} value={s}>
                            {format(s)}
                          </option>
                        ))}
                      </select>

                      <button
                        disabled={saving || status === task.status}
                        onClick={updateStatus}
                        className="rounded-lg bg-[#d4e14b] px-5 py-2 text-sm font-semibold disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className={card}>
                <div className="flex items-center gap-2">
                  <Users size={19} />
                  <h2 className="text-lg font-semibold">Task Workers</h2>
                </div>

                <p className="mt-3 text-xs leading-5 text-[#7a7359]">
                  Assign workers who are already members of this project.
                </p>

                <div className="mt-4 space-y-2">
                  {assigned.map((member) => (
                    <div
                      key={member.membershipId}
                      className="flex items-center justify-between rounded-lg border border-[#e2e4e6] p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={member.name}
                          picture={member.profilePicture || member.profileImage}
                        />
                        <span className="truncate text-sm font-medium">
                          {member.name}
                        </span>
                      </div>

                      {canManage && (
                        <button
                          onClick={() => setToRemove(member)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {canManage && task.status !== "ARCHIVED" && (
                  <div className="mt-5 space-y-3 border-t border-[#e2e4e6] pt-4">
                    <select
                      className={input}
                      value={workerId}
                      onChange={(e) => setWorkerId(e.target.value)}
                    >
                      <option value="">Select a project worker</option>
                      {availableWorkers.map((member) => (
                        <option
                          key={member.membershipId}
                          value={member.membershipId}
                        >
                          {member.name}
                        </option>
                      ))}
                    </select>

                    <button
                      disabled={!workerId || saving}
                      onClick={assignWorker}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d4e14b] px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                    >
                      <UserPlus size={17} />
                      {saving ? "Saving..." : "Assign Worker"}
                    </button>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#35362c]/60 p-4">
          <form
            onSubmit={saveTask}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-[#c3c8c1] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Edit Task</h2>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditing(false)}
              >
                <X size={20} />
              </button>
            </div>

            <label className="block text-sm font-medium">
              Task Title
              <input
                required
                className={`mt-2 ${input}`}
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
              />
            </label>

            <label className="block text-sm font-medium">
              Description
              <textarea
                rows={4}
                className={`mt-2 ${input}`}
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                Status
                <select
                  className={`mt-2 ${input}`}
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                    })
                  }
                >
                  {["PENDING", "IN_PROGRESS", "COMPLETED"].map((value) => (
                    <option key={value} value={value}>
                      {format(value)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium">
                Priority
                <select
                  className={`mt-2 ${input}`}
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value,
                    })
                  }
                >
                  {["LOW", "MEDIUM", "HIGH"].map((value) => (
                    <option key={value} value={value}>
                      {format(value)}
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
                onChange={(value) =>
                  setForm({
                    ...form,
                    dueDateTime: value,
                  })
                }
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditing(false)}
                className="rounded-lg border border-[#c3c8c1] px-5 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#d4e14b] px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#35362c]/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>

            <h2 className="text-xl font-semibold">Remove assigned worker?</h2>

            <p className="mt-2 text-sm text-[#7a7359]">
              Remove <strong>{toRemove.name}</strong> from this task?
            </p>

            <div className="mt-7 flex justify-end gap-3">
              <button
                disabled={saving}
                onClick={() => setToRemove(null)}
                className="rounded-lg border border-[#c3c8c1] px-5 py-2.5 text-sm"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                onClick={removeWorker}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Removing..." : "Remove Worker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;
