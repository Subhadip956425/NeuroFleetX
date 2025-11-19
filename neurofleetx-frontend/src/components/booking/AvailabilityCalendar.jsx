import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import bookingApi from "../../api/bookingApi";

const AvailabilityCalendar = ({ vehicleId, onDateSelect, loading }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState(new Set());
  const [calendarLoading, setCalendarLoading] = useState(true);

  useEffect(() => {
    fetchAvailableDates();
  }, [vehicleId, currentMonth]);

  const fetchAvailableDates = async () => {
    try {
      setCalendarLoading(true);

      const startDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];

      const endDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      )
        .toISOString()
        .split("T")[0];

      console.log("📅 Fetching calendar for vehicle:", vehicleId);

      const response = await bookingApi.getBookingCalendar(
        vehicleId,
        startDate,
        endDate
      );

      let dates = new Set();
      if (response.data && typeof response.data === "object") {
        dates = new Set(Object.keys(response.data));
      }

      setAvailableDates(dates);
    } catch (error) {
      console.error("Error fetching calendar:", error);
      // Fallback: All future dates available
      const today = new Date();
      const dummyDates = new Set();
      let current = new Date(today);
      const endOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      );

      while (current <= endOfMonth) {
        dummyDates.add(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }

      setAvailableDates(dummyDates);
    } finally {
      setCalendarLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isFutureDate = (year, month, day) => {
    const checkDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate >= today; // ✅ Include today and future dates
  };

  const days = [];
  const firstDay = getFirstDayOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDateClick = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (availableDates.has(dateStr)) {
      setSelectedDate(dateStr);
      onDateSelect(dateStr);
    } else {
      alert("This date is not available");
    }
  };

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8"
    >
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          📅 Select Date (Today Onwards)
        </h2>

        {calendarLoading ? (
          <div className="text-center text-white/60 py-8">🔄 Loading...</div>
        ) : (
          <>
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1
                    )
                  )
                }
                className="text-2xl text-cyan-400 hover:text-cyan-300"
              >
                ←
              </motion.button>
              <h3 className="text-xl font-bold text-white">{monthName}</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1
                    )
                  )
                }
                className="text-2xl text-cyan-400 hover:text-cyan-300"
              >
                →
              </motion.button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-white/60 text-sm font-semibold py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} />;
                }

                const dateStr = `${currentMonth.getFullYear()}-${String(
                  currentMonth.getMonth() + 1
                ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                const isFuture = isFutureDate(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  day
                );
                const isAvailable = isFuture && availableDates.has(dateStr);
                const isSelected = selectedDate === dateStr;

                return (
                  <motion.button
                    key={day}
                    whileHover={isAvailable ? { scale: 1.1 } : {}}
                    whileTap={isAvailable ? { scale: 0.95 } : {}}
                    onClick={() => handleDateClick(day)}
                    disabled={!isAvailable}
                    className={`py-3 rounded-lg font-semibold text-center transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                        : isAvailable
                        ? "bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                        : "text-white/30 cursor-not-allowed opacity-50"
                    }`}
                  >
                    {day}
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AvailabilityCalendar;
