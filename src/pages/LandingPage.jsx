import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  FolderKanban,
  Users,
  HardHat,
  ChartNoAxesCombined,
} from "lucide-react";

const features = [
  {
    icon: FolderKanban,
    title: "Project Management",
    description:
      "Organize construction projects, monitor progress, and keep everything on track.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Connect project managers and workers through one organized workspace.",
  },
  {
    icon: HardHat,
    title: "Equipment Management",
    description:
      "Track construction equipment and manage reservations efficiently.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Real-Time Updates",
    description:
      "Stay informed about project activities, progress, and important updates.",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#f5f6f3] text-[#35362c]">
      {/* Navbar */}
      <nav className="relative bg-transparent">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold tracking-tight"
          >
            <Building2 size={25} />
            Arqemio
          </Link>

          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-10">
            <Link
              to="/"
              className="text-sm font-semibold transition hover:text-[#8e9c21]"
            >
              Home
            </Link>

            <Link
              to="/login"
              className="text-sm font-semibold transition hover:text-[#8e9c21]"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-[75vh] items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-5xl font-bold leading-[1.15] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Build Smarter.
            <br />
            Manage Better.
            <br />
            <span className="text-[#8e9c21]">Grow Together.</span>
          </h1>

          <Link
            to="/login"
            className="mt-12 inline-flex items-center gap-3 rounded-xl bg-[#d4e14b] px-9 py-4 text-base font-bold transition hover:bg-[#c5d43b]"
          >
            Get Started
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-[#e2e4e6] bg-white py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#8e9c21]">
              Our Features
            </p>

            <h2 className="mt-4 text-4xl font-bold">
              Everything you need to manage construction
            </h2>

            <p className="mt-5 text-[#7a7359]">
              Simplify project coordination with tools built to support every
              stage of construction.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-[#e2e4e6] bg-[#f5f6f3] p-7 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-6 inline-flex rounded-xl bg-[#d4e14b] p-3">
                  <Icon size={24} />
                </div>

                <h3 className="text-lg font-bold">{title}</h3>

                <p className="mt-3 text-sm leading-7 text-[#7a7359]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-transparent px-6 py-7">
        <p className="text-center text-xs text-[#7a7359]">
          © {new Date().getFullYear()} Arqemio. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
