import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Mail, Send, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { GetCompanyById } from "../../services/company";
import { SendInvitation } from "../../services/invitation";
import ErrorMessage from "../../components/ErrorMessage";

const CompanyDetails = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [ownerEmail, setOwnerEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [invitationError, setInvitationError] = useState("");
  const [invitationSuccess, setInvitationSuccess] = useState("");

  useEffect(() => {
    const loadCompany = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await GetCompanyById(companyId);
        setCompany(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load company details.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [companyId]);

  const handleInviteOwner = async (e) => {
    e.preventDefault();

    const email = ownerEmail.trim();

    if (!email) return;

    setSending(true);
    setInvitationError("");
    setInvitationSuccess("");

    try {
      const data = await SendInvitation({
        email,
        role: "OWNER",
        companyId: Number(companyId),
      });

      setInvitationSuccess(
        data?.message || "Owner invitation sent successfully.",
      );
      setOwnerEmail("");
    } catch (err) {
      setInvitationError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to send owner invitation.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent px-5 py-8 text-[#35362c] md:px-12">
      <main className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/admin/companies")}
          className="mb-12 flex items-center gap-2 text-sm text-[#7a7359] transition hover:text-[#35362c]"
        >
          <ArrowLeft size={16} />
          All companies
        </button>

        {loading ? (
          <p className="text-sm text-[#7a7359]">Loading company details...</p>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : company ? (
          <>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.15em] text-[#7a7359]">
                  Platform Administration / Companies
                </p>

                <h1 className="text-4xl font-normal tracking-tight">
                  {company.name}
                </h1>

                <p className="mt-3 text-sm text-[#7a7359]">
                  Company #{company.companyId}
                </p>
              </div>

              <span className="rounded-full border border-[#c3c8c1] bg-white/70 px-4 py-2 text-sm">
                {company.status}
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <section className="rounded-xl border border-[#c3c8c1] bg-white/75 p-7 md:col-span-2">
                <div className="mb-8 flex items-center gap-3">
                  <Building2 size={20} />
                  <h2 className="text-lg font-medium">Company information</h2>
                </div>

                <div className="grid gap-7 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-[#7a7359]">
                      Company name
                    </p>
                    <p className="text-sm">{company.name}</p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-[#7a7359]">
                      Location
                    </p>
                    <p className="text-sm">
                      {company.location || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-[#7a7359]">
                      Address
                    </p>
                    <p className="text-sm">
                      {company.address || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-[#7a7359]">
                      Status
                    </p>
                    <p className="text-sm">
                      {company.status || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 border-t border-[#c3c8c1] pt-7">
                  <p className="mb-3 text-xs uppercase tracking-wider text-[#7a7359]">
                    Description
                  </p>

                  <p className="text-sm leading-7 text-[#7a7359]">
                    {company.description || "No description provided."}
                  </p>
                </div>
              </section>

              <section className="h-fit rounded-xl border border-[#c3c8c1] bg-white/75 p-7">
                <div className="mb-4 flex items-center gap-3">
                  <UserRound size={20} />
                  <h2 className="text-lg font-medium">Company owners</h2>
                </div>

                {company.ownerName ? (
                  <div className="mb-6 rounded-lg bg-[#e2e4e6]/60 p-4">
                    <p className="mb-3 text-xs uppercase tracking-wider text-[#7a7359]">
                      Primary owner
                    </p>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                        <UserRound size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium">
                          {company.ownerName}
                        </p>

                        <p className="mt-1 break-all text-xs text-[#7a7359]">
                          {company.ownerEmail || "Email not available"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 rounded-lg bg-[#e2e4e6]/60 p-4">
                    <p className="text-sm text-[#7a7359]">
                      No primary owner assigned yet.
                    </p>
                  </div>
                )}

                <div className="border-t border-[#c3c8c1] pt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Mail size={17} />
                    <h3 className="text-sm font-medium">
                      Invite a company owner
                    </h3>
                  </div>

                  <p className="mb-5 text-sm leading-6 text-[#7a7359]">
                    Send an invitation to add an owner to this company.
                  </p>

                  {invitationSuccess && (
                    <div
                      role="status"
                      className="mb-4 rounded-lg border border-[#c3c8c1] bg-[#e2e4e6] px-4 py-3"
                    >
                      <p className="text-sm">{invitationSuccess}</p>
                    </div>
                  )}

                  {invitationError && (
                    <div className="mb-4">
                      <ErrorMessage message={invitationError} />
                    </div>
                  )}

                  <form onSubmit={handleInviteOwner} className="space-y-4">
                    <div>
                      <label
                        htmlFor="ownerEmail"
                        className="mb-2 block text-sm font-medium"
                      >
                        Owner email address
                      </label>

                      <input
                        id="ownerEmail"
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => {
                          setOwnerEmail(e.target.value);
                          setInvitationError("");
                          setInvitationSuccess("");
                        }}
                        placeholder="owner@example.com"
                        required
                        disabled={sending}
                        className="w-full rounded-lg border border-[#c3c8c1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#7a7359] disabled:opacity-60"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sending}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d4e14b] px-4 py-3 text-sm font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send size={16} />
                      {sending
                        ? "Sending invitation..."
                        : "Send owner invitation"}
                    </button>
                  </form>
                </div>
              </section>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#7a7359]">Company not found.</p>
        )}
      </main>
    </div>
  );
};

export default CompanyDetails;
