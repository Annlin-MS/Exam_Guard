import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get("/api/exams/");
      setExams(response.data);
    } catch (error) {
      console.error("Error fetching exams", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttempt = (examId) => {
    navigate(`/student/exam/${examId}`);
  };

  // Helper to get status badge style
  const getStatusBadge = (status) => {
    const badges = {
      UPCOMING: { text: "🟡 Upcoming", color: "#b76e00", bg: "#fff4e5" },
      ONGOING: { text: "🟢 Ongoing", color: "#1e7e34", bg: "#e6f7e6" },
      COMPLETED: { text: "⚫ Completed", color: "#5e5e5e", bg: "#f0f0f0" },
      SUBMITTED: { text: "✅ Submitted", color: "#2b5e8c", bg: "#e3f2fd" },
      MISSED: { text: "⏰ Missed", color: "#a94442", bg: "#fce4e4" },
    };
    return badges[status] || { text: status, color: "#333", bg: "#eee" };
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading your exams...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header with stats */}
      <div style={styles.header}>
        <h1 style={styles.title}>🎓 Student Dashboard</h1>
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{exams.length}</span>
            <span style={styles.statLabel}>Total Exams</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>
              {exams.filter(e => e.status === "ONGOING").length}
            </span>
            <span style={styles.statLabel}>Ongoing</span>
          </div>
        </div>
      </div>

      {exams.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No exams available at the moment. Check back later!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {exams.map((exam) => {
            const badge = getStatusBadge(exam.status);
            return (
              <div key={exam.id} style={styles.card}>
                <h3 style={styles.examName}>{exam.exam_name}</h3>
                <div style={styles.details}>
                  <p><strong>📅 Date:</strong> {exam.exam_date}</p>
                  <p><strong>⏱️ Duration:</strong> {exam.duration_minutes} mins</p>
                </div>
                <div style={styles.cardFooter}>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.text}
                  </span>

                  {/* Action based on status */}
                  {exam.status === "ONGOING" && (
                    <button
                      style={styles.primaryButton}
                      onClick={() => handleAttempt(exam.id)}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = "#0f2b4f")}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = "#1e3c72")}
                    >
                      ▶ Start Exam
                    </button>
                  )}

                  {exam.status === "SUBMITTED" && (
                    <button style={styles.secondaryButton} disabled>
                      Already Submitted
                    </button>
                  )}

                  {exam.status === "MISSED" && (
                    <button style={styles.disabledButton} disabled>
                      Missed
                    </button>
                  )}

                  {(exam.status === "UPCOMING" || exam.status === "COMPLETED") && (
                    <button style={styles.disabledButton} disabled>
                      {exam.status === "UPCOMING" ? "Not Started" : "Completed"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ====================== STYLES ======================
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontSize: "1.2rem",
    color: "#1e3c72",
  },
  spinner: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #1e3c72",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    flexWrap: "wrap",
    gap: "20px",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  stats: {
    display: "flex",
    gap: "15px",
  },
  statCard: {
    backgroundColor: "#ffffff",
    padding: "12px 24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    textAlign: "center",
    minWidth: "100px",
  },
  statValue: {
    display: "block",
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#1e3c72",
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "#64748b",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    color: "#64748b",
    fontSize: "1.2rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #e9eef2",
  },
  examName: {
    fontSize: "1.3rem",
    fontWeight: "600",
    color: "#1e3c72",
    margin: "0 0 16px 0",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "12px",
  },
  details: {
    marginBottom: "20px",
    flex: 1,
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "16px",
    flexWrap: "wrap",
    gap: "10px",
  },
  badge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
    letterSpacing: "0.02em",
  },
  primaryButton: {
    backgroundColor: "#1e3c72",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "not-allowed",
    opacity: 0.7,
  },
  disabledButton: {
    backgroundColor: "#adb5bd",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "not-allowed",
  },
};

// Inject keyframe for spinner
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default StudentDashboard;