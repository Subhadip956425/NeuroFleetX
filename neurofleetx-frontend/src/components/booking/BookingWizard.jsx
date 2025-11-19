import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BookingFilters from "./BookingFilters";
import VehicleRecommendations from "./VehicleRecommendationCard";
import AvailabilityCalendar from "./AvailabilityCalendar";
import TimeSlotPicker from "./TimeSlotPicker";
import PricingBreakdown from "./PricingBreakdown";
import BookingConfirmation from "./BookingConfirmation";
import bookingApi from "../../api/bookingApi";

const BookingWizard = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookingData, setBookingData] = useState({
    vehicleType: "",
    isEv: false,
    seatsNeeded: 4,
    priceRange: "Standard",
    pickupLocation: "",
    dropoffLocation: "",
    startDate: null,
    startTime: null,
    endDate: null,
    endTime: null,
    selectedSlot: null,
    totalPrice: 0,
  });

  // ✅ Step 1: Get recommendations based on filters
  // ✅ Step 1: Get recommendations based on filters
  const handleFiltersSubmit = async (filters) => {
    setLoading(true);
    try {
      console.log("🎯 Step 1: Submitting filters:", filters);

      // ✅ Create payload WITHOUT times
      const payload = {
        vehicleType: filters.vehicleType || "Car",
        isEvPreferred: filters.isEv || false,
        seatsNeeded: parseInt(filters.seatsNeeded) || 4, // ✅ Ensure it's a number
        distanceKm: 50.0, // ✅ Add .0 to make it float
        priceRange: filters.priceRange || "Standard",
      };

      console.log("📤 Payload:", JSON.stringify(payload, null, 2));

      const response = await bookingApi.getVehicleRecommendations(payload);

      console.log("✅ Full response:", response);
      console.log("   response.data:", response.data);

      // ✅ CORRECTED: Handle multiple response formats
      let recs = [];

      // Format 1: { data: { data: [...] } }
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        recs = response.data.data;
        console.log("   Format: response.data.data (nested)");
      }
      // Format 2: { data: [...] }
      else if (response.data && Array.isArray(response.data)) {
        recs = response.data;
        console.log("   Format: response.data (direct array)");
      }
      // Format 3: Direct array
      else if (Array.isArray(response)) {
        recs = response;
        console.log("   Format: direct array");
      }
      // Format 4: Axios wrapping
      else if (response && response.data) {
        console.warn(
          "⚠️ Unexpected format, trying response.data:",
          response.data
        );
        recs = Array.isArray(response.data) ? response.data : [];
      }

      console.log("✅ Parsed recommendations:", recs);
      console.log("   Count:", recs.length);

      if (!Array.isArray(recs) || recs.length === 0) {
        console.error("❌ No recommendations in response");
        alert("⚠️ No vehicles available with these filters");
        setLoading(false);
        return;
      }

      // ✅ Store filtered vehicles
      setRecommendations(recs);
      setBookingData({
        ...bookingData,
        ...filters,
      });
      setStep(2);
    } catch (error) {
      console.error("❌ Error:", error);
      console.error("   Full error object:", {
        message: error.message,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
      });
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 2: Select vehicle from recommendations
  const handleVehicleSelect = (vehicle) => {
    console.log("🎯 Step 2: Selected vehicle:", vehicle);
    setSelectedVehicle(vehicle);
    setStep(3);
  };

  // ✅ Step 3: View availability calendar
  // ✅ Step 3: View availability calendar
  // ✅ Step 3: View availability calendar
  const handleCalendarDateSelect = async (date) => {
    setLoading(true);
    try {
      console.log("🎯 Step 3: Selected date:", date);

      const response = await bookingApi.getAvailableSlots(
        selectedVehicle.vehicle_id || selectedVehicle.id,
        date
      );

      console.log("✅ Full API response:", response);
      console.log("   response.data:", response.data);
      console.log(
        "   Array.isArray(response.data):",
        Array.isArray(response.data)
      );

      // ✅ CORRECT: axios wraps response in .data property
      // So response.data IS the slots array
      let availableSlots = response.data;

      // ✅ Fallback handling for different formats
      if (!Array.isArray(availableSlots)) {
        console.warn("⚠️ response.data is not an array:", availableSlots);

        // Try nested format
        if (availableSlots && Array.isArray(availableSlots.data)) {
          availableSlots = availableSlots.data;
        } else {
          availableSlots = [];
        }
      }

      console.log("✅ Parsed slots:", availableSlots);
      console.log("   Slot count:", availableSlots.length);

      // ✅ Validate we have slots
      if (!availableSlots || availableSlots.length === 0) {
        console.warn("⚠️ No slots available");
        alert(
          "⚠️ No time slots available for this date. Please select another date."
        );
        setLoading(false);
        return;
      }

      // ✅ Validate slot structure
      const validSlots = availableSlots.filter((slot) => {
        const hasStart =
          slot.startTime !== undefined && slot.startTime !== null;
        const hasEnd = slot.endTime !== undefined && slot.endTime !== null;
        const hasPrice =
          slot.pricePerHour !== undefined && slot.pricePerHour !== null;

        const isValid = hasStart && hasEnd && hasPrice;

        if (!isValid) {
          console.warn("⚠️ Invalid slot:", slot);
        }
        return isValid;
      });

      console.log("✅ Valid slots:", validSlots);

      if (validSlots.length === 0) {
        alert("⚠️ Invalid slot data received. Please try again.");
        setLoading(false);
        return;
      }

      // ✅ Update state with valid slots and move to next step
      setBookingData({
        ...bookingData,
        startDate: date,
        availableSlots: validSlots,
      });
      setStep(4);
    } catch (error) {
      console.error("❌ Full error object:", error);
      console.error("   Error message:", error.message);
      console.error("   Response status:", error.response?.status);
      console.error("   Response data:", error.response?.data);

      const errorMsg =
        error.response?.data?.error || error.message || "Unknown error";
      alert(`❌ Failed to fetch time slots: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 4: Select time slot
  const handleSlotSelect = (slot) => {
    console.log("🎯 Step 4: Selected slot:", slot);

    const duration = calculateDuration(slot.startTime, slot.endTime);
    const totalPrice = slot.pricePerHour * duration;

    console.log(`Duration: ${duration}h, Total Price: ${totalPrice}`);

    setBookingData({
      ...bookingData,
      selectedSlot: slot,
      startTime: slot.startTime,
      endTime: slot.endTime,
      totalPrice,
    });
    setStep(5);
  };

  // ✅ Step 5: Confirm booking
  // ✅ Step 5: Confirm booking
  const handleConfirmBooking = async (finalData) => {
    setLoading(true);
    try {
      console.log("🎯 Step 5: Confirming booking...");

      const user = JSON.parse(localStorage.getItem("user"));
      const customerId = user?.id || 1;

      // ✅ CORRECT payload format for CreateBookingRequest
      const bookingPayload = {
        customerId: customerId,
        vehicleId: selectedVehicle.vehicle_id || selectedVehicle.id,
        pickupLocation: bookingData.pickupLocation,
        dropoffLocation: bookingData.dropoffLocation,
        startTime: `${bookingData.startDate}T${bookingData.startTime}:00`, // ISO format
        endTime: `${bookingData.endDate || bookingData.startDate}T${
          bookingData.endTime
        }:00`, // ISO format
        price: bookingData.totalPrice,
        // ✅ Optional: add these if your DTO expects them
        vehicleType: selectedVehicle.type || bookingData.vehicleType,
        isEv: selectedVehicle.isEv || bookingData.isEv || false,
        seats: bookingData.seatsNeeded || 4,
      };

      console.log(
        "📤 Booking payload:",
        JSON.stringify(bookingPayload, null, 2)
      );

      const response = await bookingApi.createBooking(bookingPayload);

      console.log("✅ Booking created:", response.data);

      alert("✅ Booking confirmed!");
      setStep(6);
    } catch (error) {
      console.error("❌ Full error:", error);
      console.error("   Status:", error.response?.status);
      console.error("   Error data:", error.response?.data);
      console.error("   Message:", error.message);

      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Unknown error";
      alert(`❌ Booking failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 1;

    try {
      const start = new Date(`2025-01-01 ${startTime}`);
      const end = new Date(`2025-01-01 ${endTime}`);
      const duration = (end - start) / (1000 * 60 * 60);
      return Math.max(1, duration);
    } catch (e) {
      console.warn("⚠️ Duration error:", e);
      return 1;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            🚗 Smart Vehicle Booking
          </h1>
          <p className="text-white/60">
            AI-powered recommendations for your perfect ride
          </p>
        </motion.div>

        <ProgressIndicator currentStep={step} totalSteps={6} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <BookingFilters
                onSubmit={handleFiltersSubmit}
                loading={loading}
              />
            )}

            {step === 2 && (
              <VehicleRecommendations
                vehicles={recommendations}
                onSelect={handleVehicleSelect}
                loading={loading}
              />
            )}

            {step === 3 && selectedVehicle && (
              <AvailabilityCalendar
                vehicleId={selectedVehicle.vehicle_id || selectedVehicle.id}
                onDateSelect={handleCalendarDateSelect}
                loading={loading}
              />
            )}

            {step === 4 && bookingData.availableSlots && (
              <TimeSlotPicker
                slots={bookingData.availableSlots}
                onSlotSelect={handleSlotSelect}
              />
            )}

            {step === 5 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PricingBreakdown
                    vehicle={selectedVehicle}
                    booking={bookingData}
                  />
                </div>
                <BookingConfirmation
                  booking={bookingData}
                  vehicle={selectedVehicle}
                  onConfirm={handleConfirmBooking}
                  loading={loading}
                />
              </div>
            )}

            {step === 6 && <SuccessMessage bookingData={bookingData} />}
          </motion.div>
        </AnimatePresence>

        {step > 1 && step < 6 && (
          <motion.div
            className="flex justify-between mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
            >
              ← Back
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const ProgressIndicator = ({ currentStep, totalSteps }) => {
  const steps = [
    "Filters",
    "AI Recommendations",
    "Calendar",
    "Time Slot",
    "Review",
    "Confirmed",
  ];

  return (
    <motion.div className="mb-8">
      <div className="flex justify-between mb-4">
        {steps.map((label, index) => (
          <motion.div
            key={index}
            className={`text-sm font-semibold ${
              index + 1 <= currentStep ? "text-cyan-400" : "text-white/40"
            }`}
          >
            {label}
          </motion.div>
        ))}
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
};

const SuccessMessage = ({ bookingData }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-12"
  >
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 0.6, repeat: Infinity }}
      className="text-6xl mb-4"
    >
      ✅
    </motion.div>
    <h2 className="text-3xl font-black text-white mb-2">Booking Confirmed!</h2>
    <p className="text-white/60 mb-6">
      Your booking has been successfully created. Check your email for
      confirmation details.
    </p>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => (window.location.href = "/dashboard/customer")}
      className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
    >
      Back to Dashboard
    </motion.button>
  </motion.div>
);

export default BookingWizard;
