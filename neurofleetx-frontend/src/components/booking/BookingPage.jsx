import React, { useEffect } from "react";
import { useGlobalState, actionTypes } from "../../context/GlobalState.jsx";
import bookingApi from "../../api/bookingApi";
import VehicleMap from "../../components/FleetMap";
import { connectWebSocket } from "../../api/wsClient";

const BookingPage = () => {
  const { state, dispatch } = useGlobalState();

  const fetchBookings = async () => {
    const res = await bookingApi.getMyBookings();
    dispatch({ type: actionTypes.SET_BOOKINGS, payload: res.data });
  };

  useEffect(() => {
    fetchBookings();

    // WebSocket telemetry subscription
    connectWebSocket((data) => {
      dispatch({ type: actionTypes.UPDATE_TELEMETRY, payload: data });
    });
  }, []);

  return (
    <div className="booking-page">
      <h2>My Bookings</h2>
      <div className="booking-list">
        {state.bookings.map((b) => (
          <div key={b.id} className="booking-card">
            <p>Vehicle: {b.vehicle?.name || "Pending"}</p>
            <p>Status: {b.status}</p>
            <p>Pickup: {b.pickupLocation}</p>
            <p>Drop: {b.dropLocation}</p>
            <p>
              Start: {new Date(b.startTime).toLocaleString()} | End:{" "}
              {new Date(b.endTime).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <h2>Live Vehicle Tracking</h2>
      <VehicleMap
        vehicles={state.bookings.map((b) => b.vehicle).filter(Boolean)}
      />
    </div>
  );
};

export default BookingPage;
