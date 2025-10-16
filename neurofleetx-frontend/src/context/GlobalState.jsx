import React, { createContext, useReducer, useContext } from "react";

// Initial global state
const initialState = {
  user: null,
  vehicles: [],
  bookings: [],
  telemetry: [],
};

// Action Types
export const actionTypes = {
  SET_USER: "SET_USER",
  SET_VEHICLES: "SET_VEHICLES",
  SET_BOOKINGS: "SET_BOOKINGS",
  UPDATE_TELEMETRY: "UPDATE_TELEMETRY",
};

// Reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      return { ...state, user: action.payload };
    case actionTypes.SET_VEHICLES:
      return { ...state, vehicles: action.payload };
    case actionTypes.SET_BOOKINGS:
      return { ...state, bookings: action.payload };
    case actionTypes.UPDATE_TELEMETRY:
      return {
        ...state,
        telemetry: state.telemetry.map((v) =>
          v.id === action.payload.id ? action.payload : v
        ),
      };
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
