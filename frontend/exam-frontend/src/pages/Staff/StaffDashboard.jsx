import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const StaffDashboard = () => {
  const [exams, setExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [examsRes, notifRes] = await Promise.all([
        api.get("/api/exams/"),
        api.get("/api/notifications/"),
      ]);
      setExams(examsRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label:"Assigned Exams", value: exams.length,                                           icon:"📋", color:"#00C9A7" },
    { label:"Draft",          value: exams.filter(e=>e.workflow_status==="DRAFT").length,     icon:"✏️", color:"#94a3b8" },
    { label:"Submitted",      value: exams.filter(e=>e.workflow_status==="SUBMITTED").length, icon:"⏳", color:"#FFD166" },
    { label:"Approved",       value: exams.filter(e=>e.workflow_status==="APPROVED").length,  icon:"✅", color:"#00C9A7" },
    { label:"Rejected",       value: exams.filter(e=>e.workflow_status==="REJECTED").length,  icon:"❌", color:"#FF6B6B" },
    { label:"Locked",         value: exams.filter(e=>e.workflow_status==="LOCKED").length,    icon:"🔒", color:"#6C63FF" },
  ];

  const approvedExams = exams.filter(e => e.workflow_status === "APPROVED");
  const rejectedExams = exams.filter(e => e.workflow_status === "REJECTED");

  // Per-exam question notifications from API
  const qnApprovedNotifs = notifications.filter(n => n.type === "QN_APPROVED");
  const qnRejectedNotifs = notifications.filter(n => n.type === "QN_REJECTED");

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(26,46,42,0.5)", fontFamily:"'DM Sans',sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.05); transform: translateY(-2px); }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a2e2a", maxWidth:1100 }}>

        {/* Welcome Banner */}
        <div className="fade-up" style={{ background:"linear-gradient(135deg, #00C9A7, #00a187)", borderRadius:16, padding:"28px 32px", marginBottom:24, color:"#fff", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", right:32, top:"50%", transform:"translateY(-50%)", fontSize:80, opacity:0.1 }}>👨‍🏫</div>
          <div style={{ fontSize:13, fontWeight:600, opacity:0.8, marginBottom:6, letterSpacing:"0.06em" }}>WELCOME BACK</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, marginBottom:6 }}>
            {localStorage.getItem("username") || "Staff"} 👋
          </div>
          <div style={{ fontSize:14, opacity:0.85 }}>
            {approvedExams.length > 0
              ? `✅ ${approvedExams.length} exam(s) approved — ready to lock!`
              : rejectedExams.length > 0
              ? `❌ ${rejectedExams.length} exam(s) rejected — check feedback below`
              : `You have ${exams.filter(e=>e.workflow_status==="DRAFT").length} exam(s) waiting for questions`}
          </div>
        </div>

        {/* ✅ EXAM APPROVED NOTIFICATION */}
        {approvedExams.length > 0 && (
          <div className="fade-up" style={{ background:"rgba(0,201,167,0.08)", border:"2px solid rgba(0,201,167,0.3)", borderRadius:16, padding:20, marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ fontSize:28 }}>✅</div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#00C9A7" }}>
                  Admin Approved {approvedExams.length} Exam(s)!
                </div>
                <div style={{ fontSize:13, color:"rgba(26,46,42,0.6)" }}>
                  You can now lock the question paper on blockchain
                </div>
              </div>
              <button className="act-btn" onClick={() => navigate("/staff/lock")}
                style={{ marginLeft:"auto", padding:"10px 20px", background:"#00C9A7", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(0,201,167,0.3)" }}>
                🔒 Lock Now →
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {approvedExams.map(exam => (
                <div key={exam.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"rgba(0,201,167,0.06)", border:"1px solid rgba(0,201,167,0.15)", borderRadius:10 }}>
                  <span style={{ fontSize:14 }}>📝</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>{exam.exam_name}</span>
                  <span style={{ fontSize:11, color:"rgba(26,46,42,0.4)", marginLeft:"auto" }}>📅 {exam.exam_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ❌ EXAM REJECTED NOTIFICATION */}
        {rejectedExams.length > 0 && (
          <div className="fade-up" style={{ background:"rgba(255,107,107,0.06)", border:"2px solid rgba(255,107,107,0.25)", borderRadius:16, padding:20, marginBottom:16, animationDelay:"0.05s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ fontSize:28 }}>❌</div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#FF6B6B" }}>
                  {rejectedExams.length} Exam(s) Rejected by Admin
                </div>
                <div style={{ fontSize:13, color:"rgba(26,46,42,0.6)" }}>
                  Check rejected questions and fix them then resubmit
                </div>
              </div>
              <button className="act-btn" onClick={() => navigate("/staff/questions")}
                style={{ marginLeft:"auto", padding:"10px 20px", background:"#FF6B6B", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(255,107,107,0.3)" }}>
                ✏️ Fix Questions →
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {rejectedExams.map(exam => (
                <div key={exam.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"rgba(255,107,107,0.04)", border:"1px solid rgba(255,107,107,0.15)", borderRadius:10 }}>
                  <span style={{ fontSize:14 }}>📝</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>{exam.exam_name}</span>
                  <span style={{ fontSize:11, color:"rgba(26,46,42,0.4)", marginLeft:"auto" }}>📅 {exam.exam_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ QUESTION APPROVED PER EXAM — from API */}
        {qnApprovedNotifs.length > 0 && (
          <div className="fade-up" style={{ background:"rgba(0,201,167,0.04)", border:"1px solid rgba(0,201,167,0.2)", borderRadius:16, padding:20, marginBottom:16, animationDelay:"0.08s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ fontSize:20 }}>✅</span>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#00C9A7" }}>
                Questions Approved by Admin
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {qnApprovedNotifs.map(notif => (
                <div key={notif.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#fff", border:"1px solid rgba(0,201,167,0.12)", borderRadius:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:"rgba(0,201,167,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📝</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{notif.exam_name}</div>
                      <div style={{ fontSize:11, color:"rgba(26,46,42,0.5)", marginTop:1 }}>{notif.message}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"rgba(0,201,167,0.1)", color:"#00C9A7" }}>
                    {notif.count} approved
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ❌ QUESTION REJECTED PER EXAM — from API */}
        {qnRejectedNotifs.length > 0 && (
          <div className="fade-up" style={{ background:"rgba(255,107,107,0.04)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:16, padding:20, marginBottom:16, animationDelay:"0.1s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ fontSize:20 }}>❌</span>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#FF6B6B" }}>
                Questions Rejected — Needs Fix
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {qnRejectedNotifs.map(notif => (
                <div key={notif.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#fff", border:"1px solid rgba(255,107,107,0.12)", borderRadius:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:"rgba(255,107,107,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📝</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{notif.exam_name}</div>
                      <div style={{ fontSize:11, color:"rgba(26,46,42,0.5)", marginTop:1 }}>{notif.message}</div>
                    </div>
                  </div>
                  <button className="act-btn" onClick={() => navigate("/staff/questions")}
                    style={{ padding:"6px 14px", borderRadius:8, border:"1px solid rgba(255,107,107,0.25)", background:"rgba(255,107,107,0.08)", color:"#FF6B6B", fontSize:11, fontWeight:700, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
                    ✏️ Fix →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:24 }}>
          {stats.map((s,i) => (
            <div key={i} className="fade-up" style={{ background:"#fff", border:`1px solid ${s.color}22`, borderRadius:14, padding:"16px", animationDelay:`${i*0.07}s` }}>
              <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:"rgba(26,46,42,0.45)", marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Exam List */}
        <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>📋 My Assigned Exams</div>
            <button className="act-btn" onClick={() => navigate("/staff/exams")}
              style={{ padding:"7px 16px", borderRadius:8, border:"1px solid rgba(0,201,167,0.3)", background:"rgba(0,201,167,0.06)", color:"#00C9A7", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              View All →
            </button>
          </div>

          {exams.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:"rgba(26,46,42,0.4)" }}>
              <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
              <div>No exams assigned yet</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {exams.map((exam, i) => {
                const STATUS_CONFIG = {
                  DRAFT:     { color:"#94a3b8", label:"Draft",     icon:"✏️", action:"Add Questions",   path:"/staff/questions" },
                  SUBMITTED: { color:"#FFD166", label:"Submitted", icon:"⏳", action:"Awaiting Review", path:null              },
                  APPROVED:  { color:"#00C9A7", label:"Approved",  icon:"✅", action:"Lock Paper",      path:"/staff/lock"     },
                  REJECTED:  { color:"#FF6B6B", label:"Rejected",  icon:"❌", action:"Fix Questions",   path:"/staff/questions" },
                  LOCKED:    { color:"#6C63FF", label:"Locked",    icon:"🔒", action:"View Results",    path:"/staff/results"  },
                };
                const sc = STATUS_CONFIG[exam.workflow_status] || STATUS_CONFIG.DRAFT;
                return (
                  <div key={exam.id} className="fade-up"
                    style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background: exam.workflow_status==="APPROVED" ? "rgba(0,201,167,0.03)" : exam.workflow_status==="REJECTED" ? "rgba(255,107,107,0.03)" : "rgba(26,46,42,0.02)", border:`1px solid ${sc.color}22`, borderRadius:12, animationDelay:`${i*0.05}s` }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${sc.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                      {sc.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{exam.exam_name}</div>
                      <div style={{ fontSize:12, color:"rgba(26,46,42,0.45)", display:"flex", gap:10, flexWrap:"wrap", marginTop:3 }}>
  <span>📅 {exam.exam_date}</span>
  <span>⏰ {exam.start_time}</span>
  {exam.department && (
    <span style={{ fontWeight:700, color:"#00C9A7", background:"rgba(0,201,167,0.08)", padding:"1px 8px", borderRadius:6 }}>
      🏛️ {exam.department}
    </span>
  )}
  {exam.semester && (
    <span style={{ fontWeight:700, color:"#6C63FF", background:"rgba(108,99,255,0.08)", padding:"1px 8px", borderRadius:6 }}>
      📚 Sem {exam.semester}
    </span>
  )}
</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, color:sc.color, background:`${sc.color}15`, border:`1px solid ${sc.color}33` }}>
                      {sc.icon} {sc.label}
                    </span>
                    {sc.path ? (
                      <button className="act-btn" onClick={() => navigate(sc.path)}
                        style={{ padding:"7px 14px", borderRadius:8, border:"none", background:`${sc.color}15`, color:sc.color, fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                        {sc.action} →
                      </button>
                    ) : (
                      <div style={{ padding:"7px 14px", borderRadius:8, background:"rgba(255,209,102,0.1)", color:"#FFD166", fontSize:12, fontWeight:600 }}>
                        {sc.action}
                      </div>
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

export default StaffDashboard;
