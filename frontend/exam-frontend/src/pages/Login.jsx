import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await loginUser(username, password);
      console.log(response); 

      localStorage.setItem("token", response.token);
      localStorage.setItem("role", response.role);

      if (response.role === "STUDENT") {
        navigate("/student/dashboard");
      } else if (response.role === "STAFF") {
        navigate("/staff/dashboard");
      } else if (response.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        alert("Unknown role");
      }

    } catch (error) {
      alert("Invalid username or password");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Exam Guard</h2>
        <p style={styles.subtitle}>Secure Examination Portal</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #e0e0e0, #e1e9f6)",
  },
  card: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "12px",
    width: "350px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  title: {
    marginBottom: "5px",
    color: "#1e3c72",
  },
  subtitle: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "25px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    marginBottom: "15px",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#1e3c72",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Login;