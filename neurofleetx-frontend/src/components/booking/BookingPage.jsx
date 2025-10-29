import React, { useEffect } from "react";
import { motion } from "framer-motion";
import BookingForm from "../../components/booking/BookingForm";
import BookingList from "../../components/booking/BookingList";
import FleetMap from "../../components/map/FleetMap";
import { useGlobalState, actionTypes } from "../../context/GlobalState";
import {
  connectBookingSocket,
  disconnectBookingSocket,
} from "../../api/wsBookings";

export default function BookingPage() {
  const { state, dispatch } = useGlobalState();

  useEffect(() => {
    // Connect WebSocket for real-time booking updates
    connectBookingSocket((bookingUpdate) => {
      if (
        bookingUpdate.customerId ===
        (state.user?.id || localStorage.getItem("userId"))
      ) {
        dispatch({ type: actionTypes.UPDATE_BOOKING, payload: bookingUpdate });
      }
    });

    return () => {
      disconnectBookingSocket();
    };
  }, [dispatch, state.user?.id]);

  const handleBookingCreated = () => {
    // Refresh bookings list after creation
    console.log("Booking created, refreshing list...");
  };

  // Get vehicles from active bookings for map display
  const activeVehicles = (state.bookings || [])
    .filter((b) => b.vehicle && ["CONFIRMED", "confirmed"].includes(b.status))
    .map((b) => b.vehicle);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
          🚗 Smart Booking System
        </h1>
        <p className="text-white/60">
          AI-powered vehicle recommendations and real-time tracking
        </p>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Forms */}
        <div className="col-span-1 space-y-6">
          <BookingForm onBookingCreated={handleBookingCreated} />
          <BookingList />
        </div>

        {/* Right Column - Map */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-1 lg:col-span-2"
        >
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              🗺️ Live Vehicle Tracking
            </h3>
            <div className="h-[600px] bg-slate-800/50 rounded-xl overflow-hidden border border-white/10">
              <FleetMap
                vehicles={activeVehicles}
                routes={state.bookings || []}
                height="600px"
                showControls={true}
                showLegend={true}
                defaultStyle="dark"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
