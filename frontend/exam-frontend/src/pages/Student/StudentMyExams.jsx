import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const StudentMyExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
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

  const STATUS_CONFIG = {
    UPCOMING: { color:"#FFD166", bg:"rgba(255,209,102,0.1)", label:"Upcoming", icon:"📅" },
    ONGOING:  { color:"#FF6B6B", bg:"rgba(255,107,107,0.1)", label:"Live Now", icon:"🔴" },
    SUBMITTED:{ color:"#00C9A7", bg:"rgba(0,201,167,0.1)",  label:"Completed", icon:"✅" },
    MISSED:   { color:"#94a3b8", bg:"rgba(148,163,184,0.1)", label:"Missed",   icon:"❌" },
  };

  const filtered = filter === "ALL" ? exams : exams.filter(e => e.status === filter);

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(46,26,26,0.5)", fontFamily:"'DM Sans',sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .exam-card { transition: all 0.2s; }
        .exam-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(255,107,107,0.1) !important; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#2e1a1a", maxWidth:1100 }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>📝 My Exams</div>
          <div style={{ fontSize:13, color:"rgba(46,26,26,0.45)" }}>{exams.length} exams enrolled</div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
          {Object.entries(STATUS_CONFIG).map(([key, sc], i) => (
            <div key={key} className="fade-up" style={{ background:"#fff", border:`1px solid ${sc.color}22`, borderRadius:12, padding:"14px 16px", cursor:"pointer", animationDelay:`${i*0.06}s` }}
              onClick={() => setFilter(filter===key ? "ALL" : key)}>
              <div style={{ fontSize:20, marginBottom:6 }}>{sc.icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:sc.color }}>
                {exams.filter(e => e.status === key).length}
              </div>
              <div style={{ fontSize:11, color:"rgba(46,26,26,0.45)", marginTop:2 }}>{sc.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {["ALL","UPCOMING","ONGOING","SUBMITTED","MISSED"].map(f => (
            <button key={f} className="act-btn" onClick={() => setFilter(f)}
              style={{ padding:"7px 14px", borderRadius:8, border: filter===f ? "1px solid #FF6B6B" : "1px solid rgba(46,26,26,0.12)", background: filter===f ? "#FF6B6B" : "transparent", color: filter===f ? "#fff" : "rgba(46,26,26,0.6)", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              {f === "ALL" ? `All (${exams.length})` : f}
            </button>
          ))}
        </div>

        {/* Exam Cards */}
        {filtered.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:16, padding:"60px 20px", textAlign:"center", color:"rgba(46,26,26,0.4)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>No exams found</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px,1fr))", gap:20 }}>
            {filtered.map((exam, i) => {
              const sc = STATUS_CONFIG[exam.status] || STATUS_CONFIG.UPCOMING;
              return (
                <div key={exam.id} className="exam-card fade-up" style={{ background:"#fff", border:"1px solid rgba(255,107,107,0.08)", borderRadius:16, padding:20, animationDelay:`${i*0.06}s` }}>

                  {/* Top */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:"rgba(255,107,107,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                      📝
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, color:sc.color, background:sc.bg, border:`1px solid ${sc.color}33`, letterSpacing:"0.05em", display:"flex", alignItems:"center", gap:4 }}>
                      {exam.status === "ONGOING" && <span style={{ animation:"pulse 1.5s infinite" }}>●</span>}
                      {sc.label}
                    </span>
                  </div>

                  {/* Name */}
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:14 }}>
                    {exam.exam_name}
                  </div>

                  {/* Details */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                    {[
                      ["📅", exam.exam_date],
                      ["⏰", exam.start_time],
                      ["⏱️", `${exam.duration} min`],
                      ["🔚", exam.end_time],
                    ].map(([icon, val], idx) => (
                      <div key={idx} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"rgba(46,26,26,0.55)", background:"rgba(46,26,26,0.03)", padding:"6px 10px", borderRadius:8 }}>
                        <span>{icon}</span><span>{val || "—"}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ height:1, background:"rgba(255,107,107,0.06)", marginBottom:14 }} />

                  {/* Action */}
                  {exam.status === "ONGOING" && (
                    <button className="act-btn" onClick={() => navigate(`/student/attempt/${exam.id}`)}
                      style={{ width:"100%", padding:"12px", borderRadius:10, border:"none", background:"#FF6B6B", color:"#fff", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 16px rgba(255,107,107,0.3)" }}>
                      🚀 Start Exam Now!
                    </button>
                  )}
                  {exam.status === "UPCOMING" && (
                    <div style={{ width:"100%", padding:"10px", borderRadius:10, background:"rgba(255,209,102,0.08)", color:"#FFD166", fontSize:13, fontWeight:600, textAlign:"center", border:"1px solid rgba(255,209,102,0.2)" }}>
                      ⏳ Not started yet
                    </div>
                  )}
                  {exam.status === "SUBMITTED" && (
                    <button className="act-btn" onClick={() => navigate("/student/results")}
                      style={{ width:"100%", padding:"10px", borderRadius:10, border:"none", background:"rgba(0,201,167,0.1)", color:"#00C9A7", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                      📊 View Results
                    </button>
                  )}
                  {exam.status === "MISSED" && (
                    <div style={{ width:"100%", padding:"10px", borderRadius:10, background:"rgba(148,163,184,0.08)", color:"#94a3b8", fontSize:13, fontWeight:600, textAlign:"center" }}>
                      ❌ Exam Missed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default StudentMyExams;