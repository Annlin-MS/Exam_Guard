import React, { useEffect, useState } from "react";
import api from "../../services/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [blockchain, setBlockchain] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const statsRes = await api.get("/api/admin/dashboard-stats/");
      const bcRes = await api.get("/api/admin/blockchain-status/");
      const logsRes = await api.get("/api/admin/audit-logs/");

      setStats(statsRes.data);
      setBlockchain(bcRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <h2>Loading Admin Dashboard...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👑 Admin Dashboard</h1>

      {/* ================= Stats Row ================= */}
      <div style={styles.statsRow}>
        <StatCard label="Total Exams" value={stats.total_exams} />
        <StatCard label="Active Exams" value={stats.active_exams} />
        <StatCard label="Total Staff" value={stats.total_staff} />
        <StatCard label="Total Students" value={stats.total_students} />
        <StatCard label="Pending Approvals" value={stats.pending_approvals} />
      </div>

      {/* ================= Blockchain Status ================= */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>⛓ Blockchain Status</h2>
        <p>
          Connection:{" "}
          {blockchain.connected ? (
            <span style={{ color: "limegreen" }}>🟢 Connected</span>
          ) : (
            <span style={{ color: "red" }}>🔴 Not Connected</span>
          )}
        </p>
        <p>Current Block: {blockchain.current_block}</p>
        <p>Admin Account: {blockchain.admin_account}</p>
      </div>

      {/* ================= Audit Logs ================= */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>📜 Recent Activity</h2>
        {logs.length === 0 ? (
          <p>No activity yet</p>
        ) : (
          logs.slice(0, 8).map((log, index) => (
            <div key={index} style={styles.logItem}>
              <strong>{log.user}</strong> — {log.description}
              <div style={styles.timestamp}>
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => {
  return (
    <div style={styles.statCard}>
      <h3 style={styles.statValue}>{value ?? 0}</h3>
      <p style={styles.statLabel}>{label}</p>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px",
    backgroundColor: "#0A0A14",
    color: "#ffffff",
    fontFamily: "Segoe UI, sans-serif",
  },
  title: {
    marginBottom: "30px",
    color: "#6C63FF",
  },
  statsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "30px",
  },
  statCard: {
    flex: "1 1 180px",
    backgroundColor: "#111122",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px solid #6C63FF33",
  },
  statValue: {
    fontSize: "28px",
    color: "#6C63FF",
    margin: "0",
  },
  statLabel: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.6)",
  },
  card: {
    backgroundColor: "#111122",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "25px",
    border: "1px solid #6C63FF33",
  },
  sectionTitle: {
    marginBottom: "15px",
    color: "#6C63FF",
  },
  logItem: {
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  timestamp: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.5)",
  },
  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A0A14",
    color: "#ffffff",
  },
};

export default AdminDashboard;