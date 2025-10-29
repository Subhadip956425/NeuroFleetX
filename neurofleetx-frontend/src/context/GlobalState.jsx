import React, { createContext, useReducer, useContext } from "react";

// Initial global state
const initialState = {
  user: null,
  vehicles: [],
  bookings: [],
  telemetry: [],
  routes: [], // AI / route data

  // Health Analytics
  health: [],
  tickets: [],
};

// Action Types
export const actionTypes = {
  SET_USER: "SET_USER",
  SET_VEHICLES: "SET_VEHICLES",
  UPDATE_TELEMETRY: "UPDATE_TELEMETRY",
  SET_ROUTES: "SET_ROUTES",
  ADD_ROUTE: "ADD_ROUTE",
  UPDATE_ROUTE: "UPDATE_ROUTE",
  LOGOUT: "LOGOUT",

  // Health Analytics
  SET_HEALTH: "SET_HEALTH",
  ADD_HEALTH: "ADD_HEALTH",
  SET_TICKETS: "SET_TICKETS",
  ADD_TICKET: "ADD_TICKET",
  UPDATE_TICKET: "UPDATE_TICKET",

  // Booking
  CREATE_BOOKING: "CREATE_BOOKING",
  SET_BOOKINGS: "SET_BOOKINGS",
  UPDATE_BOOKING: "UPDATE_BOOKING",
  DELETE_BOOKING: "DELETE_BOOKING",
};

// Reducer function
export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      return { ...state, user: action.payload };

    case actionTypes.SET_VEHICLES:
      return { ...state, vehicles: action.payload };

    case actionTypes.UPDATE_TELEMETRY:
      return {
        ...state,
        telemetry: state.telemetry.map((v) =>
          v.id === action.payload.id ? { ...v, ...action.payload } : v
        ),
      };

    // Routes / AI actions
    case actionTypes.SET_ROUTES:
      return { ...state, routes: action.payload };

    case actionTypes.ADD_ROUTE:
      return { ...state, routes: [...state.routes, action.payload] };

    case actionTypes.UPDATE_ROUTE: {
      // If route exists, update it; otherwise add it
      const exists = state.routes.some((r) => r.id === action.payload.id);
      const updatedRoutes = exists
        ? state.routes.map((r) =>
            r.id === action.payload.id ? { ...r, ...action.payload } : r
          )
        : [action.payload, ...state.routes];
      return { ...state, routes: updatedRoutes };
    }

    // Health Analytics
    case actionTypes.SET_HEALTH:
      return { ...state, health: action.payload }; // health: { vehicleId -> readings[] } or list

    case actionTypes.ADD_HEALTH:
      return { ...state, health: [...(state.health || []), action.payload] };

    case actionTypes.SET_TICKETS:
      return { ...state, tickets: action.payload };

    case actionTypes.ADD_TICKET:
      return { ...state, tickets: [...(state.tickets || []), action.payload] };

    case actionTypes.UPDATE_TICKET:
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    // Booking
    case actionTypes.SET_BOOKINGS:
      return { ...state, bookings: action.payload };
    case actionTypes.CREATE_BOOKING:
      return {
        ...state,
        bookings: [...(state.bookings || []), action.payload],
      };
    case actionTypes.UPDATE_BOOKING:
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case actionTypes.DELETE_BOOKING:
      return {
        ...state,
        bookings: state.bookings.filter((b) => b.id !== action.payload),
      };

    case actionTypes.LOGOUT:
      return initialState;

    default:
      return state;
  }
};

// Create Context
export const GlobalContext = createContext();

// Provider component
export const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GlobalContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook to access global state
export const useGlobalState = () => useContext(GlobalContext);
