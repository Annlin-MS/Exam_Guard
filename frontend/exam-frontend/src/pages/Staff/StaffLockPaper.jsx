import React, { useState, useEffect } from "react";
import api from "../../services/api";

const StaffLockPaper = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [lockResult, setLockResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { fetchExams(); }, []);

  useEffect(() => {
    if (selectedExam) fetchQuestions(selectedExam.id);
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await api.get("/api/exams/");
      const approvedExams = res.data.filter(e =>
        e.workflow_status === "APPROVED" || e.workflow_status === "LOCKED"
      );
      setExams(approvedExams);
      if (approvedExams.length > 0) setSelectedExam(approvedExams[0]);
    } catch (err) {
      showToast("Failed to load exams", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (examId) => {
    try {
      const res = await api.get(`/api/exams/${examId}/questions/list/`);
      setQuestions(res.data);
    } catch (err) {
      showToast("Failed to load questions", "error");
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLock = async () => {
    setShowConfirm(false);
    setLocking(true);
    try {
      const res = await api.post(`/api/exams/${selectedExam.id}/lock/`);
      setLockResult(res.data);
      showToast("Question paper locked on blockchain! 🔒");
      fetchExams();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to lock paper", "error");
    } finally {
      setLocking(false);
    }
  };

  const approvedCount = questions.filter(q => q.status === "APPROVED").length;
  const isLocked = selectedExam?.workflow_status === "LOCKED";
  const canLock = selectedExam?.workflow_status === "APPROVED" &&
    questions.length === (selectedExam?.total_questions_allowed || 10);

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(26,46,42,0.5)", fontFamily:"'DM Sans',sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow:0 0 0 0 rgba(108,99,255,0.4); } 50% { box-shadow:0 0 0 10px rgba(108,99,255,0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .hash-text { font-family: 'JetBrains Mono', monospace; font-size: 11px; word-break: break-all; color: #6C63FF; }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"14px 24px", borderRadius:12, background: toast.type==="error" ? "#FF6B6B" : "#00C9A7", color:"#fff", fontSize:14, fontWeight:600, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", animation:"toastIn 0.3s ease", fontFamily:"'DM Sans',sans-serif" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a2e2a", maxWidth:900 }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>🔒 Lock Question Paper</div>
          <div style={{ fontSize:13, color:"rgba(26,46,42,0.45)" }}>Lock and store question paper hash on blockchain</div>
        </div>

        {exams.length === 0 ? (
          <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, padding:"60px 20px", textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:6 }}>No approved exams</div>
            <div style={{ fontSize:13, color:"rgba(26,46,42,0.5)" }}>Admin needs to approve your exam first!</div>
          </div>
        ) : (
          <>
            {/* Exam Selector */}
            <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.45)", letterSpacing:"0.08em", marginBottom:12 }}>SELECT EXAM</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {exams.map(exam => (
                  <button key={exam.id} className="act-btn" onClick={() => { setSelectedExam(exam); setLockResult(null); }}
                    style={{ padding:"10px 16px", borderRadius:10, border: selectedExam?.id===exam.id ? "2px solid #6C63FF" : "1px solid rgba(26,46,42,0.12)", background: selectedExam?.id===exam.id ? "rgba(108,99,255,0.08)" : "transparent", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color: selectedExam?.id===exam.id ? "#6C63FF" : "#1a2e2a" }}>
                    {exam.exam_name}
                    <span style={{ marginLeft:8, fontSize:10, padding:"2px 7px", borderRadius:10, background: exam.workflow_status==="LOCKED" ? "rgba(108,99,255,0.12)" : "rgba(0,201,167,0.12)", color: exam.workflow_status==="LOCKED" ? "#6C63FF" : "#00C9A7", fontWeight:700 }}>
                      {exam.workflow_status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {selectedExam && (
              <>
                {/* Summary Cards */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
                  {[
                    { label:"Total Questions", value:questions.length, icon:"❓", color:"#6C63FF" },
                    { label:"Required", value:selectedExam.total_questions_allowed||10, icon:"📋", color:"#00C9A7" },
                    { label:"Approved", value:approvedCount, icon:"✅", color:"#00C9A7" },
                    { label:"Status", value:selectedExam.workflow_status, icon:"📌", color: isLocked ? "#6C63FF" : "#FFD166" },
                  ].map((s,i) => (
                    <div key={i} className="fade-up" style={{ background:"#fff", border:`1px solid ${s.color}22`, borderRadius:14, padding:"18px 20px", animationDelay:`${i*0.06}s` }}>
                      <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:12, color:"rgba(26,46,42,0.45)", marginTop:4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Already Locked */}
                {isLocked && (
                  <div className="fade-up" style={{ background:"rgba(108,99,255,0.06)", border:"1px solid rgba(108,99,255,0.2)", borderRadius:16, padding:24, marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                      <div style={{ fontSize:32, animation:"pulse 2s infinite" }}>🔒</div>
                      <div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:"#6C63FF" }}>Paper Already Locked!</div>
                        <div style={{ fontSize:13, color:"rgba(26,46,42,0.5)" }}>This exam paper is permanently stored on blockchain</div>
                      </div>
                    </div>
                    <div style={{ padding:"14px 16px", background:"rgba(255,255,255,0.7)", borderRadius:10, border:"1px solid rgba(108,99,255,0.15)" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"rgba(26,46,42,0.4)", letterSpacing:"0.08em", marginBottom:6 }}>BLOCKCHAIN TRANSACTION HASH</div>
                      <div className="hash-text">{lockResult?.blockchain_tx_hash || "Stored on blockchain ✅"}</div>
                    </div>
                  </div>
                )}

                {/* Questions Preview */}
                <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, overflow:"hidden", marginBottom:20 }}>
                  <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(0,201,167,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>📋 Question Paper Preview</div>
                    <span style={{ fontSize:12, color:"rgba(26,46,42,0.4)", background:"rgba(26,46,42,0.05)", padding:"4px 12px", borderRadius:20 }}>
                      {questions.length} questions
                    </span>
                  </div>
                  {questions.map((q, i) => (
                    <div key={q.id} className="fade-up" style={{ padding:"16px 20px", borderBottom:"1px solid rgba(0,201,167,0.05)", animationDelay:`${i*0.04}s` }}>
                      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:"rgba(0,201,167,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#00C9A7", flexShrink:0 }}>
                          {i+1}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:600, marginBottom:8 }}>{q.question_text}</div>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            {["a","b","c","d"].map(opt => (
                              <span key={opt} style={{ fontSize:12, padding:"4px 10px", borderRadius:6, background: q.correct_option===opt.toUpperCase() ? "rgba(0,201,167,0.1)" : "rgba(26,46,42,0.04)", color: q.correct_option===opt.toUpperCase() ? "#00C9A7" : "rgba(26,46,42,0.6)", border: q.correct_option===opt.toUpperCase() ? "1px solid rgba(0,201,167,0.25)" : "1px solid transparent", fontWeight: q.correct_option===opt.toUpperCase() ? 700 : 400 }}>
                                {opt.toUpperCase()}. {q[`option_${opt}`]}
                                {q.correct_option===opt.toUpperCase() && " ✓"}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lock Button */}
                {!isLocked && (
                  <div style={{ background:"#fff", border:"1px solid rgba(26,46,42,0.08)", borderRadius:16, padding:24, textAlign:"center" }}>
                    {!canLock ? (
                      <div>
                        <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:6 }}>Cannot Lock Yet</div>
                        <div style={{ fontSize:13, color:"rgba(26,46,42,0.5)" }}>
                          Need {selectedExam.total_questions_allowed||10} questions. Currently have {questions.length}.
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:6 }}>Ready to Lock!</div>
                        <div style={{ fontSize:13, color:"rgba(26,46,42,0.5)", marginBottom:20 }}>
                          This will permanently store the question paper hash on blockchain. This cannot be undone!
                        </div>
                        <button className="act-btn" onClick={() => setShowConfirm(true)} disabled={locking}
                          style={{ padding:"14px 40px", background:"linear-gradient(135deg, #6C63FF, #9b5de5)", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 8px 24px rgba(108,99,255,0.35)", opacity: locking ? 0.7 : 1 }}>
                          {locking ? "⏳ Locking on Blockchain..." : "🔒 Lock Question Paper"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Lock Result */}
                {lockResult && !isLocked && (
                  <div className="fade-up" style={{ background:"rgba(108,99,255,0.06)", border:"1px solid rgba(108,99,255,0.2)", borderRadius:16, padding:24, marginTop:20 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#6C63FF", marginBottom:12 }}>
                      🎉 Successfully Locked on Blockchain!
                    </div>
                    <div style={{ padding:"14px 16px", background:"rgba(255,255,255,0.7)", borderRadius:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"rgba(26,46,42,0.4)", letterSpacing:"0.08em", marginBottom:6 }}>TRANSACTION HASH</div>
                      <div className="hash-text">{lockResult.blockchain_tx_hash}</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,20,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }} onClick={() => setShowConfirm(false)}>
          <div style={{ background:"#fff", borderRadius:20, padding:32, width:"90%", maxWidth:440, boxShadow:"0 24px 64px rgba(0,0,0,0.15)", textAlign:"center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:8 }}>Confirm Lock</div>
            <div style={{ fontSize:14, color:"rgba(26,46,42,0.5)", marginBottom:24, lineHeight:1.6 }}>
              Are you sure? This will permanently store the question paper hash on blockchain. <strong>This cannot be undone!</strong>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding:"12px 24px", borderRadius:10, border:"1px solid rgba(26,46,42,0.15)", background:"transparent", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                Cancel
              </button>
              <button className="act-btn" onClick={handleLock}
                style={{ padding:"12px 28px", background:"linear-gradient(135deg, #6C63FF, #9b5de5)", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 16px rgba(108,99,255,0.3)" }}>
                🔒 Yes, Lock It!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffLockPaper;