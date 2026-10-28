import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Building2,
  CalendarDays,
  UserRound,
  Clock3,
  Boxes,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  GetEquipmentById,
  GetAllReservations,
  GetEquipmentAvailability,
} from "../../services/equipment";

const formatDate = (date) =>
  new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const localDateTime = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const EquipmentDetails = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [available, setAvailable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState(() => localDateTime(new Date()));

  const [endDate, setEndDate] = useState(() =>
    localDateTime(new Date(Date.now() + 60 * 60 * 1000)),
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [equipmentData, reservationData] = await Promise.all([
          GetEquipmentById(equipmentId),
          GetAllReservations(),
        ]);

        if (!active) return;

        setEquipment(equipmentData);
        setReservations(
          reservationData.filter(
            (reservation) =>
              Number(reservation.equipmentId) === Number(equipmentId),
          ),
        );
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || "Unable to load equipment details.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [equipmentId]);

  useEffect(() => {
    if (!equipment || !startDate || !endDate) return;

    if (new Date(endDate) <= new Date(startDate)) {
      setAvailable(null);
      return;
    }

    let active = true;

    const check = async () => {
      setChecking(true);

      try {
        const quantity = await GetEquipmentAvailability(
          equipmentId,
          startDate,
          endDate,
        );

        if (active) setAvailable(quantity);
      } catch {
        if (active) setAvailable(null);
      } finally {
        if (active) setChecking(false);
      }
    };

    check();

    return () => {
      active = false;
    };
  }, [equipmentId, equipment, startDate, endDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e2e4e6] p-10 text-[#7a7359]">
        Loading equipment details...
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-[#e2e4e6] p-10">
        <p className="text-red-700">{error || "Equipment not found."}</p>
        <button
          onClick={() => navigate("/equipment")}
          className="mt-4 underline"
        >
          Back to Equipment
        </button>
      </div>
    );
  }

  const now = new Date();

  const activeReservations = reservations.filter(
    (reservation) =>
      reservation.status === "RESERVED" &&
      new Date(reservation.startDateTime) <= now &&
      new Date(reservation.endDateTime) > now,
  );

  const upcomingReservations = reservations
    .filter(
      (reservation) =>
        reservation.status === "RESERVED" &&
        new Date(reservation.startDateTime) > now,
    )
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  const reservedNow = activeReservations.reduce(
    (total, reservation) => total + reservation.quantity,
    0,
  );

  const availableNow = Math.max(0, equipment.quantity - reservedNow);

  const isOperational = equipment.status === "AVAILABLE";

  const isFullyBooked = isOperational && available !== null && available === 0;

  const displayStatus = !isOperational
    ? equipment.status
    : isFullyBooked
      ? "FULLY BOOKED"
      : available !== null
        ? "AVAILABLE"
        : "CHECK AVAILABILITY";

  const cardClass = "rounded-2xl border border-[#c3c8c1] bg-white/80 p-6";

  return (
    <div className="min-h-screen bg-[#e2e4e6] px-5 py-8 text-[#35362c] md:px-12">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/equipment")}
          className="mb-8 flex items-center gap-2 text-sm text-[#7a7359] hover:text-[#35362c]"
        >
          <ArrowLeft size={17} />
          Back to Equipment
        </button>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#7a7359]">
              Equipment / Details
            </p>
            <h1 className="text-4xl font-medium">{equipment.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-[#7a7359]">
              <Building2 size={16} />
              {equipment.companyName}
            </p>
          </div>

          <span className="rounded-full bg-[#d4e14b] px-5 py-2 text-xs font-semibold tracking-wide">
            {displayStatus.replaceAll("_", " ")}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-[#c3c8c1] bg-[#f0f1ed]">
            {equipment.imageUrl ? (
              <img
                src={equipment.imageUrl}
                alt={equipment.name}
                className="h-80 w-full object-cover lg:h-full lg:max-h-[440px]"
              />
            ) : (
              <div className="flex h-80 items-center justify-center">
                <Package size={72} className="text-[#a5aa9e]" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                title: "Total Units",
                value: equipment.quantity,
                icon: Boxes,
              },
              {
                title: "Reserved Now",
                value: reservedNow,
                icon: CalendarDays,
              },
              {
                title: "Available Now",
                value: isOperational ? availableNow : "—",
                icon: CheckCircle2,
              },
              {
                title: "Upcoming Bookings",
                value: upcomingReservations.length,
                icon: Clock3,
              },
            ].map((item) => (
              <div key={item.title} className={cardClass}>
                <item.icon size={20} className="mb-5 text-[#7a7359]" />
                <p className="text-3xl font-semibold">{item.value}</p>
                <p className="mt-2 text-xs text-[#7a7359]">{item.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className={cardClass}>
            <h2 className="mb-4 text-xl font-medium">About this Equipment</h2>
            <p className="text-sm leading-7 text-[#7a7359]">
              {equipment.description || "No description has been added."}
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="mb-2 text-xl font-medium">Check Availability</h2>
            <p className="mb-5 text-sm text-[#7a7359]">
              Select a booking period to see how many units are available.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs text-[#7a7359]">
                  Start
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-[#c3c8c1] bg-white p-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-[#7a7359]">End</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-[#c3c8c1] bg-white p-3 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-[#e2e4e6] p-4">
              {new Date(endDate) <= new Date(startDate) ? (
                <p className="text-sm text-red-700">
                  End date must be after start date.
                </p>
              ) : checking ? (
                <p className="text-sm">Checking availability...</p>
              ) : !isOperational ? (
                <p className="text-sm">
                  Equipment is currently {equipment.status}.
                </p>
              ) : available === null ? (
                <p className="text-sm">Availability could not be determined.</p>
              ) : (
                <div className="flex items-center gap-3">
                  {available === 0 ? (
                    <AlertCircle size={22} />
                  ) : (
                    <CheckCircle2 size={22} />
                  )}
                  <div>
                    <p className="font-semibold">
                      {available === 0
                        ? "Fully Booked"
                        : `${available} units available`}
                    </p>
                    <p className="text-xs text-[#7a7359]">
                      For the selected booking period
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className={`${cardClass} mt-6`}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium">Reservation History</h2>
              <p className="mt-1 text-sm text-[#7a7359]">
                See who booked this equipment and for which project.
              </p>
            </div>
            <span className="rounded-full bg-[#e2e4e6] px-3 py-1 text-xs">
              {reservations.length} bookings
            </span>
          </div>

          {reservations.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#7a7359]">
              No reservations for this equipment yet.
            </div>
          ) : (
            <div className="space-y-3">
              {[...reservations]
                .sort(
                  (a, b) =>
                    new Date(b.startDateTime) - new Date(a.startDateTime),
                )
                .map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#c3c8c1] bg-white p-5"
                  >
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        <UserRound size={16} />
                        {reservation.reservedByName}
                      </p>
                      <p className="mt-2 text-sm text-[#7a7359]">
                        Project: {reservation.projectName}
                      </p>
                      <p className="mt-1 text-xs text-[#7a7359]">
                        {formatDate(reservation.startDateTime)}
                        {" — "}
                        {formatDate(reservation.endDateTime)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">
                        {reservation.quantity} units
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-[#e2e4e6] px-3 py-1 text-xs">
                        {reservation.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default EquipmentDetails;
