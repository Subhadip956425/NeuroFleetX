export const setToken = (token) => localStorage.setItem("token", token);
export const getToken = () => localStorage.getItem("token");
export const removeToken = () => localStorage.removeItem("token");

export const setUserRole = (role) => localStorage.setItem("role", role);
export const getUserRole = () => localStorage.getItem("role");
