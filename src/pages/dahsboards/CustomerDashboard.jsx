import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  ImageIcon,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { GetCustomerSharedUpdates } from "../../services/projectshare";

export default function CustomerDashboard() {
  const [updates, setUpdates] = useState([]);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUpdates = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await GetCustomerSharedUpdates();
      const sharedUpdates = Array.isArray(data) ? data : [];

      setUpdates(sharedUpdates);
      setSelectedUpdate(sharedUpdates[0] || null);
      setActiveImage(0);
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Please sign in to view your project updates."
          : "Unable to load your project updates.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  const images = selectedUpdate?.images || [];

  const nextImage = () => {
    if (!images.length) return;
    setActiveImage((current) => (current + 1) % images.length);
  };

  const previousImage = () => {
    if (!images.length) return;
    setActiveImage((current) => (current - 1 + images.length) % images.length);
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const projects = [...new Set(updates.map((item) => item.projectName))];

  return (
    <div className="min-h-screen bg-[#f5f6f3] text-[#35362c] lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-5 py-5 sm:px-8 lg:h-full lg:min-h-0 lg:px-10 lg:py-6">
        <header className="mb-6 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4e14b]">
              <Building2 size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold">Arqemio</h1>
              <p className="text-[10px] tracking-[0.13em] text-[#7a7359]">
                CONSTRUCTION MANAGEMENT
              </p>
            </div>
          </div>

          <span className="hidden text-xs text-[#7a7359] sm:block">
            CUSTOMER PORTAL
          </span>
        </header>

        <div className="mb-5 flex shrink-0 items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              My Project Updates
            </h2>
            <p className="mt-1 text-sm text-[#7a7359]">
              Follow the latest progress shared with you.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUpdates}
            disabled={loading}
            aria-label="Refresh updates"
            className="rounded-lg p-2 text-[#7a7359] hover:bg-white disabled:opacity-50"
          >
            <RefreshCw size={19} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl bg-white">
            <p className="text-sm text-[#7a7359]">
              Loading your project updates...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl bg-white p-8">
            <div className="text-center">
              <AlertCircle size={40} className="mx-auto mb-4 text-[#7a7359]" />
              <p className="text-sm text-[#7a7359]">{error}</p>
            </div>
          </div>
        ) : updates.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-[#e2e4e6] bg-white p-8">
            <FolderKanban size={44} className="mb-4 text-[#7a7359]" />
            <h3 className="text-lg font-semibold">No project updates yet</h3>
            <p className="mt-2 text-center text-sm text-[#7a7359]">
              Updates shared with your email will appear here.
            </p>
          </div>
        ) : (
          <main className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-[#e2e4e6] bg-white lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="border-b border-[#e2e4e6] p-5 lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#7a7359]">
                Projects ({projects.length})
              </p>

              {projects.map((projectName) => (
                <div key={projectName} className="mb-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Building2 size={16} className="text-[#7a7359]" />
                    <h3 className="truncate text-sm font-semibold">
                      {projectName}
                    </h3>
                  </div>

                  <div className="space-y-1 border-l border-[#e2e4e6] pl-3">
                    {updates
                      .filter((item) => item.projectName === projectName)
                      .map((item, index) => {
                        const isSelected = selectedUpdate === item;

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setSelectedUpdate(item);
                              setActiveImage(0);
                            }}
                            className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                              isSelected
                                ? "bg-[#f1f4d4] text-[#35362c]"
                                : "text-[#7a7359] hover:bg-[#f5f6f3]"
                            }`}
                          >
                            <p className="truncate text-sm font-medium">
                              {item.updateTitle}
                            </p>
                            <p className="mt-1 text-[11px] opacity-70">
                              {formatDate(item.updateDate)}
                            </p>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </aside>

            {selectedUpdate && (
              <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <section className="flex min-h-0 flex-col p-6 lg:border-r lg:border-[#e2e4e6] lg:p-7">
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7a7359]">
                      Project Update
                    </p>

                    <h2 className="text-2xl font-bold tracking-tight">
                      {selectedUpdate.updateTitle}
                    </h2>

                    <p className="mt-2 text-sm text-[#7a7359]">
                      {selectedUpdate.companyName}
                    </p>

                    <div className="mt-6 flex items-start gap-3">
                      <Building2 size={18} className="mt-0.5 text-[#7a7359]" />
                      <div>
                        <p className="text-xs text-[#7a7359]">Project</p>
                        <p className="mt-1 text-sm font-semibold">
                          {selectedUpdate.projectName}
                        </p>
                      </div>
                    </div>

                    <div className="my-6 border-t border-[#e2e4e6]" />

                    <div className="mb-4 flex items-center gap-2 text-xs text-[#7a7359]">
                      <CalendarDays size={15} />
                      {formatDate(selectedUpdate.updateDate)}
                    </div>

                    <h3 className="mb-3 text-sm font-bold">
                      Progress Description
                    </h3>

                    <p className="whitespace-pre-line text-sm leading-7 text-[#62665d]">
                      {selectedUpdate.updateDescription ||
                        "No description provided."}
                    </p>
                  </div>
                </section>

                <section className="flex min-h-0 flex-col border-t border-[#e2e4e6] p-6 lg:border-t-0 lg:p-7">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={19} className="text-[#7a7359]" />
                      <h3 className="text-base font-bold">Progress Gallery</h3>
                    </div>

                    <span className="text-xs text-[#7a7359]">
                      {images.length
                        ? `${activeImage + 1} of ${images.length}`
                        : "No images"}
                    </span>
                  </div>

                  {images.length ? (
                    <>
                      <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-xl bg-[#f5f6f3] lg:min-h-0">
                        <img
                          src={images[activeImage]}
                          alt={`Progress ${activeImage + 1}`}
                          className="h-full w-full object-contain"
                        />

                        {images.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={previousImage}
                              aria-label="Previous image"
                              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm hover:bg-[#d4e14b]"
                            >
                              <ChevronLeft size={22} />
                            </button>

                            <button
                              type="button"
                              onClick={nextImage}
                              aria-label="Next image"
                              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm hover:bg-[#d4e14b]"
                            >
                              <ChevronRight size={22} />
                            </button>
                          </>
                        )}
                      </div>

                      {images.length > 1 && (
                        <div className="mt-4 flex shrink-0 gap-3 overflow-x-auto">
                          {images.map((image, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setActiveImage(index)}
                              aria-label={`View image ${index + 1}`}
                              className={`h-14 w-18 shrink-0 overflow-hidden rounded-lg border-2 ${
                                activeImage === index
                                  ? "border-[#b9ca2c]"
                                  : "border-transparent opacity-60"
                              }`}
                            >
                              <img
                                src={image}
                                alt={`Thumbnail ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-[#f5f6f3] text-[#7a7359]">
                      <ImageIcon size={36} className="mb-3 opacity-40" />
                      <p className="text-sm">No images attached</p>
                    </div>
                  )}
                </section>
              </div>
            )}
          </main>
        )}

        <footer className="shrink-0 pt-5 text-center text-[11px] text-[#7a7359]">
          Powered by Arqemio · Construction Project Management
        </footer>
      </div>
    </div>
  );
}
