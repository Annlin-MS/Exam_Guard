import React from "react";
import { useNavigate } from "react-router-dom";

const Layout = ({ role, children }) => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
  <div style={{ padding: "40px" }}>
    <h1>Layout Working</h1>
    {children}
  </div>
);
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "240px",
    backgroundColor: "#1e3c72",
    color: "#fff",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
  },
  logo: {
    marginBottom: "10px",
  },
  role: {
    marginBottom: "30px",
    fontSize: "14px",
    opacity: 0.8,
  },
  menu: {
    padding: "10px",
    cursor: "pointer",
    borderRadius: "6px",
    marginBottom: "10px",
    backgroundColor: "#2a5298",
  },
  logout: {
    marginTop: "auto",
    padding: "10px",
    cursor: "pointer",
    backgroundColor: "#b22222",
    borderRadius: "6px",
    textAlign: "center",
  },
  main: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },
  topbar: {
    padding: "15px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #ddd",
    fontWeight: "bold",
  },
  content: {
    padding: "25px",
  },
};

export default Layout;