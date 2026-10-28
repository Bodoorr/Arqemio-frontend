import { useState } from "react";
import {
  Building2,
  Users,
  Plus,
  Search,
  Bell,
  ArrowUpRight,
} from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-[#e2e4e6] text-[#35362c]">
      <main className="mx-auto w-full max-w-[1600px] px-5 py-6 md:px-9 lg:px-12">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#7a7359]">Arqemio / Platform</p>

            <h1 className="mt-1 text-2xl font-medium tracking-tight md:text-3xl">
              {activeTab}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c3c8c1] bg-white/60"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("Companies")}
              className="flex items-center gap-2 rounded-full bg-[#d4e14b] px-5 py-3 text-sm font-medium hover:brightness-95"
            >
              <Plus size={17} />
              <span>New Company</span>
            </button>
          </div>
        </header>

        {activeTab === "Overview" && (
          <>
            <section className="relative mb-5 overflow-hidden rounded-[24px] bg-[#35362c] px-7 py-9 text-white md:px-10">
              <div className="relative z-10 max-w-lg">
                <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[#d4e14b]">
                  Platform Overview
                </p>

                <h2 className="text-3xl font-light leading-tight tracking-tight md:text-4xl">
                  Building better
                  <br />
                  project management.
                </h2>

                <p className="mt-5 max-w-md text-sm leading-6 text-[#c3c8c1]">
                  Manage registered construction companies and their owners from
                  one workspace.
                </p>
              </div>

              <div className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full border-[45px] border-[#d4e14b]/20 md:h-80 md:w-80" />
            </section>

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  label: "Registered Companies",
                  value: "—",
                  description: "Companies on Arqemio",
                  icon: Building2,
                },
                {
                  label: "Company Owners",
                  value: "—",
                  description: "Registered owners",
                  icon: Users,
                },
                {
                  label: "Platform Activity",
                  value: "—",
                  description: "Activity overview",
                  icon: ArrowUpRight,
                },
              ].map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.label}
                    className="rounded-[22px] border border-[#c3c8c1] bg-white/75 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-[#7a7359]">{card.label}</p>

                      <Icon size={19} strokeWidth={1.6} />
                    </div>

                    <p className="mt-9 text-4xl font-light tracking-tight">
                      {card.value}
                    </p>

                    <p className="mt-2 text-xs text-[#7a7359]">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <section className="rounded-[24px] border border-[#c3c8c1] bg-white/75 p-6 md:p-8">
              <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium">Registered Companies</h2>

                  <p className="mt-1 text-sm text-[#7a7359]">
                    Overview of companies on the platform
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("Companies")}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  View all
                  <ArrowUpRight size={16} />
                </button>
              </div>

              <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-[#c3c8c1] text-center">
                <Building2
                  size={28}
                  strokeWidth={1.4}
                  className="mb-3 text-[#7a7359]"
                />

                <p className="text-sm font-medium">
                  Company data will appear here
                </p>

                <p className="mt-1 text-xs text-[#7a7359]">
                  Company information will be loaded from the backend.
                </p>
              </div>
            </section>
          </>
        )}

        {activeTab === "Companies" && (
          <section className="rounded-[24px] border border-[#c3c8c1] bg-white/75 p-6 md:p-8">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-medium">Companies</h2>

                <p className="mt-1 text-sm text-[#7a7359]">
                  Manage registered construction companies.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[#c3c8c1] px-4 py-2">
                <Search size={17} className="text-[#7a7359]" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search companies"
                  className="w-40 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-[#c3c8c1] px-5 py-14 text-center text-sm text-[#7a7359]">
              Company list and creation form will be connected next.
            </div>
          </section>
        )}

        {activeTab === "Owners" && (
          <section className="rounded-[24px] border border-[#c3c8c1] bg-white/75 p-8">
            <h2 className="text-xl font-medium">Company Owners</h2>

            <p className="mt-2 text-sm text-[#7a7359]">
              View company owners and their associated companies.
            </p>

            <div className="mt-8 rounded-xl border border-dashed border-[#c3c8c1] px-5 py-14 text-center text-sm text-[#7a7359]">
              Owner information will appear here.
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
