import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Pencil,
  Archive,
  RefreshCw,
  ImagePlus,
  ExternalLink,
  Check,
  Send,
  Upload,
  Trash2,
} from "lucide-react";
import Client from "../../../services/api";
import { GetProjects } from "../../../services/project";
import {
  GetProjectUpdates,
  GetProjectUpdateById,
  CreateProjectUpdate,
  UpdateProjectUpdate,
  ArchiveProjectUpdate,
  ReviewProjectUpdate,
  ShareProjectUpdate,
} from "../../../services/projectupdate";
import {
  GetProjectUpdateAttachments,
  UploadProjectUpdateAttachment,
} from "../../../services/attachment";

const ProjectUpdates = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState(params.get("projectId") || "");
  const [status, setStatus] = useState("ALL");

  const [selected, setSelected] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [sharing, setSharing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: "",
  });
  const [review, setReview] = useState({ status: "APPROVED", reviewNote: "" });
  const [share, setShare] = useState({
    customerEmail: "",
    subject: "",
    message: "",
  });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [preview, setPreview] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);

  const card = "rounded-xl border border-[#c3c8c1] bg-white p-5";
  const input =
    "mt-2 w-full rounded-lg border border-[#c3c8c1] bg-white p-3 text-sm outline-none focus:border-[#7a7359]";
  const primary =
    "flex items-center justify-center gap-2 rounded-lg bg-[#d4e14b] px-4 py-2.5 text-sm font-semibold disabled:opacity-50";
  const secondary =
    "flex items-center justify-center gap-2 rounded-lg border border-[#c3c8c1] bg-white px-4 py-2.5 text-sm font-medium";
  const overlay =
    "fixed inset-0 z-50 flex items-center justify-center bg-[#35362c]/50 p-4";
  const modal =
    "max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-[#f5f6f3] p-6 shadow-2xl";

  const getId = (item) => item.id ?? item.projectId;

  const getProject = (id) =>
    projects.find((project) => Number(getId(project)) === Number(id));

  const hasRole = (id, role) =>
    memberships.some(
      (member) =>
        member.status === "ACTIVE" &&
        member.role === role &&
        Number(member.companyId) === Number(getProject(id)?.companyId),
    );

  const canReview = (update) =>
    update.status === "PENDING" &&
    (hasRole(update.projectId, "OWNER") ||
      hasRole(update.projectId, "MANAGER"));

  const canEdit = (update) =>
    update.status === "PENDING" &&
    memberships.some(
      (member) =>
        member.role === "WORKER" &&
        member.status === "ACTIVE" &&
        Number(member.id ?? member.membershipId) ===
          Number(update.updatedByMembershipId),
    );

  const canShare = (update) =>
    update.status === "APPROVED" &&
    (hasRole(update.projectId, "OWNER") ||
      hasRole(update.projectId, "MANAGER"));

  const statusColor = (value) => {
    if (value === "APPROVED") return "bg-green-100 text-green-800";
    if (value === "REJECTED") return "bg-red-100 text-red-700";
    return "bg-[#d4e14b] text-[#35362c]";
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [projectData, profile] = await Promise.all([
        GetProjects(),
        Client.get("/users/profile"),
      ]);

      const list = Array.isArray(projectData) ? projectData : [];
      setProjects(list);
      setMemberships(profile.data.memberships || []);

      const results = await Promise.allSettled(
        list.map((project) => GetProjectUpdates(getId(project))),
      );

      setUpdates(
        results.flatMap((result) =>
          result.status === "fulfilled" && Array.isArray(result.value)
            ? result.value
            : [],
        ),
      );

      if (results.some((result) => result.status === "rejected")) {
        setError("Some updates could not be loaded.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load updates.");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setProjectId(params.get("projectId") || "");
  }, [params]);

  useEffect(() => {
    const list = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviews(list);

    return () => list.forEach((item) => URL.revokeObjectURL(item.url));
  }, [files]);

  useEffect(() => {
    const id = params.get("updateId");
    if (!id || loading || selected) return;

    const update = updates.find((item) => String(item.id) === id);
    if (update) openDetails(update);
  }, [params, updates, loading, selected]);

  const openDetails = async (update) => {
    setSelected(update);
    setAttachments([]);
    setError("");

    try {
      const data = await GetProjectUpdateAttachments(update.id);
      setAttachments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Unable to load attachments.");
    }
  };

  const closeDetails = () => {
    setSelected(null);
    if (params.has("updateId")) {
      const next = new URLSearchParams(params);
      next.delete("updateId");
      setParams(next);
    }
  };

  const openForm = (update = null) => {
    setEditing(update);
    setForm({
      projectId: String(update?.projectId || projectId),
      title: update?.title || "",
      description: update?.description || "",
    });
    setFiles([]);
    setError("");
    setShowForm(true);
  };

  const saveUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data = {
        projectId: Number(form.projectId),
        title: form.title.trim(),
        description: form.description.trim(),
      };

      const saved = editing
        ? await UpdateProjectUpdate(editing.id, data)
        : await CreateProjectUpdate(data);

      let failed = 0;

      for (const file of files) {
        try {
          await UploadProjectUpdateAttachment(
            file,
            Number(form.projectId),
            saved.id ?? editing?.id,
          );
        } catch (err) {
          failed++;
        }
      }

      setShowForm(false);
      setFiles([]);
      setMessage(
        failed
          ? `${failed} file(s) failed to upload.`
          : "Update saved successfully.",
      );
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save update.");
    }

    setSaving(false);
  };

  const archiveUpdate = async () => {
    if (!window.confirm("Archive this update?")) return;
    setSaving(true);

    try {
      await ArchiveProjectUpdate(selected.id);
      closeDetails();
      setMessage("Update archived successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to archive update.");
    }

    setSaving(false);
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await ReviewProjectUpdate(reviewing.id, review);
      const updated = await GetProjectUpdateById(reviewing.id);
      setUpdates((old) =>
        old.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (selected?.id === updated.id) setSelected(updated);
      setReviewing(null);
      setMessage("Review submitted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to review update.");
    }

    setSaving(false);
  };

  const submitShare = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await ShareProjectUpdate(sharing.id, share);
      setSharing(null);
      setMessage("Update shared successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to share update.");
    }

    setSaving(false);
  };

  const active = updates.filter((update) => update.status !== "ARCHIVED");

  const filtered = active.filter(
    (update) =>
      (!projectId || String(update.projectId) === projectId) &&
      (status === "ALL" || update.status === status) &&
      [
        update.title,
        update.description,
        update.projectName,
        update.updatedByName,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
  );

  const projectUpdates = active.filter(
    (update) => !projectId || String(update.projectId) === projectId,
  );

  const workerProjects = projects.filter(
    (project) =>
      hasRole(getId(project), "WORKER") && project.status !== "ARCHIVED",
  );

  return (
    <div className="min-h-screen bg-transparent px-5 py-8 text-[#35362c] md:px-12">
      <main className="mx-auto max-w-7xl space-y-5">
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={17} /> Back to Projects
        </button>

        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-[#7a7359]">
                Workspace / Project Updates
              </p>
              <h1 className="text-3xl font-semibold">Project Updates</h1>
              <p className="mt-2 text-sm text-[#7a7359]">
                Track construction progress, review updates, and share approved
                reports.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={loadData} className={secondary}>
                <RefreshCw size={16} /> Refresh
              </button>
              {workerProjects.length > 0 && (
                <button onClick={() => openForm()} className={primary}>
                  <Plus size={17} /> New Update
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#c3c8c1] pt-5 md:grid-cols-4">
            {[
              ["Total Updates", projectUpdates.length],
              [
                "Pending",
                projectUpdates.filter((u) => u.status === "PENDING").length,
              ],
              [
                "Approved",
                projectUpdates.filter((u) => u.status === "APPROVED").length,
              ],
              [
                "Rejected",
                projectUpdates.filter((u) => u.status === "REJECTED").length,
              ],
            ].map(([name, value]) => (
              <div key={name}>
                <p className="text-xs text-[#7a7359]">{name}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={card}>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium">
              Search Updates
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-5 text-[#7a7359]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search updates"
                  className={`${input} pl-10`}
                />
              </div>
            </label>

            <label className="text-sm font-medium">
              Project
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setParams(
                    e.target.value ? { projectId: e.target.value } : {},
                  );
                }}
                className={input}
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={getId(project)} value={getId(project)}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={input}
              >
                {["ALL", "PENDING", "APPROVED", "REJECTED"].map((item) => (
                  <option key={item} value={item}>
                    {item === "ALL" ? "All Statuses" : item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {message && (
          <div className="flex justify-between rounded-xl bg-white p-4 text-sm">
            {message}
            <button onClick={() => setMessage("")}>
              <X size={16} />
            </button>
          </div>
        )}

        {error && !showForm && !reviewing && !sharing && !selected && (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <div className={card}>Loading updates...</div>
        ) : filtered.length === 0 ? (
          <div className={`${card} py-14 text-center`}>
            <ImagePlus size={32} className="mx-auto text-[#7a7359]" />
            <h2 className="mt-3 text-lg font-semibold">No updates found</h2>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((update) => (
              <div
                key={update.id}
                role="button"
                tabIndex={0}
                onClick={() => openDetails(update)}
                onKeyDown={(e) => {
                  if (
                    e.target === e.currentTarget &&
                    (e.key === "Enter" || e.key === " ")
                  ) {
                    e.preventDefault();
                    openDetails(update);
                  }
                }}
                className="flex min-h-[260px] cursor-pointer flex-col rounded-xl border border-[#c3c8c1] bg-white p-6 transition hover:border-[#b4c25b] hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor(update.status)}`}
                  >
                    {update.status}
                  </span>
                  <span className="text-xs text-[#7a7359]">#{update.id}</span>
                </div>

                <h3 className="mt-5 line-clamp-2 text-xl font-semibold">
                  {update.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#7a7359]">
                  {update.description || "No description provided."}
                </p>

                <div className="mt-auto border-t border-[#e2e4e6] pt-4">
                  <p className="truncate text-sm font-medium">
                    {update.projectName || getProject(update.projectId)?.name}
                  </p>
                  <p className="mt-1 text-xs text-[#7a7359]">
                    By {update.updatedByName || "Unknown"}
                  </p>

                  <div className="mt-4 flex justify-end gap-2">
                    {canReview(update) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewing(update);
                          setReview({ status: "APPROVED", reviewNote: "" });
                          setError("");
                        }}
                        className={primary}
                      >
                        <Check size={14} /> Review
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetails(update);
                      }}
                      className={secondary}
                    >
                      <ExternalLink size={14} /> View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className={overlay}>
            <div className={`${modal} max-w-4xl`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#7a7359]">
                    Project Update #{selected.id}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {selected.title}
                  </h2>
                </div>
                <button onClick={closeDetails}>
                  <X size={20} />
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-white p-4">
                <p className="font-semibold">
                  {selected.projectName || getProject(selected.projectId)?.name}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${statusColor(selected.status)}`}
                >
                  {selected.status}
                </span>
              </div>

              <div className="mt-4 space-y-4 rounded-xl bg-white p-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#7a7359]">Submitted By</p>
                    <p className="font-medium">
                      {selected.updatedByName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#7a7359]">Reviewed By</p>
                    <p className="font-medium">
                      {selected.reviewedByName || "Not reviewed"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold">Description</p>
                  <p className="mt-2 whitespace-pre-wrap text-[#7a7359]">
                    {selected.description || "No description provided."}
                  </p>
                </div>
                {selected.reviewNote && (
                  <div className="border-t pt-3">
                    <p className="font-semibold">Review Note</p>
                    <p className="mt-2 text-[#7a7359]">{selected.reviewNote}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-xl bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <ImagePlus size={17} /> Construction Progress Images
                </h3>
                {attachments.length === 0 ? (
                  <p className="text-sm text-[#7a7359]">
                    No attachments found.
                  </p>
                ) : (
                  <div className="flex flex-wrap justify-center gap-3">
                    {attachments.map((item) => (
                      <a
                        key={item.id}
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full max-w-[220px] overflow-hidden rounded-lg border"
                      >
                        <div className="flex h-36 items-center justify-center bg-[#f5f6f3] p-2">
                          {item.fileType?.startsWith("image/") ? (
                            <img
                              src={item.fileUrl}
                              alt={item.fileName}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <ExternalLink size={25} />
                          )}
                        </div>
                        <p className="truncate p-2 text-xs">{item.fileName}</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                {canEdit(selected) && (
                  <>
                    <button
                      onClick={() => {
                        openForm(selected);
                        closeDetails();
                      }}
                      className={secondary}
                    >
                      <Pencil size={15} /> Edit
                    </button>
                    <button
                      onClick={archiveUpdate}
                      disabled={saving}
                      className={secondary}
                    >
                      <Archive size={15} /> Archive
                    </button>
                  </>
                )}

                {canReview(selected) && (
                  <button
                    onClick={() => {
                      setReviewing(selected);
                      setReview({ status: "APPROVED", reviewNote: "" });
                      setError("");
                    }}
                    className={primary}
                  >
                    <Check size={15} /> Review
                  </button>
                )}

                {canShare(selected) && (
                  <button
                    onClick={() => {
                      setSharing(selected);
                      setShare({
                        customerEmail: "",
                        subject: `Project Update: ${selected.title}`,
                        message: "",
                      });
                      setError("");
                    }}
                    className={primary}
                  >
                    <Send size={15} /> Share with Customer
                  </button>
                )}

                <button onClick={closeDetails} className={secondary}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {reviewing && (
          <div className={`${overlay} z-[60]`}>
            <div className={`${modal} max-w-lg`}>
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Review Update</h2>
                  <p className="mt-2 text-sm text-[#7a7359]">
                    {reviewing.title}
                  </p>
                </div>
                <button onClick={() => setReviewing(null)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitReview} className="mt-5 space-y-4">
                <label className="block text-sm font-medium">
                  Decision
                  <select
                    value={review.status}
                    onChange={(e) =>
                      setReview({ ...review, status: e.target.value })
                    }
                    className={input}
                  >
                    <option value="APPROVED">Approve</option>
                    <option value="REJECTED">Reject</option>
                  </select>
                </label>

                <label className="block text-sm font-medium">
                  Review Note
                  <textarea
                    rows={4}
                    value={review.reviewNote}
                    onChange={(e) =>
                      setReview({ ...review, reviewNote: e.target.value })
                    }
                    className={input}
                  />
                </label>

                {error && <p className="text-sm text-red-700">{error}</p>}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewing(null)}
                    className={secondary}
                  >
                    Cancel
                  </button>
                  <button disabled={saving} className={primary}>
                    <Check size={16} />{" "}
                    {saving ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {sharing && (
          <div className={`${overlay} z-[60]`}>
            <div className={`${modal} max-w-lg`}>
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">Share Update</h2>
                <button onClick={() => setSharing(null)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitShare} className="mt-5 space-y-4">
                {[
                  ["customerEmail", "Customer Email"],
                  ["subject", "Subject"],
                  ["message", "Message"],
                ].map(([key, name]) => (
                  <label key={key} className="block text-sm font-medium">
                    {name}
                    {key === "message" ? (
                      <textarea
                        rows={3}
                        value={share[key]}
                        onChange={(e) =>
                          setShare({ ...share, [key]: e.target.value })
                        }
                        className={input}
                      />
                    ) : (
                      <input
                        required
                        type={key === "customerEmail" ? "email" : "text"}
                        value={share[key]}
                        onChange={(e) =>
                          setShare({ ...share, [key]: e.target.value })
                        }
                        className={input}
                      />
                    )}
                  </label>
                ))}

                {error && <p className="text-sm text-red-700">{error}</p>}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSharing(null)}
                    className={secondary}
                  >
                    Cancel
                  </button>
                  <button disabled={saving} className={primary}>
                    <Send size={15} /> {saving ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showForm && (
          <div className={`${overlay} z-[60]`}>
            <div className={`${modal} max-w-3xl`}>
              <div className="flex justify-between">
                <h2 className="text-2xl font-semibold">
                  {editing ? "Edit Update" : "New Project Update"}
                </h2>
                <button onClick={() => setShowForm(false)} disabled={saving}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveUpdate} className="mt-5 space-y-4">
                <label className="block text-sm font-medium">
                  Project
                  <select
                    required
                    disabled={Boolean(editing)}
                    value={form.projectId}
                    onChange={(e) =>
                      setForm({ ...form, projectId: e.target.value })
                    }
                    className={input}
                  >
                    <option value="">Select Project</option>
                    {workerProjects.map((project) => (
                      <option key={getId(project)} value={getId(project)}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>

                {["title", "description"].map((key) => (
                  <label key={key} className="block text-sm font-medium">
                    {key === "title" ? "Title" : "Description"}
                    {key === "title" ? (
                      <input
                        required
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        className={input}
                      />
                    ) : (
                      <textarea
                        rows={5}
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        className={input}
                      />
                    )}
                  </label>
                ))}

                <div>
                  <p className="text-sm font-medium">
                    Progress Images & Attachments
                  </p>
                  <label className="mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#c3c8c1] bg-white p-6 hover:border-[#b4c25b]">
                    <Upload size={26} className="text-[#7a7359]" />
                    <span className="text-sm font-semibold">
                      Click to select images or attachments
                    </span>
                    <span className="text-xs text-[#7a7359]">
                      You can add multiple files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        setFiles([
                          ...files,
                          ...Array.from(e.target.files || []),
                        ]);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>

                  {previews.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-3 flex justify-between">
                        <p className="text-sm font-semibold">
                          Selected Files ({files.length})
                        </p>
                        <button
                          type="button"
                          onClick={() => setFiles([])}
                          className="flex gap-1 text-xs text-red-600"
                        >
                          <Trash2 size={13} /> Remove All
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {previews.map((item, index) => (
                          <div
                            key={index}
                            className="relative overflow-hidden rounded-xl border bg-white"
                          >
                            <button
                              type="button"
                              onClick={() => setPreview(item)}
                              className="flex h-32 w-full items-center justify-center bg-[#f5f6f3] p-2"
                            >
                              {item.file.type.startsWith("image/") ? (
                                <img
                                  src={item.url}
                                  alt={item.file.name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <ExternalLink size={25} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setFiles(files.filter((_, i) => i !== index))
                              }
                              className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-600 shadow"
                            >
                              <X size={15} />
                            </button>
                            <p className="truncate p-2 text-xs">
                              {item.file.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-red-700">{error}</p>}

                <div className="flex justify-end gap-2 border-t pt-5">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className={secondary}
                  >
                    Cancel
                  </button>
                  <button disabled={saving} className={primary}>
                    {saving
                      ? "Saving..."
                      : editing
                        ? "Save Changes"
                        : "Create Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {preview && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-5">
            <button
              onClick={() => setPreview(null)}
              className="absolute right-6 top-6 rounded-full bg-white p-2"
            >
              <X size={22} />
            </button>
            {preview.file.type.startsWith("image/") ? (
              <img
                src={preview.url}
                alt={preview.file.name}
                className="max-h-[85vh] max-w-full object-contain"
              />
            ) : (
              <iframe
                src={preview.url}
                title={preview.file.name}
                className="h-[85vh] w-full max-w-4xl bg-white"
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectUpdates;
