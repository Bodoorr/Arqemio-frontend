import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  X,
} from "lucide-react";

const POPUP_WIDTH = 340;
const POPUP_HEIGHT = 445;

const pad = (number) => String(number).padStart(2, "0");

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value.slice(0, 16));
  return Number.isNaN(date.getTime()) ? null : date;
};

const ArqemioDateTimePicker = ({
  value,
  onChange,
  required = false,
  centered = false,
}) => {
  const selected = parseDate(value);

  const [month, setMonth] = useState(() => {
    const date = parseDate(value) || new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const [open, setOpen] = useState(false);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });

  const containerRef = useRef(null);
  const popupRef = useRef(null);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();

  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const hour = selected ? pad(selected.getHours()) : "09";
  const minute = selected ? pad(selected.getMinutes()) : "00";

  useEffect(() => {
    const date = parseDate(value);

    if (date) {
      setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value?.slice(0, 7)]);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (centered) return;

      const element = containerRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const margin = 12;

      const left = Math.max(
        margin,
        Math.min(
          rect.left + rect.width / 2 - POPUP_WIDTH / 2,
          window.innerWidth - POPUP_WIDTH - margin,
        ),
      );

      const availableBelow = window.innerHeight - rect.bottom;
      const availableAbove = rect.top;

      const showAbove =
        availableBelow < POPUP_HEIGHT + margin &&
        availableAbove > availableBelow;

      setPosition({
        left,
        top: showAbove
          ? Math.max(margin, rect.top - POPUP_HEIGHT - 8)
          : rect.bottom + 8,
      });
    };

    updatePosition();

    const handleOutsideClick = (event) => {
      if (
        !containerRef.current?.contains(event.target) &&
        !popupRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, centered]);

  const choose = (year, monthIndex, day, hours = hour, minutes = minute) => {
    onChange(`${year}-${pad(monthIndex + 1)}-${pad(day)}T${hours}:${minutes}`);
  };

  const changeTime = (hours, minutes) => {
    const date = selected || new Date();

    choose(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
  };

  const changeMonth = (offset) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  };

  const displayValue = selected
    ? selected.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  return (
    <div ref={containerRef} className="relative mt-2">
      <div className="relative">
        <input
          type="text"
          readOnly
          required={required}
          value={displayValue}
          onClick={() => setOpen((previous) => !previous)}
          placeholder="Select date and time"
          aria-label="Select date and time"
          aria-expanded={open}
          className="w-full cursor-pointer rounded-lg border border-[#c3c8c1] bg-white px-3 py-2.5 pr-10 text-sm text-[#35362c] outline-none transition focus:border-[#a9b82b]"
        />

        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-label="Open calendar"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7359] transition hover:text-[#35362c]"
        >
          <CalendarDays size={19} />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={popupRef}
            role="dialog"
            aria-label="Choose date and time"
            style={{
              position: "fixed",
              top: centered ? "50%" : position.top,
              left: centered ? "50%" : position.left,
              transform: centered ? "translate(-50%, -50%)" : undefined,
              width: POPUP_WIDTH,
              maxWidth: "calc(100vw - 24px)",
              zIndex: 9999,
            }}
            className="max-h-[calc(100vh-24px)] overflow-y-auto rounded-2xl border border-[#c3c8c1] bg-white p-4 text-[#35362c] shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-[#35362c]">
                {month.toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                  className="rounded-lg p-2 transition hover:bg-[#f0f2e3]"
                >
                  <ChevronLeft size={19} />
                </button>

                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                  className="rounded-lg p-2 transition hover:bg-[#f0f2e3]"
                >
                  <ChevronRight size={19} />
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close calendar"
                  className="rounded-lg p-2 text-[#7a7359] transition hover:bg-[#f0f2e3]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {days.map((day) => (
                <span
                  key={day}
                  className="flex h-9 items-center justify-center text-xs font-bold text-[#7a7359]"
                >
                  {day}
                </span>
              ))}

              {cells.map((day, index) => {
                const isSelected =
                  day &&
                  selected &&
                  selected.getFullYear() === month.getFullYear() &&
                  selected.getMonth() === month.getMonth() &&
                  selected.getDate() === day;

                const today = new Date();

                const isToday =
                  day &&
                  today.getFullYear() === month.getFullYear() &&
                  today.getMonth() === month.getMonth() &&
                  today.getDate() === day;

                return day ? (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      choose(month.getFullYear(), month.getMonth(), day)
                    }
                    className={`flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition ${
                      isSelected
                        ? "bg-[#d4e14b] text-[#35362c]"
                        : isToday
                          ? "border border-[#d4e14b] text-[#35362c] hover:bg-[#f0f2e3]"
                          : "text-[#35362c] hover:bg-[#f0f2e3]"
                    }`}
                  >
                    {day}
                  </button>
                ) : (
                  <span key={index} />
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-[#e2e4e6] pt-4">
              <Clock3 size={19} className="shrink-0 text-[#7a7359]" />

              <span className="mr-auto text-sm font-semibold">Time</span>

              <select
                aria-label="Hour"
                value={hour}
                onChange={(event) => changeTime(event.target.value, minute)}
                className="rounded-lg border border-[#c3c8c1] bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-[#a9b82b]"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={pad(i)}>
                    {pad(i)}
                  </option>
                ))}
              </select>

              <span className="text-sm font-semibold text-[#7a7359]">:</span>

              <select
                aria-label="Minute"
                value={minute}
                onChange={(event) => changeTime(hour, event.target.value)}
                className="rounded-lg border border-[#c3c8c1] bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-[#a9b82b]"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={pad(i)}>
                    {pad(i)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#e2e4e6] pt-4">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();

                  choose(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    pad(now.getHours()),
                    pad(now.getMinutes()),
                  );

                  setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#7a7359] transition hover:bg-[#f0f2e3]"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!selected) {
                    const now = new Date();

                    choose(now.getFullYear(), now.getMonth(), now.getDate());
                  }

                  setOpen(false);
                }}
                className="rounded-lg bg-[#d4e14b] px-6 py-2.5 text-sm font-bold text-[#35362c] transition hover:bg-[#c8d63c]"
              >
                Done
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ArqemioDateTimePicker;
