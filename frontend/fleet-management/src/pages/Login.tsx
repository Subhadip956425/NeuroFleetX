import { useState } from "react";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8001/api/auth/login",
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Login success:", response.data);
      alert("Login Success!");

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role);

        // ✅ Redirect based on role
        const role = response.data.role.toUpperCase();
        if (role === "ADMIN") {
          window.location.href = "/admin";
        } else if (role === "MANAGER") {
          window.location.href = "/manager";
        } else if (role === "CUSTOMER") {
          window.location.href = "/customer";
        } else if (role === "DRIVER") {
          window.location.href = "/driver";
        } else {
          window.location.href = "/"; // fallback
        }
      }
    } catch (error: any) {
      console.error(
        "Login failed:",
        error.response ? error.response.data : error.message
      );
      alert("Login Failed!");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
