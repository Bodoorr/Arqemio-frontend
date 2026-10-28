import { useEffect, useState } from "react";
import { ArrowLeft, Building2, MapPin, Mail } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { GetCompanyById } from "../../services/Company";
import ErrorMessage from "../../components/ErrorMessage";

const CompanyDetails = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCompany = async () => {
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

  return (
    <div className="min-h-screen bg-[#e2e4e6] px-5 py-8 text-[#35362c] md:px-12">
      <main className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/admin/companies")}
          className="mb-12 flex items-center gap-2 text-sm text-[#7a7359] hover:text-[#35362c]"
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
                    <p className="text-sm">{company.status}</p>
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
                <h2 className="mb-3 text-lg font-medium">Company owner</h2>

                <p className="mb-6 text-sm leading-6 text-[#7a7359]">
                  Owner invitations and assignments are managed separately.
                </p>

                <div className="flex items-center gap-3 rounded-lg bg-[#e2e4e6]/60 p-4">
                  <Mail size={18} />
                  <span className="text-sm">Invitation management</span>
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
