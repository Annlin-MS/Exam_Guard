import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const StudentDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get("/api/exams/");
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const upcoming = exams.filter(e => e.status === "UPCOMING");
  const ongoing = exams.filter(e => e.status === "ONGOING");
  const submitted = exams.filter(e => e.status === "SUBMITTED");

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(46,26,26,0.5)", fontFamily:"'DM Sans',sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.05); transform: translateY(-2px); }
        .exam-card { transition: all 0.2s; }
        .exam-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(255,107,107,0.1) !important; }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#2e1a1a", maxWidth:1100 }}>

        {/* Welcome Banner */}
        <div className="fade-up" style={{ background:"linear-gradient(135deg, #FF6B6B, #ee5a24)", borderRadius:16, padding:"28px 32px", marginBottom:24, color:"#fff", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", right:32, top:"50%", transform:"translateY(-50%)", fontSize:80, opacity:0.1 }}>👨‍🎓</div>
          <div style={{ fontSize:13, fontWeight:600, opacity:0.8, marginBottom:6, letterSpacing:"0.06em" }}>WELCOME BACK</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, marginBottom:6 }}>
            {localStorage.getItem("username") || "Student"} 👋
          </div>
          <div style={{ fontSize:14, opacity:0.85 }}>
            {ongoing.length > 0
              ? `🔴 ${ongoing.length} exam is LIVE right now!`
              : upcoming.length > 0
              ? `📅 You have ${upcoming.length} upcoming exam(s)`
              : "No upcoming exams. Stay prepared! 💪"}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
          {[
            { label:"Total Exams", value:exams.length, icon:"📋", color:"#FF6B6B" },
            { label:"Upcoming", value:upcoming.length, icon:"📅", color:"#FFD166" },
            { label:"Live Now", value:ongoing.length, icon:"🔴", color:"#FF6B6B" },
            { label:"Completed", value:submitted.length, icon:"✅", color:"#00C9A7" },
          ].map((s,i) => (
            <div key={i} className="fade-up" style={{ background:"#fff", border:`1px solid ${s.color}22`, borderRadius:14, padding:"20px", animationDelay:`${i*0.07}s` }}>
              <div style={{ fontSize:24, marginBottom:10 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:12, color:"rgba(46,26,26,0.45)", marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Live Exam Alert */}
        {ongoing.length > 0 && (
          <div className="fade-up" style={{ background:"rgba(255,107,107,0.08)", border:"2px solid rgba(255,107,107,0.3)", borderRadius:16, padding:20, marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ fontSize:32, animation:"pulse 1.5s infinite" }}>🔴</div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#FF6B6B", marginBottom:4 }}>
                  LIVE: {ongoing[0].exam_name}
                </div>
                <div style={{ fontSize:13, color:"rgba(46,26,26,0.6)" }}>
                  Exam is ongoing! Click to start now.
                </div>
              </div>
            </div>
            <button className="act-btn" onClick={() => navigate("/student/exams")}
              style={{ padding:"12px 28px", background:"#FF6B6B", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 16px rgba(255,107,107,0.4)" }}>
              Start Now →
            </button>
          </div>
        )}

        {/* Exam List */}
        <div style={{ background:"#fff", border:"1px solid rgba(255,107,107,0.1)", borderRadius:16, padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>📋 My Exams</div>
            <button className="act-btn" onClick={() => navigate("/student/exams")}
              style={{ padding:"7px 16px", borderRadius:8, border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.06)", color:"#FF6B6B", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              View All →
            </button>
          </div>

          {exams.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:"rgba(46,26,26,0.4)" }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
              <div>No exams enrolled yet</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {exams.slice(0,5).map((exam,i) => {
                const statusColors = { UPCOMING:"#FFD166", ONGOING:"#FF6B6B", SUBMITTED:"#00C9A7", MISSED:"#94a3b8" };
                const color = statusColors[exam.status] || "#94a3b8";
                return (
                  <div key={exam.id} className="fade-up" style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:"rgba(255,107,107,0.03)", border:"1px solid rgba(255,107,107,0.08)", borderRadius:12, animationDelay:`${i*0.05}s` }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,107,107,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📝</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{exam.exam_name}</div>
                      <div style={{ fontSize:12, color:"rgba(46,26,26,0.45)" }}>📅 {exam.exam_date} · ⏱️ {exam.duration} min</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, color, background:`${color}15`, border:`1px solid ${color}33` }}>
                      {exam.status}
                    </span>
                    {exam.status === "ONGOING" && (
                      <button className="act-btn" onClick={() => navigate("/student/exams")}
                        style={{ padding:"7px 14px", borderRadius:8, border:"none", background:"#FF6B6B", color:"#fff", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                        Start →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
