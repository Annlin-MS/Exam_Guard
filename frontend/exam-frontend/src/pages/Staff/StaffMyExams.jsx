import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const StaffMyExams = () => {
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
    DRAFT:     { color:"#94a3b8", bg:"rgba(148,163,184,0.1)", label:"Draft",     icon:"✏️" },
    SUBMITTED: { color:"#FFD166", bg:"rgba(255,209,102,0.1)", label:"Submitted", icon:"⏳" },
    APPROVED:  { color:"#00C9A7", bg:"rgba(0,201,167,0.1)",  label:"Approved",  icon:"✅" },
    LOCKED:    { color:"#6C63FF", bg:"rgba(108,99,255,0.1)", label:"Locked",    icon:"🔒" },
    REJECTED:  { color:"#FF6B6B", bg:"rgba(255,107,107,0.1)", label:"Rejected", icon:"❌" },
  };

  const filtered = filter === "ALL" ? exams : exams.filter(e => e.workflow_status === filter);

  const getAction = (exam) => {
    switch(exam.workflow_status) {
      case "DRAFT":     return { label:"➕ Add Questions", path:"/staff/questions", color:"#00C9A7", bg:"rgba(0,201,167,0.1)" };
      case "SUBMITTED": return { label:"⏳ Awaiting Approval", path:null, color:"#FFD166", bg:"rgba(255,209,102,0.1)" };
      case "APPROVED":  return { label:"🔒 Lock Paper", path:"/staff/lock", color:"#6C63FF", bg:"rgba(108,99,255,0.1)" };
      case "LOCKED":    return { label:"📊 View Results", path:"/staff/results", color:"#00C9A7", bg:"rgba(0,201,167,0.1)" };
      case "REJECTED":  return { label:"✏️ Edit Questions", path:"/staff/questions", color:"#FF6B6B", bg:"rgba(255,107,107,0.1)" };
      default: return null;
    }
  };

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(26,46,42,0.5)", fontFamily:"'DM Sans',sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .exam-card { transition: all 0.2s; }
        .exam-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,201,167,0.1) !important; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a2e2a", maxWidth:1100 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>📋 My Exams</div>
            <div style={{ fontSize:13, color:"rgba(26,46,42,0.45)" }}>{exams.length} exams assigned to you</div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
          {["DRAFT","SUBMITTED","APPROVED","LOCKED","REJECTED"].map((status,i) => {
            const sc = STATUS_CONFIG[status];
            const count = exams.filter(e => e.workflow_status === status).length;
            return (
              <div key={status} className="fade-up" style={{ background:"#fff", border:`1px solid ${sc.color}22`, borderRadius:12, padding:"14px 16px", animationDelay:`${i*0.06}s`, cursor:"pointer" }}
                onClick={() => setFilter(filter === status ? "ALL" : status)}>
                <div style={{ fontSize:18, marginBottom:6 }}>{sc.icon}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:sc.color }}>{count}</div>
                <div style={{ fontSize:11, color:"rgba(26,46,42,0.45)", marginTop:2 }}>{sc.label}</div>
              </div>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {["ALL", ...Object.keys(STATUS_CONFIG)].map(f => (
            <button key={f} className="act-btn" onClick={() => setFilter(f)}
              style={{ padding:"7px 14px", borderRadius:8, border: filter===f ? `1px solid #00C9A7` : "1px solid rgba(26,46,42,0.12)", background: filter===f ? "#00C9A7" : "transparent", color: filter===f ? "#fff" : "rgba(26,46,42,0.6)", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              {f === "ALL" ? `All (${exams.length})` : f}
            </button>
          ))}
        </div>

        {/* Exams Grid */}
        {filtered.length === 0 ? (
          <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, padding:"60px 20px", textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>No exams found</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px,1fr))", gap:20 }}>
            {filtered.map((exam, i) => {
              const sc = STATUS_CONFIG[exam.workflow_status] || STATUS_CONFIG.DRAFT;
              const action = getAction(exam);
              return (
                <div key={exam.id} className="exam-card fade-up" style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.08)", borderRadius:16, padding:20, animationDelay:`${i*0.06}s` }}>

                  {/* Top */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                    <div style={{ width:42, height:42, borderRadius:12, background:"rgba(0,201,167,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                      📝
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, color:sc.color, background:sc.bg, border:`1px solid ${sc.color}33`, letterSpacing:"0.05em" }}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>

                  {/* Name */}
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, marginBottom:14 }}>
                    {exam.exam_name}
                  </div>

                  {/* Details */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                    {[
                      ["📅", exam.exam_date || "—"],
                      ["⏰", exam.start_time || "—"],
                      ["⏱️", exam.duration ? `${exam.duration} min` : "—"],
                      ["❓", `${exam.total_questions_allowed || "?"} questions`],
                    ].map(([icon, val], idx) => (
                      <div key={idx} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"rgba(26,46,42,0.55)", background:"rgba(26,46,42,0.03)", padding:"6px 10px", borderRadius:8 }}>
                        <span>{icon}</span><span>{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Workflow Steps */}
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:16 }}>
                    {["DRAFT","SUBMITTED","APPROVED","LOCKED"].map((step, idx) => {
                      const steps = ["DRAFT","SUBMITTED","APPROVED","LOCKED"];
                      const currentIdx = steps.indexOf(exam.workflow_status);
                      const isDone = idx <= currentIdx;
                      const sc2 = STATUS_CONFIG[step];
                      return (
                        <React.Fragment key={step}>
                          <div style={{ width:24, height:24, borderRadius:"50%", background: isDone ? sc2.color : "rgba(26,46,42,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color: isDone ? "#fff" : "rgba(26,46,42,0.3)", fontWeight:800, transition:"all 0.3s" }}>
                            {idx + 1}
                          </div>
                          {idx < 3 && <div style={{ flex:1, height:2, background: isDone && idx < currentIdx ? "#00C9A7" : "rgba(26,46,42,0.08)", borderRadius:1, transition:"all 0.3s" }} />}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <div style={{ height:1, background:"rgba(0,201,167,0.06)", marginBottom:14 }} />

                  {/* Action Button */}
                  {action && (
                    action.path ? (
                      <button className="act-btn" onClick={() => navigate(action.path)}
                        style={{ width:"100%", padding:"10px", borderRadius:10, border:"none", background:action.bg, color:action.color, fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }}>
                        {action.label}
                      </button>
                    ) : (
                      <div style={{ width:"100%", padding:"10px", borderRadius:10, background:action.bg, color:action.color, fontSize:13, fontWeight:600, textAlign:"center" }}>
                        {action.label}
                      </div>
                    )
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

export default StaffMyExams;
