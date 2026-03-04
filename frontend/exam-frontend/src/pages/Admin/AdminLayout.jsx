import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>ExamChain</h2>

        <nav style={styles.nav}>
          <Link to="/admin/dashboard" style={styles.link}>🏠 Dashboard</Link>
          <Link to="/admin/profile" style={styles.link}>👤 Profile</Link>
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          🚪 Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <div style={styles.topbar}>
          <h3 style={{ margin: 0 }}>Admin Portal</h3>
        </div>

        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Segoe UI, sans-serif",
    backgroundColor: "#f5f6fa",
  },
  sidebar: {
    width: "220px",
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRight: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  logo: {
    color: "#6C63FF",
    marginBottom: "30px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  link: {
    textDecoration: "none",
    color: "#333",
    fontWeight: "500",
  },
  logoutBtn: {
    padding: "10px",
    border: "none",
    backgroundColor: "#6C63FF",
    color: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  topbar: {
    backgroundColor: "#ffffff",
    padding: "15px 25px",
    borderBottom: "1px solid #eee",
  },
  content: {
    padding: "30px",
  },
};

export default AdminLayout;