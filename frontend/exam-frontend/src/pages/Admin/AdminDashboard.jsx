import React, { useEffect, useState } from "react";
import api from "../../services/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [blockchain, setBlockchain] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const [statsRes, bcRes, logsRes] = await Promise.all([
        api.get("/api/admin/dashboard-stats/"),
        api.get("/api/admin/blockchain-status/"),
        api.get("/api/admin/audit-logs/"),
      ]);
      setStats(statsRes.data);
      setBlockchain(bcRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={s.loader}>
      <div style={s.loaderInner}>
        <div style={s.loaderIcon}>⛓️</div>
        <div style={s.loaderText}>Loading Dashboard...</div>
        <div style={s.loaderBar}><div style={s.loaderFill} /></div>
      </div>
    </div>
  );

  const statCards = [
    { label: "Total Exams", value: stats.total_exams ?? 0, icon: "📋", color: "#6C63FF", bg: "#EFE9FF" },
    { label: "Active Exams", value: stats.active_exams ?? 0, icon: "🟢", color: "#00C9A7", bg: "#E6FFFB" },
    { label: "Total Staff", value: stats.total_staff ?? 0, icon: "👨‍🏫", color: "#FFD166", bg: "#FFF7E0" },
    { label: "Total Students", value: stats.total_students ?? 0, icon: "👨‍🎓", color: "#FF6B6B", bg: "#FFECEC" },
    { label: "Pending Approvals", value: stats.pending_approvals ?? 0, icon: "⏳", color: "#FF6584", bg: "#FFE9EF" },
  ];

  const actionButtons = [
    { label: "Create Exam", icon: "➕", color: "#6C63FF", link: "/admin/exams" },
    { label: "Approve Questions", icon: "✅", color: "#00C9A7", link: "/admin/approvals" },
    { label: "Manage Staff", icon: "👨‍🏫", color: "#FFD166", link: "/admin/staff" },
    { label: "View Reports", icon: "📊", color: "#FF6B6B", link: "/admin/reports" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stat-card { animation: fadeUp 0.4s ease both; }
        .stat-card:hover { transform: translateY(-3px) !important; }

        .action-btn:hover { transform: translateY(-2px) !important; }

        .log-item:hover { background: #F5F2FF !important; }

        .hash-text {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #6C63FF;
          background: #EFE9FF;
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>

      <div style={s.root}>
        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <div style={s.pageTitle}>Admin Dashboard</div>
            <div style={s.pageSubtitle}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>

          <button onClick={fetchDashboard} style={s.refreshBtn}>
            ↻ Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          {statCards.map((c, i) => (
            <div
              key={i}
              className="stat-card"
              style={{ ...s.statCard, border: `1px solid ${c.color}22` }}
            >
              <div style={{ ...s.statIcon, background: c.bg, color: c.color }}>{c.icon}</div>
              <div style={s.statValue}>{c.value}</div>
              <div style={s.statLabel}>{c.label}</div>

              <div style={{ ...s.statBar, background: `${c.color}22` }}>
                <div
                  style={{
                    ...s.statBarFill,
                    width: `${Math.min((c.value / 20) * 100, 100)}%`,
                    background: c.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={s.section}>
          <div style={s.sectionTitle}>⚡ Quick Actions</div>

          <div style={s.actionsRow}>
            {actionButtons.map((btn, i) => (
              <a
                key={i}
                href={btn.link}
                className="action-btn"
                style={{
                  ...s.actionBtn,
                  border: `1px solid ${btn.color}33`,
                  background: "#F7F5FF",
                  textDecoration: "none"
                }}
              >
                <span style={{ fontSize: 22 }}>{btn.icon}</span>
                <span style={{ ...s.actionLabel, color: btn.color }}>{btn.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Two Columns */}
        <div style={s.twoCol}>
          {/* Blockchain */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>⛓️ Blockchain Status</span>

              <span style={{
                ...s.badge,
                background: blockchain.connected ? "#E6FFFB" : "#FFECEC",
                color: blockchain.connected ? "#00C9A7" : "#FF6B6B"
              }}>
                {blockchain.connected ? "● Connected" : "● Offline"}
              </span>
            </div>

            <div style={s.bcGrid}>
              <div style={s.bcItem}>
                <div style={s.bcItemLabel}>Network</div>
                <div style={s.bcItemValue}>Ganache Local</div>
              </div>

              <div style={s.bcItem}>
                <div style={s.bcItemLabel}>Current Block</div>
                <div style={{ ...s.bcItemValue, color: "#6C63FF" }}>
                  #{blockchain.current_block ?? "—"}
                </div>
              </div>

              <div style={{ ...s.bcItem, gridColumn: "1/-1" }}>
                <div style={s.bcItemLabel}>Admin Account</div>
                <div className="hash-text">
                  {blockchain.admin_account ?? "Not connected"}
                </div>
              </div>
            </div>
          </div>

          {/* System Overview */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>📈 System Overview</span>
            </div>

            <div style={s.overviewList}>
              {[
                { label: "Exams Completed", value: (stats.total_exams ?? 0) - (stats.active_exams ?? 0), color: "#6C63FF" },
                { label: "Approval Rate", value: `${stats.pending_approvals > 0 ? Math.round(((stats.total_exams - stats.pending_approvals) / stats.total_exams) * 100) : 100}%`, color: "#00C9A7" },
                { label: "Staff:Student Ratio", value: `1:${stats.total_staff > 0 ? Math.round(stats.total_students / stats.total_staff) : 0}`, color: "#FFD166" },
                { label: "Pending Reviews", value: stats.pending_approvals ?? 0, color: "#FF6584" },
              ].map((item, i) => (
                <div key={i} style={s.overviewItem}>
                  <div style={s.overviewLabel}>{item.label}</div>
                  <div style={{ ...s.overviewValue, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>📜 Recent Activity</span>
            <span style={s.cardCount}>{logs.length} entries</span>
          </div>

          {logs.length === 0 ? (
            <div style={s.empty}>No activity recorded yet</div>
          ) : (
            <div style={s.logList}>
              {logs.slice(0, 8).map((log, i) => (
                <div key={i} className="log-item" style={s.logItem}>
                  <div style={s.logAvatar}>⚙️</div>

                  <div style={s.logBody}>
                    <div style={s.logDesc}>{log.description}</div>

                    <div style={s.logMeta}>
                      <span style={s.logUser}>👤 {log.user}</span>
                      <span style={s.logTime}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ ...s.logAction, color: "#6C63FF" }}>
                    {log.action}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
};

const s = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    background: "#FFFFFF",
    color: "#4B2E83",
    maxWidth: 1200,
    margin: "auto",
    padding: "20px"
  },

  loader: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FFFFFF"
  },

  loaderInner: { textAlign: "center" },
  loaderIcon: { fontSize: 48, marginBottom: 16 },
  loaderText: { fontSize: 16, color: "#7B6CBF", marginBottom: 20 },

  loaderBar: {
    width: 200,
    height: 3,
    background: "#E6E0F8",
    borderRadius: 2,
    margin: "0 auto"
  },

  loaderFill: {
    height: "100%",
    background: "#6C63FF",
    borderRadius: 2
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 28
  },

  pageTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 28,
    fontWeight: 800,
    color: "#5A3EC8"
  },

  pageSubtitle: { fontSize: 13, color: "#8F80C9" },

  refreshBtn: {
    padding: "8px 16px",
    background: "#EFE9FF",
    border: "1px solid #D8CFFF",
    borderRadius: 8,
    color: "#5A3EC8",
    cursor: "pointer",
    fontWeight: 600
  },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    gap: 16,
    marginBottom: 24
  },

  statCard: {
    background: "#FFFFFF",
    borderRadius: 14,
    padding: "20px",
    boxShadow: "0 4px 12px rgba(108,99,255,0.1)"
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    marginBottom: 14
  },

  statValue: {
    fontSize: 30,
    fontWeight: 800,
    color: "#4B2E83"
  },

  statLabel: {
    fontSize: 12,
    color: "#8F80C9",
    marginBottom: 14
  },

  statBar: { height: 3, borderRadius: 2, overflow: "hidden" },
  statBarFill: { height: "100%" },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#7B6CBF" },

  actionsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: 12
  },

  actionBtn: {
    padding: "16px 20px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 12
  },

  actionLabel: { fontSize: 14, fontWeight: 600 },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 20
  },

  card: {
    background: "#FFFFFF",
    border: "1px solid #E6E0F8",
    borderRadius: 16,
    padding: "24px",
    boxShadow: "0 4px 12px rgba(108,99,255,0.1)"
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#5A3EC8"
  },

  cardCount: {
    fontSize: 12,
    color: "#7B6CBF"
  },

  badge: {
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 20
  },

  bcGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },

  bcItem: {
    background: "#F5F2FF",
    borderRadius: 10,
    padding: "12px 14px"
  },

  bcItemLabel: { fontSize: 11, color: "#8F80C9" },

  bcItemValue: {
    fontSize: 15,
    fontWeight: 600,
    color: "#4B2E83"
  },

  overviewList: { display: "flex", flexDirection: "column", gap: 12 },

  overviewItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 14px",
    background: "#F5F2FF",
    borderRadius: 10
  },

  overviewLabel: { fontSize: 13, color: "#6C63FF" },
  overviewValue: { fontSize: 18, fontWeight: 700 },

  logList: { display: "flex", flexDirection: "column", gap: 2 },

  logItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 10px"
  },

  logAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#EFE9FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  logBody: { flex: 1 },
  logDesc: { fontSize: 13, color: "#4B2E83" },

  logMeta: { display: "flex", gap: 12 },

  logUser: { fontSize: 11, color: "#8F80C9" },
  logTime: { fontSize: 11, color: "#B0A6D8" },

  logAction: {
    fontSize: 10,
    fontWeight: 700
  },

  empty: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#8F80C9"
  }
};

export default AdminDashboard;