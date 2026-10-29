import { useEffect, useMemo, useState } from "react";
import {
  ScrollText,
  Search,
  RefreshCw,
  AlertCircle,
  CalendarDays,
  UserRound,
} from "lucide-react";
import {
  GetPlatformAuditLogs,
  GetCompanyAuditLogs,
} from "../../services/auditlog";

const AuditLogs = ({ role, companyId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const isAdmin = role === "PLATFORM_ADMIN";

  const loadLogs = async () => {
    if (!isAdmin && !companyId) {
      setError("Company information is required to view audit logs.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = isAdmin
        ? await GetPlatformAuditLogs()
        : await GetCompanyAuditLogs(companyId);

      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.status === 403
          ? "You don't have permission to view these audit logs."
          : "Unable to load audit logs.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [role, companyId]);

  const actions = useMemo(
    () => [...new Set(logs.map((log) => log.action).filter(Boolean))],
    [logs],
  );

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const query = search.toLowerCase();

        const matchesSearch = [
          log.userName,
          log.action,
          log.entityType,
          log.details,
          log.entityId,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );

        return (
          matchesSearch &&
          (actionFilter === "ALL" || log.action === actionFilter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [logs, search, actionFilter]);

  const formatAction = (action) =>
    String(action || "UNKNOWN").replaceAll("_", " ");

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-full bg-transparent text-[#35362c]">
      <div className="mx-auto max-w-[1600px] py-5">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="mt-1 text-sm text-[#7a7359]">
              {isAdmin
                ? "Monitor platform activity and company registrations."
                : "Track activity across your company."}
            </p>
          </div>

          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#e2e4e6] bg-white px-4 py-2.5 text-sm font-medium hover:bg-[#f1f4d4] disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-3 rounded-xl border border-[#e2e4e6] bg-white px-4">
            <Search size={18} className="text-[#7a7359]" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search activity..."
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[#7a7359]"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="rounded-xl border border-[#e2e4e6] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="ALL">All actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {formatAction(action)}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e2e4e6] bg-white">
          <div className="flex items-center justify-between border-b border-[#e2e4e6] px-5 py-4">
            <div className="flex items-center gap-2">
              <ScrollText size={19} className="text-[#7a7359]" />
              <h2 className="text-sm font-bold">Activity History</h2>
            </div>

            <span className="text-xs text-[#7a7359]">
              {filteredLogs.length} records
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-[#7a7359]">
              Loading audit logs...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <AlertCircle size={30} className="text-[#7a7359]" />
              <p className="text-sm text-[#7a7359]">{error}</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <ScrollText size={36} className="mx-auto mb-3 text-[#7a7359]" />
              <p className="text-sm text-[#7a7359]">
                {logs.length === 0
                  ? "No activity recorded yet."
                  : "No matching activity found."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e2e4e6]">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-3 px-5 py-5 transition hover:bg-[#fafbf6] sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f4d4]">
                      <ScrollText size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">
                          {formatAction(log.action)}
                        </span>

                        {log.entityType && (
                          <span className="rounded-md bg-[#f5f6f3] px-2 py-1 text-[11px] text-[#7a7359]">
                            {log.entityType}
                          </span>
                        )}
                      </div>

                      {log.details && (
                        <p className="mt-2 break-words text-sm leading-6 text-[#62665d]">
                          {log.details}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#7a7359]">
                        <span className="flex items-center gap-1.5">
                          <UserRound size={14} />
                          {log.userName || "Unknown user"}
                        </span>

                        {log.entityId != null && (
                          <span>Entity ID: {log.entityId}</span>
                        )}

                        {log.companyId != null && isAdmin && (
                          <span>Company ID: {log.companyId}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 pl-[52px] text-xs text-[#7a7359] sm:pl-0">
                    <CalendarDays size={14} />
                    {formatDate(log.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
