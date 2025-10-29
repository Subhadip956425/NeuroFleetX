import { VehicleActionTypes } from "./vehicleActionTypes";

export const initialVehicleState = {
  allVehicles: [],
  filteredVehicles: [],
  typeFilter: "",
  statusFilter: "",
  searchQuery: "",
};

export const vehicleReducer = (state, action) => {
  switch (action.type) {
    case VehicleActionTypes.SET_VEHICLES:
      return {
        ...state,
        allVehicles: action.payload,
        filteredVehicles: applyFilters(action.payload, state),
      };
    case VehicleActionTypes.ADD_VEHICLE:
      const newAll = [...state.allVehicles, action.payload];
      return {
        ...state,
        allVehicles: newAll,
        filteredVehicles: applyFilters(newAll, state),
      };
    case VehicleActionTypes.UPDATE_VEHICLE:
      const updatedAll = state.allVehicles.map((v) =>
        v.id === action.payload.id ? { ...v, ...action.payload } : v
      );
      return {
        ...state,
        allVehicles: updatedAll,
        filteredVehicles: applyFilters(updatedAll, state),
      };

    case VehicleActionTypes.DELETE_VEHICLE:
      const filteredAll = state.allVehicles.filter(
        (v) => v.id !== action.payload
      );
      return {
        ...state,
        allVehicles: filteredAll,
        filteredVehicles: applyFilters(filteredAll, state),
      };
    case VehicleActionTypes.FILTER_BY_TYPE:
      return {
        ...state,
        typeFilter: action.payload,
        filteredVehicles: applyFilters(state.allVehicles, {
          ...state,
          typeFilter: action.payload,
        }),
      };
    case VehicleActionTypes.FILTER_BY_STATUS:
      return {
        ...state,
        statusFilter: action.payload,
        filteredVehicles: applyFilters(state.allVehicles, {
          ...state,
          statusFilter: action.payload,
        }),
      };
    case VehicleActionTypes.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload,
        filteredVehicles: applyFilters(state.allVehicles, {
          ...state,
          searchQuery: action.payload,
        }),
      };
    default:
      return state;
  }
};

const applyFilters = (vehicles, state) => {
  return vehicles.filter((v) => {
    const typeMatch = state.typeFilter ? v.type === state.typeFilter : true;
    const statusMatch = state.statusFilter
      ? v.status === state.statusFilter
      : true;
    const searchMatch = state.searchQuery
      ? v.name.toLowerCase().includes(state.searchQuery.toLowerCase())
      : true;
    return typeMatch && statusMatch && searchMatch;
  });
};
