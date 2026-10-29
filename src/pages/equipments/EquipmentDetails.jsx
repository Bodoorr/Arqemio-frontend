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
  LoaderCircle,
  CalendarPlus,
} from "lucide-react";
import { GetEquipmentById } from "../../services/equipment";
import {
  GetAllReservations,
  GetEquipmentAvailability,
} from "../../services/reservation";

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
  const [availabilityError, setAvailabilityError] = useState("");

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
      setAvailabilityError("");
      return;
    }

    let active = true;

    const check = async () => {
      setChecking(true);
      setAvailable(null);
      setAvailabilityError("");

      try {
        const quantity = await GetEquipmentAvailability(
          equipmentId,
          startDate,
          endDate,
        );

        if (active) setAvailable(Number(quantity));
      } catch (err) {
        if (active) {
          setAvailable(null);
          setAvailabilityError(
            err.response?.data?.message || "Unable to check availability.",
          );
        }
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
      <div className="flex min-h-screen items-center justify-center gap-3 bg-[#e2e4e6] text-[#7a7359]">
        <LoaderCircle size={22} className="animate-spin" />
        Loading equipment...
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="min-h-screen bg-[#e2e4e6] p-8">
        <p className="text-red-700">{error || "Equipment not found."}</p>

        <button
          onClick={() => navigate("/equipment")}
          className="mt-5 text-sm underline"
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
    (total, reservation) => total + Number(reservation.quantity || 0),
    0,
  );

  const availableNow = Math.max(0, Number(equipment.quantity) - reservedNow);

  const isOperational = equipment.status === "AVAILABLE";

  const displayStatus = !isOperational
    ? equipment.status
    : availableNow === 0
      ? "FULLY BOOKED NOW"
      : "AVAILABLE NOW";

  const nextBooking = upcomingReservations[0];

  const cardClass = "rounded-xl border border-[#c3c8c1] bg-white/80 p-5";

  const stats = [
    {
      label: "Total Units",
      value: equipment.quantity,
      icon: Boxes,
    },
    {
      label: "Reserved Now",
      value: reservedNow,
      icon: CalendarDays,
    },
    {
      label: "Available Now",
      value: isOperational ? availableNow : "—",
      icon: CheckCircle2,
    },
    {
      label: "Upcoming Bookings",
      value: upcomingReservations.length,
      icon: Clock3,
    },
  ];

  return (
    <div className="min-h-screen bg-transparent px-5 py-6 text-[#35362c] md:px-10">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/equipment")}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-[#7a7359] transition-colors hover:text-[#35362c]"
        >
          <ArrowLeft size={17} />
          Back to Equipment
        </button>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#7a7359]">
              Equipment / Details
            </p>

            <h1 className="text-3xl font-semibold">{equipment.name}</h1>

            <p className="mt-2 flex items-center gap-2 text-sm text-[#7a7359]">
              <Building2 size={15} />
              {equipment.companyName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                displayStatus === "AVAILABLE NOW"
                  ? "bg-[#d4e14b] text-[#35362c]"
                  : "bg-[#35362c] text-white"
              }`}
            >
              {displayStatus.replaceAll("_", " ")}
            </span>

            <button
              type="button"
              onClick={() =>
                navigate(`/reservations?equipmentId=${equipmentId}&create=true`)
              }
              disabled={!isOperational}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#d4e14b] px-5 py-3 text-sm font-semibold text-[#35362c] transition-colors hover:bg-[#c5d33c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CalendarPlus size={18} />
              Reserve Equipment
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-56 overflow-hidden rounded-xl border border-[#c3c8c1] bg-[#f0f1ed] md:h-60">
            {equipment.imageUrl ? (
              <img
                src={equipment.imageUrl}
                alt={equipment.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package size={65} className="text-[#a5aa9e]" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="flex flex-col justify-between rounded-xl border border-[#c3c8c1] bg-white/80 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-[#7a7359]">{item.label}</p>

                  <item.icon size={19} className="shrink-0 text-[#7a7359]" />
                </div>

                <p className="mt-3 text-3xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <section className={cardClass}>
            <h2 className="mb-3 text-base font-semibold">
              About this Equipment
            </h2>

            <p className="text-sm leading-6 text-[#7a7359]">
              {equipment.description || "No description has been added."}
            </p>

            {nextBooking && (
              <div className="mt-5 rounded-lg bg-[#e2e4e6] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CalendarDays size={16} />
                  <p className="text-sm font-semibold">Next Booking</p>
                </div>

                <p className="text-sm text-[#7a7359]">
                  {formatDate(nextBooking.startDateTime)}
                </p>

                <p className="mt-1 text-sm text-[#7a7359]">
                  Until {formatDate(nextBooking.endDateTime)}
                </p>

                <p className="mt-2 text-sm font-medium">
                  {nextBooking.quantity}{" "}
                  {nextBooking.quantity === 1 ? "unit" : "units"} reserved
                </p>
              </div>
            )}
          </section>

          <section className={cardClass}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Check Availability</h2>

                <p className="mt-1 text-sm text-[#7a7359]">
                  Select a booking period.
                </p>
              </div>

              {isOperational && !checking && available !== null && (
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    available === 0
                      ? "bg-[#35362c] text-white"
                      : "bg-[#d4e14b] text-[#35362c]"
                  }`}
                >
                  {available === 0
                    ? "Fully Booked"
                    : `${available} ${
                        available === 1 ? "unit" : "units"
                      } available`}
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-[#7a7359]">
                  Start Date & Time
                </label>

                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-lg border border-[#c3c8c1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7a7359]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#7a7359]">
                  End Date & Time
                </label>

                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full rounded-lg border border-[#c3c8c1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#7a7359]"
                />
              </div>
            </div>

            <div className="mt-4 flex min-h-12 items-center gap-2 rounded-lg bg-[#e2e4e6] px-4 py-3 text-sm">
              {new Date(endDate) <= new Date(startDate) ? (
                <>
                  <AlertCircle size={17} className="shrink-0 text-red-700" />
                  <span className="text-red-700">
                    End date must be after start date.
                  </span>
                </>
              ) : checking ? (
                <>
                  <LoaderCircle size={17} className="shrink-0 animate-spin" />
                  Checking availability...
                </>
              ) : !isOperational ? (
                <>
                  <AlertCircle size={17} className="shrink-0" />
                  Equipment is currently {equipment.status.toLowerCase()}.
                </>
              ) : availabilityError ? (
                <>
                  <AlertCircle size={17} className="shrink-0 text-red-700" />
                  <span className="text-red-700">{availabilityError}</span>
                </>
              ) : available === null ? (
                <>
                  <AlertCircle size={17} className="shrink-0" />
                  Availability could not be determined.
                </>
              ) : (
                <>
                  {available === 0 ? (
                    <AlertCircle size={17} className="shrink-0" />
                  ) : (
                    <CheckCircle2 size={17} className="shrink-0" />
                  )}

                  <span>
                    {available === 0
                      ? "No units available for this period."
                      : `${available} ${
                          available === 1 ? "unit is" : "units are"
                        } available for this period.`}
                  </span>
                </>
              )}
            </div>
          </section>
        </div>

        <section className={`${cardClass} mt-4`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Reservation History</h2>

              <p className="mt-1 text-sm text-[#7a7359]">
                Bookings, projects, and reservation details.
              </p>
            </div>

            <span className="rounded-full bg-[#e2e4e6] px-3 py-1.5 text-xs font-medium">
              {reservations.length}{" "}
              {reservations.length === 1 ? "booking" : "bookings"}
            </span>
          </div>

          {reservations.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#7a7359]">
              No reservations for this equipment yet.
            </div>
          ) : (
            <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
              {[...reservations]
                .sort(
                  (a, b) =>
                    new Date(b.startDateTime) - new Date(a.startDateTime),
                )
                .map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#c3c8c1] bg-white px-4 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <UserRound size={16} />
                        {reservation.reservedByName}
                      </p>

                      <p className="mt-1.5 text-sm text-[#7a7359]">
                        {reservation.projectName}
                      </p>

                      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#7a7359]">
                        <CalendarDays size={14} />
                        {formatDate(reservation.startDateTime)}
                        {" — "}
                        {formatDate(reservation.endDateTime)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {reservation.quantity}{" "}
                        {reservation.quantity === 1 ? "unit" : "units"}
                      </span>

                      <span className="rounded-full bg-[#e2e4e6] px-3 py-1.5 text-xs font-medium">
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
