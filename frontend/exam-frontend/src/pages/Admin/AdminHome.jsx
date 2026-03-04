import React, { useEffect, useState } from "react";
import api from "../../services/api";

const AdminHome = () => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/admin/dashboard-stats/");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 style={{ color: "#6C63FF" }}>Welcome, Admin 👋</h2>
      <p style={{ color: "#666" }}>
        Manage exams, staff, students and monitor blockchain security.
      </p>

      <div style={styles.grid}>
        <StatCard label="Total Exams" value={stats.total_exams} />
        <StatCard label="Active Exams" value={stats.active_exams} />
        <StatCard label="Total Staff" value={stats.total_staff} />
        <StatCard label="Total Students" value={stats.total_students} />
        <StatCard label="Pending Approvals" value={stats.pending_approvals} />
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div style={styles.card}>
    <h3 style={{ margin: 0, color: "#6C63FF" }}>{value ?? 0}</h3>
    <p style={{ margin: 0, color: "#555" }}>{label}</p>
  </div>
);

const styles = {
  grid: {
    marginTop: "30px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    textAlign: "center",
  },
};

export default AdminHome;