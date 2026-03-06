import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [blockchain, setBlockchain] = useState({});
  const [logs, setLogs] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => { if (selectedExam) fetchQuestions(selectedExam.id); }, [selectedExam]);

  const fetchDashboard = async () => {
    try {
      const [statsRes, bcRes, logsRes, examsRes] = await Promise.all([
        api.get("/api/admin/dashboard-stats/"),
        api.get("/api/admin/blockchain-status/"),
        api.get("/api/admin/audit-logs/"),
        api.get("/api/exams/"),
      ]);
      setStats(statsRes.data);
      setBlockchain(bcRes.data);
      setLogs(logsRes.data);
      setExams(examsRes.data);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (examId) => {
    setQuestionsLoading(true);
    try {
      const res = await api.get(`/api/exams/${examId}/questions/list/`);
      setQuestions(res.data);
    } catch (err) {
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const pendingQ  = questions.filter(q => q.status === "PENDING");
  const approvedQ = questions.filter(q => q.status === "APPROVED");
  const rejectedQ = questions.filter(q => q.status === "REJECTED");

  const STATUS_CONFIG = {
    DRAFT:     { color:"#94a3b8", bg:"rgba(148,163,184,0.1)", label:"Draft"     },
    SUBMITTED: { color:"#FFD166", bg:"rgba(255,209,102,0.1)", label:"Submitted" },
    APPROVED:  { color:"#00C9A7", bg:"rgba(0,201,167,0.1)",  label:"Approved"  },
    REJECTED:  { color:"#FF6B6B", bg:"rgba(255,107,107,0.1)", label:"Rejected" },
    LOCKED:    { color:"#6C63FF", bg:"rgba(108,99,255,0.1)", label:"Locked"    },
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
    { label:"Total Exams",       value:stats.total_exams       ?? 0, icon:"📋", color:"#6C63FF", bg:"#EFE9FF" },
    { label:"Active Exams",      value:stats.active_exams      ?? 0, icon:"🟢", color:"#00C9A7", bg:"#E6FFFB" },
    { label:"Total Staff",       value:stats.total_staff       ?? 0, icon:"👨‍🏫", color:"#FFD166", bg:"#FFF7E0" },
    { label:"Total Students",    value:stats.total_students    ?? 0, icon:"👨‍🎓", color:"#FF6B6B", bg:"#FFECEC" },
    { label:"Pending Approvals", value:stats.pending_approvals ?? 0, icon:"⏳", color:"#FF6584", bg:"#FFE9EF" },
  ];

  const actionButtons = [
    { label:"Create Exam",       icon:"➕",  color:"#6C63FF", link:"/admin/exams"           },
    { label:"Approve Questions", icon:"✅",  color:"#00C9A7", link:"/admin/approvals"       },
    { label:"Manage Users",      icon:"👥",  color:"#FFD166", link:"/admin/users"           },
    { label:"Manage Students",   icon:"👨‍🎓", color:"#FF6B6B", link:"/admin/users"           },
    { label:"Publish Results",   icon:"📢",  color:"#FF6584", link:"/admin/publish-results" },
    { label:"Blockchain",        icon:"⛓️",  color:"#6C63FF", link:"/admin/blockchain"      },
    { label:"Reports",           icon:"📊",  color:"#00C9A7", link:"/admin/reports"         },
    { label:"Audit Logs",        icon:"📜",  color:"#94a3b8", link:"/admin/audit-logs"      },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .stat-card { animation: fadeUp 0.4s ease both; }
        .stat-card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(108,99,255,0.15) !important; }
        .action-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important; }
        .log-item:hover { background: #F5F2FF !important; }
        .exam-tab { transition: all 0.15s; cursor: pointer; }
        .exam-tab:hover { background: rgba(108,99,255,0.06) !important; }
        .q-row { transition: background 0.15s; }
        .q-row:hover { background: rgba(108,99,255,0.02) !important; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
        .hash-text { font-family:'Courier New',monospace; font-size:11px; color:#6C63FF; background:#EFE9FF; padding:2px 6px; border-radius:4px; }
      `}</style>

      <div style={s.root}>

        {/* ── HEADER ── */}
        <div style={s.pageHeader}>
          <div>
            <div style={s.pageTitle}>Admin Dashboard</div>
            <div style={s.pageSubtitle}>
              {new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
            </div>
          </div>
          <button onClick={fetchDashboard} style={s.refreshBtn}>↻ Refresh</button>
        </div>

        {/* ── STATS ── */}
        <div style={s.statsRow}>
          {statCards.map((c, i) => (
            <div key={i} className="stat-card" style={{ ...s.statCard, border:`1px solid ${c.color}22`, animationDelay:`${i*0.07}s` }}>
              <div style={{ ...s.statIcon, background:c.bg, color:c.color }}>{c.icon}</div>
              <div style={s.statValue}>{c.value}</div>
              <div style={s.statLabel}>{c.label}</div>
              <div style={{ ...s.statBar, background:`${c.color}22` }}>
                <div style={{ ...s.statBarFill, width:`${Math.min((c.value/20)*100,100)}%`, background:c.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#7B6CBF", marginBottom:12, letterSpacing:"0.06em" }}>
            ⚡ QUICK ACTIONS
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {actionButtons.map((btn, i) => (
              <a key={i} href={btn.link} className="action-btn"
                style={{ padding:"16px 20px", borderRadius:12, display:"flex", alignItems:"center", gap:12, border:`1px solid ${btn.color}33`, background:"#F7F5FF", textDecoration:"none", transition:"all 0.15s" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${btn.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  {btn.icon}
                </div>
                <span style={{ fontSize:13, fontWeight:600, color:btn.color }}>{btn.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── EXAM QUESTION MONITOR ── */}
        <div style={{ ...s.card, marginBottom:20 }}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>🔍 Exam Question Monitor</span>
            <span style={s.cardCount}>Click any exam to see questions created by staff</span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", border:"1px solid #E6E0F8", borderRadius:12, overflow:"hidden", minHeight:380 }}>

            {/* Exam List */}
            <div style={{ borderRight:"1px solid #E6E0F8", padding:12, overflowY:"auto", maxHeight:420, background:"#FAFAFA" }}>
              {exams.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 10px", color:"#8F80C9", fontSize:12 }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>📭</div>
                  No exams yet
                </div>
              ) : (
                exams.map((exam) => {
                  const sc = STATUS_CONFIG[exam.workflow_status] || STATUS_CONFIG.DRAFT;
                  const isSelected = selectedExam?.id === exam.id;
                  return (
                    <div key={exam.id} className="exam-tab"
                      onClick={() => setSelectedExam(exam)}
                      style={{ padding:"10px 12px", borderRadius:10, marginBottom:6, background: isSelected ? "rgba(108,99,255,0.08)" : "transparent", border: isSelected ? "1.5px solid rgba(108,99,255,0.25)" : "1px solid transparent" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:12, fontWeight:700, color: isSelected ? "#6C63FF" : "#4B2E83" }}>
                          {exam.exam_name}
                        </span>
                        <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:20, color:sc.color, background:sc.bg }}>
                          {sc.label}
                        </span>
                      </div>
                      <div style={{ fontSize:10, color:"#8F80C9" }}>
                        👨‍🏫 {exam.assigned_staff || "—"} · 📅 {exam.exam_date}
                      </div>
                      <div style={{ fontSize:10, color:"#8F80C9", marginTop:2 }}>
                        🏛️ {exam.department || "—"} {exam.semester ? `· Sem ${exam.semester}` : ""}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Questions Panel */}
            <div style={{ padding:20, overflowY:"auto", maxHeight:420 }}>
              {!selectedExam ? (
                <div style={{ textAlign:"center", padding:"80px 20px", color:"#8F80C9" }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>👈</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700 }}>Select an exam</div>
                  <div style={{ fontSize:12, marginTop:4 }}>to view all questions created by staff</div>
                </div>
              ) : questionsLoading ? (
                <div style={{ textAlign:"center", padding:40, color:"#8F80C9" }}>Loading questions...</div>
              ) : (
                <>
                  {/* Exam Info */}
                  <div style={{ marginBottom:16, padding:"10px 14px", background:"#F5F2FF", borderRadius:10 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"#5A3EC8", marginBottom:4 }}>
                      {selectedExam.exam_name}
                    </div>
                    <div style={{ fontSize:11, color:"#8F80C9", display:"flex", gap:12, flexWrap:"wrap" }}>
                      <span>📅 {selectedExam.exam_date}</span>
                      <span>⏰ {selectedExam.start_time}</span>
                      <span>👨‍🏫 {selectedExam.assigned_staff || "—"}</span>
                      <span>🏛️ {selectedExam.department} {selectedExam.semester ? `Sem ${selectedExam.semester}` : ""}</span>
                      <span>👨‍🎓 {selectedExam.enrolled_students_count || 0} enrolled</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                    {[
                      { label:"Total",    value:questions.length, color:"#6C63FF" },
                      { label:"Pending",  value:pendingQ.length,  color:"#FFD166" },
                      { label:"Approved", value:approvedQ.length, color:"#00C9A7" },
                      { label:"Rejected", value:rejectedQ.length, color:"#FF6B6B" },
                    ].map((st, i) => (
                      <div key={i} style={{ padding:"8px 14px", borderRadius:10, background:`${st.color}10`, border:`1px solid ${st.color}22`, textAlign:"center", flex:1 }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:st.color }}>{st.value}</div>
                        <div style={{ fontSize:10, color:"#8F80C9", marginTop:2 }}>{st.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Go to Approvals */}
                  {pendingQ.length > 0 && (
                    <button className="act-btn"
                      onClick={() => navigate("/admin/approvals")}
                      style={{ width:"100%", padding:"10px", borderRadius:10, border:"1px solid rgba(108,99,255,0.25)", background:"rgba(108,99,255,0.06)", color:"#6C63FF", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", marginBottom:16, cursor:"pointer" }}>
                      ✅ Review {pendingQ.length} Pending Question(s) in Approvals →
                    </button>
                  )}

                  {questions.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"30px 20px", color:"#8F80C9" }}>
                      <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
                      <div style={{ fontSize:13, fontWeight:600 }}>No questions yet</div>
                      <div style={{ fontSize:11, marginTop:4 }}>Staff hasn't added questions</div>
                    </div>
                  ) : (
                    questions.map((q, i) => {
                      const qColor = q.status==="APPROVED" ? "#00C9A7" : q.status==="REJECTED" ? "#FF6B6B" : "#FFD166";
                      return (
                        <div key={q.id} className="q-row"
                          style={{ padding:"12px 14px", borderRadius:10, border:`1px solid ${qColor}20`, background:`${qColor}04`, marginBottom:8 }}>
                          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                            <div style={{ width:24, height:24, borderRadius:6, background:`${qColor}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:qColor, flexShrink:0 }}>
                              {i+1}
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:600, color:"#4B2E83", marginBottom:8, lineHeight:1.5 }}>
                                {q.question_text}
                              </div>
                              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                                {["a","b","c","d"].map(opt => (
                                  <div key={opt} style={{ padding:"4px 8px", borderRadius:6, background: q.correct_option===opt.toUpperCase() ? "rgba(0,201,167,0.08)" : "rgba(26,26,46,0.03)", border: q.correct_option===opt.toUpperCase() ? "1px solid rgba(0,201,167,0.2)" : "1px solid rgba(26,26,46,0.06)", display:"flex", alignItems:"center", gap:5 }}>
                                    <span style={{ width:15, height:15, borderRadius:3, background: q.correct_option===opt.toUpperCase() ? "#00C9A7" : "rgba(26,26,46,0.08)", color: q.correct_option===opt.toUpperCase() ? "#fff" : "rgba(26,26,46,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:800, flexShrink:0 }}>
                                      {opt.toUpperCase()}
                                    </span>
                                    <span style={{ fontSize:10 }}>{q[`option_${opt}`]}</span>
                                  </div>
                                ))}
                              </div>
                              {q.status === "REJECTED" && q.rejection_reason && (
                                <div style={{ marginTop:6, padding:"5px 8px", background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:6, fontSize:11, color:"#FF6B6B" }}>
                                  💬 {q.rejection_reason}
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:20, background:`${qColor}15`, color:qColor, flexShrink:0 }}>
                              {q.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── BLOCKCHAIN + OVERVIEW ── */}
        <div style={s.twoCol}>
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>⛓️ Blockchain Status</span>
              <span style={{ ...s.badge, background: blockchain.connected ? "#E6FFFB" : "#FFECEC", color: blockchain.connected ? "#00C9A7" : "#FF6B6B" }}>
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
                <div style={{ ...s.bcItemValue, color:"#6C63FF" }}>#{blockchain.current_block ?? "—"}</div>
              </div>
              <div style={{ ...s.bcItem, gridColumn:"1/-1" }}>
                <div style={s.bcItemLabel}>Admin Account</div>
                <div className="hash-text">{blockchain.admin_account ?? "Not connected"}</div>
              </div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitle}>📈 System Overview</span>
            </div>
            <div style={s.overviewList}>
              {[
                { label:"Exams Completed",     value:(stats.total_exams??0)-(stats.active_exams??0),                                                                                         color:"#6C63FF" },
                { label:"Approval Rate",        value:`${stats.pending_approvals>0 ? Math.round(((stats.total_exams-stats.pending_approvals)/stats.total_exams)*100) : 100}%`,               color:"#00C9A7" },
                { label:"Staff:Student Ratio",  value:`1:${stats.total_staff>0 ? Math.round(stats.total_students/stats.total_staff) : 0}`,                                                   color:"#FFD166" },
                { label:"Pending Reviews",      value:stats.pending_approvals ?? 0,                                                                                                          color:"#FF6584" },
              ].map((item, i) => (
                <div key={i} style={s.overviewItem}>
                  <div style={s.overviewLabel}>{item.label}</div>
                  <div style={{ ...s.overviewValue, color:item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── AUDIT LOGS ── */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>📜 Recent Activity</span>
            <span style={s.cardCount}>{logs.length} entries</span>
          </div>
          {logs.length === 0 ? (
            <div style={s.empty}>No activity recorded yet</div>
          ) : (
            <div style={s.logList}>
              {logs.slice(0,8).map((log, i) => (
                <div key={i} className="log-item" style={s.logItem}>
                  <div style={s.logAvatar}>⚙️</div>
                  <div style={s.logBody}>
                    <div style={s.logDesc}>{log.description}</div>
                    <div style={s.logMeta}>
                      <span style={s.logUser}>👤 {log.user}</span>
                      <span style={s.logTime}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ ...s.logAction, color:"#6C63FF" }}>{log.action}</div>
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
  root:         { fontFamily:"'DM Sans',sans-serif", background:"#FFFFFF", color:"#4B2E83", maxWidth:1200, margin:"auto", padding:"20px" },
  loader:       { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#FFFFFF" },
  loaderInner:  { textAlign:"center" },
  loaderIcon:   { fontSize:48, marginBottom:16 },
  loaderText:   { fontSize:16, color:"#7B6CBF", marginBottom:20 },
  loaderBar:    { width:200, height:3, background:"#E6E0F8", borderRadius:2, margin:"0 auto" },
  loaderFill:   { height:"100%", background:"#6C63FF", borderRadius:2 },
  pageHeader:   { display:"flex", justifyContent:"space-between", marginBottom:28 },
  pageTitle:    { fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:"#5A3EC8" },
  pageSubtitle: { fontSize:13, color:"#8F80C9" },
  refreshBtn:   { padding:"8px 16px", background:"#EFE9FF", border:"1px solid #D8CFFF", borderRadius:8, color:"#5A3EC8", cursor:"pointer", fontWeight:600 },
  statsRow:     { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:16, marginBottom:24 },
  statCard:     { background:"#FFFFFF", borderRadius:14, padding:"20px", boxShadow:"0 4px 12px rgba(108,99,255,0.1)" },
  statIcon:     { width:40, height:40, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, marginBottom:14 },
  statValue:    { fontSize:30, fontWeight:800, color:"#4B2E83" },
  statLabel:    { fontSize:12, color:"#8F80C9", marginBottom:14 },
  statBar:      { height:3, borderRadius:2, overflow:"hidden" },
  statBarFill:  { height:"100%" },
  twoCol:       { display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 },
  card:         { background:"#FFFFFF", border:"1px solid #E6E0F8", borderRadius:16, padding:"24px", boxShadow:"0 4px 12px rgba(108,99,255,0.1)" },
  cardHeader:   { display:"flex", justifyContent:"space-between", marginBottom:20 },
  cardTitle:    { fontSize:16, fontWeight:700, color:"#5A3EC8" },
  cardCount:    { fontSize:12, color:"#7B6CBF" },
  badge:        { fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20 },
  bcGrid:       { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  bcItem:       { background:"#F5F2FF", borderRadius:10, padding:"12px 14px" },
  bcItemLabel:  { fontSize:11, color:"#8F80C9" },
  bcItemValue:  { fontSize:15, fontWeight:600, color:"#4B2E83" },
  overviewList: { display:"flex", flexDirection:"column", gap:12 },
  overviewItem: { display:"flex", justifyContent:"space-between", padding:"12px 14px", background:"#F5F2FF", borderRadius:10 },
  overviewLabel:{ fontSize:13, color:"#6C63FF" },
  overviewValue:{ fontSize:18, fontWeight:700 },
  logList:      { display:"flex", flexDirection:"column", gap:2 },
  logItem:      { display:"flex", alignItems:"center", gap:14, padding:"12px 10px" },
  logAvatar:    { width:36, height:36, borderRadius:10, background:"#EFE9FF", display:"flex", alignItems:"center", justifyContent:"center" },
  logBody:      { flex:1 },
  logDesc:      { fontSize:13, color:"#4B2E83" },
  logMeta:      { display:"flex", gap:12 },
  logUser:      { fontSize:11, color:"#8F80C9" },
  logTime:      { fontSize:11, color:"#B0A6D8" },
  logAction:    { fontSize:10, fontWeight:700 },
  empty:        { textAlign:"center", padding:"40px 20px", color:"#8F80C9" },
};

export default AdminDashboard;
