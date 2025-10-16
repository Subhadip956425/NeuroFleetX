export const getToken = () => {
  return localStorage.getItem("jwtToken");
};

export const getUserRole = () => {
  const role = localStorage.getItem("role");
  // Return role without ROLE_ prefix for comparison
  return role ? role.replace("ROLE_", "") : null;
};

export const setToken = (token) => {
  localStorage.setItem("jwtToken", token);
};

export const setUserRole = (role) => {
  localStorage.setItem("role", role);
};

export const clearAuth = () => {
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("role");
};
