import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Clock3,
  ImageIcon,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LockKeyhole,
} from "lucide-react";
import { GetSharedProjectUpdate } from "../../services/projectshare";

export default function ProjectPreview() {
  const { token } = useParams();

  const [update, setUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let active = true;

    const loadUpdate = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await GetSharedProjectUpdate(token);

        if (active) {
          setUpdate(data);
          setActiveImage(0);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.detail ||
              "This project update link is invalid, expired, or has been revoked.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUpdate();

    return () => {
      active = false;
    };
  }, [token]);

  const images = update?.images || [];

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

  return (
    <div className="min-h-screen bg-[#f5f6f3] text-[#35362c] lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-5 py-5 sm:px-8 lg:h-full lg:min-h-0 lg:px-10 lg:py-6">
        {/* Header - no white background */}
        <header className="mb-6 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4e14b]">
              <Building2 size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">Arqemio</h1>

              <p className="text-[10px] tracking-[0.13em] text-[#7a7359]">
                CONSTRUCTION MANAGEMENT
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs font-medium text-[#7a7359] sm:flex">
            <LockKeyhole size={15} />
            Secure Project Preview
          </div>
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl bg-white">
            <div className="text-center">
              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-[#e2e4e6] border-t-[#d4e14b]" />
              <p className="text-sm text-[#7a7359]">
                Loading project update...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl bg-white p-8">
            <div className="max-w-md text-center">
              <AlertCircle size={44} className="mx-auto mb-4 text-[#7a7359]" />

              <h2 className="mb-3 text-2xl font-bold">Update unavailable</h2>

              <p className="text-sm leading-7 text-[#7a7359]">{error}</p>

              <p className="mt-4 text-sm text-[#7a7359]">
                Please contact the project team for a new viewing link.
              </p>
            </div>
          </div>
        ) : update ? (
          <main className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-[#e2e4e6] bg-white shadow-sm lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            {/* Left - Project information */}
            <section className="flex min-h-0 flex-col p-6 sm:p-8 lg:border-r lg:border-[#e2e4e6] lg:p-9">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a7359]">
                    Project Update
                  </span>

                  <span className="flex items-center gap-1.5 text-xs text-[#7a7359]">
                    <CalendarDays size={14} />
                    {formatDate(update.updateDate)}
                  </span>
                </div>

                <p className="mb-2 text-sm text-[#7a7359]">
                  {update.companyName}
                </p>

                <h2 className="text-2xl font-bold leading-tight tracking-tight xl:text-3xl">
                  {update.updateTitle}
                </h2>

                <div className="mt-7 flex items-start gap-3">
                  <Building2
                    size={19}
                    className="mt-0.5 shrink-0 text-[#7a7359]"
                  />

                  <div>
                    <p className="text-xs text-[#7a7359]">Project</p>
                    <p className="mt-1 text-sm font-semibold">
                      {update.projectName}
                    </p>
                  </div>
                </div>

                <div className="my-7 border-t border-[#e2e4e6]" />

                <h3 className="mb-3 text-sm font-bold">Progress Description</h3>

                <p className="whitespace-pre-line text-sm leading-7 text-[#62665d]">
                  {update.updateDescription ||
                    "No description provided for this update."}
                </p>
              </div>

              {/* Join Arqemio - integrated into same section */}
              <div className="mt-6 shrink-0 border-t border-[#e2e4e6] pt-5">
                <h3 className="text-sm font-bold">
                  Stay connected with your project
                </h3>

                <p className="mt-2 text-xs leading-6 text-[#7a7359]">
                  Create your customer account to access all project updates
                  shared with you in one place.
                </p>

                <Link
                  to={`/customer/register/${token}`}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#d4e14b] px-5 py-3 text-sm font-semibold transition-colors hover:bg-[#c5d23f]"
                >
                  Join Arqemio
                  <ArrowRight size={16} />
                </Link>

                <div className="mt-5 flex items-center gap-2 text-xs text-[#7a7359]">
                  <Clock3 size={14} />
                  <span>Preview expires {formatDate(update.expiresAt)}</span>
                </div>
              </div>
            </section>

            {/* Right - Image gallery */}
            <section className="flex min-h-0 flex-col border-t border-[#e2e4e6] p-6 sm:p-8 lg:border-t-0 lg:p-9">
              <div className="mb-5 flex shrink-0 items-center justify-between">
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

              {images.length > 0 ? (
                <>
                  <div className="group relative min-h-[280px] flex-1 overflow-hidden rounded-xl bg-[#f5f6f3] lg:min-h-0">
                    <img
                      src={images[activeImage]}
                      alt={`Construction progress ${activeImage + 1}`}
                      className="h-full w-full object-contain"
                    />

                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={previousImage}
                          aria-label="Previous image"
                          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-[#d4e14b]"
                        >
                          <ChevronLeft size={22} />
                        </button>

                        <button
                          type="button"
                          onClick={nextImage}
                          aria-label="Next image"
                          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-[#d4e14b]"
                        >
                          <ChevronRight size={22} />
                        </button>
                      </>
                    )}

                    <a
                      href={images[activeImage]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open full-size image"
                      className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-[#d4e14b]"
                    >
                      <ExternalLink size={14} />
                      Full image
                    </a>
                  </div>

                  {images.length > 1 && (
                    <div className="mt-4 flex shrink-0 gap-3 overflow-x-auto pb-1">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setActiveImage(index)}
                          aria-label={`View image ${index + 1}`}
                          aria-pressed={activeImage === index}
                          className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                            activeImage === index
                              ? "border-[#b9ca2c] opacity-100"
                              : "border-transparent opacity-60 hover:opacity-100"
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
                <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center rounded-xl bg-[#f5f6f3] text-[#7a7359]">
                  <ImageIcon size={38} className="mb-3 opacity-40" />
                  <p className="text-sm">No progress images attached</p>
                </div>
              )}
            </section>
          </main>
        ) : null}

        <footer className="shrink-0 pt-5 text-center text-[11px] text-[#7a7359]">
          Powered by Arqemio · Construction Project Management
        </footer>
      </div>
    </div>
  );
}
