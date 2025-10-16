import { AuthActionTypes } from "./authActionTypes";

export const initialAuthState = {
  token: localStorage.getItem("jwtToken") || "",
  role: localStorage.getItem("role") || "",
  error: "",
};

export const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        token: action.payload.token,
        role: action.payload.role,
        error: "",
      };
    case AuthActionTypes.LOGOUT:
      return {
        ...state,
        token: "",
        role: "",
        error: "",
      };
    case AuthActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case AuthActionTypes.CLEAR_ERROR:
      return { ...state, error: "" };
    default:
      return state;
  }
};
