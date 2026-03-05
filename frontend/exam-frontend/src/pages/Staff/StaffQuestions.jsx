import React, { useState, useEffect } from "react";
import api from "../../services/api";

const StaffQuestions = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    question_text: "", option_a: "", option_b: "",
    option_c: "", option_d: "", correct_option: "A"
  });

  useEffect(() => { fetchExams(); }, []);

  useEffect(() => {
    if (selectedExam) fetchQuestions(selectedExam.id);
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await api.get("/api/exams/");
      setExams(res.data);
      if (res.data.length > 0) setSelectedExam(res.data[0]);
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

  const handleAddQuestion = async () => {
    if (!form.question_text || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
      showToast("Please fill all fields!", "error"); return;
    }
    try {
      await api.post(`/api/exams/${selectedExam.id}/add-question/`, form);
      showToast("Question added! ✅");
      setShowForm(false);
      setForm({ question_text:"", option_a:"", option_b:"", option_c:"", option_d:"", correct_option:"A" });
      fetchQuestions(selectedExam.id);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to add question", "error");
    }
  };

  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    try {
      await api.post(`/api/exams/${selectedExam.id}/submit-for-approval/`);
      showToast("Submitted for admin approval! ✅");
      fetchExams();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to submit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_CONFIG = {
    PENDING:  { color:"#FFD166", bg:"rgba(255,209,102,0.1)", label:"Pending" },
    APPROVED: { color:"#00C9A7", bg:"rgba(0,201,167,0.1)",  label:"Approved" },
    REJECTED: { color:"#FF6B6B", bg:"rgba(255,107,107,0.1)", label:"Rejected" },
  };

  const canSubmit = selectedExam?.workflow_status === "DRAFT" && questions.length > 0;
  const isLocked = selectedExam?.workflow_status === "LOCKED";

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
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #00C9A7 !important; box-shadow: 0 0 0 3px rgba(0,201,167,0.1); }
        .q-row:hover { background: rgba(0,201,167,0.03) !important; }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"14px 24px", borderRadius:12, background: toast.type==="error" ? "#FF6B6B" : "#00C9A7", color:"#fff", fontSize:14, fontWeight:600, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", animation:"toastIn 0.3s ease", fontFamily:"'DM Sans',sans-serif" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a2e2a", maxWidth:1000 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>❓ Question Management</div>
            <div style={{ fontSize:13, color:"rgba(26,46,42,0.45)" }}>Create and manage MCQ questions</div>
          </div>
        </div>

        {/* Exam Selector */}
        <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, padding:20, marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.45)", letterSpacing:"0.08em", marginBottom:12 }}>SELECT EXAM</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {exams.map(exam => {
              const statusColors = { DRAFT:"#94a3b8", SUBMITTED:"#FFD166", APPROVED:"#00C9A7", LOCKED:"#6C63FF" };
              const color = statusColors[exam.workflow_status] || "#94a3b8";
              return (
                <button key={exam.id} className="act-btn" onClick={() => setSelectedExam(exam)}
                  style={{ padding:"10px 16px", borderRadius:10, border: selectedExam?.id===exam.id ? `2px solid #00C9A7` : "1px solid rgba(26,46,42,0.12)", background: selectedExam?.id===exam.id ? "rgba(0,201,167,0.08)" : "transparent", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color: selectedExam?.id===exam.id ? "#00C9A7" : "#1a2e2a" }}>
                  {exam.exam_name}
                  <span style={{ marginLeft:8, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10, color, background:`${color}15` }}>
                    {exam.workflow_status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedExam && (
          <>
            {/* Exam Info + Actions */}
            <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, padding:20, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, marginBottom:6 }}>{selectedExam.exam_name}</div>
                  <div style={{ display:"flex", gap:16, fontSize:13, color:"rgba(26,46,42,0.5)" }}>
                    <span>📅 {selectedExam.exam_date}</span>
                    <span>⏰ {selectedExam.start_time}</span>
                    <span>❓ {questions.length} / {selectedExam.total_questions_allowed || "?"} questions</span>
                  </div>
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  {/* Progress Bar */}
                  <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", minWidth:120 }}>
                    <div style={{ fontSize:11, color:"rgba(26,46,42,0.45)", marginBottom:4 }}>
                      Progress: {questions.length}/{selectedExam.total_questions_allowed || 10}
                    </div>
                    <div style={{ height:6, background:"rgba(26,46,42,0.08)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", background:"#00C9A7", borderRadius:3, width:`${Math.min((questions.length / (selectedExam.total_questions_allowed || 10)) * 100, 100)}%`, transition:"width 0.3s" }} />
                    </div>
                  </div>

                  {!isLocked && (
                    <button className="act-btn" onClick={() => setShowForm(true)}
                      style={{ padding:"10px 20px", background:"#00C9A7", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(0,201,167,0.3)" }}>
                      ➕ Add Question
                    </button>
                  )}

                  {canSubmit && (
                    <button className="act-btn" onClick={handleSubmitForApproval} disabled={submitting}
                      style={{ padding:"10px 20px", background:"#FFD166", color:"#1a2e2a", border:"none", borderRadius:10, fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(255,209,102,0.3)", opacity: submitting ? 0.7 : 1 }}>
                      {submitting ? "Submitting..." : "📤 Submit for Approval"}
                    </button>
                  )}

                  {selectedExam.workflow_status === "SUBMITTED" && (
                    <div style={{ padding:"10px 16px", background:"rgba(255,209,102,0.1)", border:"1px solid rgba(255,209,102,0.3)", borderRadius:10, fontSize:13, fontWeight:600, color:"#FFD166" }}>
                      ⏳ Waiting for admin approval...
                    </div>
                  )}

                  {selectedExam.workflow_status === "APPROVED" && (
                    <div style={{ padding:"10px 16px", background:"rgba(0,201,167,0.1)", border:"1px solid rgba(0,201,167,0.3)", borderRadius:10, fontSize:13, fontWeight:600, color:"#00C9A7" }}>
                      ✅ Approved! Ready to lock.
                    </div>
                  )}

                  {isLocked && (
                    <div style={{ padding:"10px 16px", background:"rgba(108,99,255,0.1)", border:"1px solid rgba(108,99,255,0.3)", borderRadius:10, fontSize:13, fontWeight:600, color:"#6C63FF" }}>
                      🔒 Paper Locked on Blockchain
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(0,201,167,0.06)" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>
                  Questions ({questions.length})
                </div>
              </div>

              {questions.length === 0 ? (
                <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(26,46,42,0.4)" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                  <div style={{ fontSize:15, fontWeight:600 }}>No questions yet</div>
                  <div style={{ fontSize:13, marginTop:4 }}>Click "Add Question" to get started!</div>
                </div>
              ) : (
                questions.map((q, i) => {
                  const sc = STATUS_CONFIG[q.status] || STATUS_CONFIG.PENDING;
                  return (
                    <div key={q.id} className="q-row fade-up" style={{ padding:"16px 20px", borderBottom:"1px solid rgba(0,201,167,0.05)", transition:"all 0.15s", animationDelay:`${i*0.04}s` }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:"rgba(0,201,167,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#00C9A7", flexShrink:0, marginTop:2 }}>
                          {i+1}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:600, color:"#1a2e2a", marginBottom:10, lineHeight:1.5 }}>
                            {q.question_text}
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                            {["a","b","c","d"].map(opt => (
                              <div key={opt} style={{ padding:"7px 12px", borderRadius:8, background: q.correct_option===opt.toUpperCase() ? "rgba(0,201,167,0.08)" : "rgba(26,46,42,0.03)", border: q.correct_option===opt.toUpperCase() ? "1px solid rgba(0,201,167,0.25)" : "1px solid rgba(26,46,42,0.07)", display:"flex", alignItems:"center", gap:8 }}>
                                <span style={{ width:20, height:20, borderRadius:5, background: q.correct_option===opt.toUpperCase() ? "#00C9A7" : "rgba(26,46,42,0.08)", color: q.correct_option===opt.toUpperCase() ? "#fff" : "rgba(26,46,42,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, flexShrink:0 }}>
                                  {opt.toUpperCase()}
                                </span>
                                <span style={{ fontSize:12, color:"#1a2e2a" }}>{q[`option_${opt}`]}</span>
                                {q.correct_option===opt.toUpperCase() && <span style={{ marginLeft:"auto", fontSize:10, color:"#00C9A7", fontWeight:700 }}>✓</span>}
                              </div>
                            ))}
                          </div>
                          {q.status === "REJECTED" && q.rejection_reason && (
                            <div style={{ padding:"8px 12px", background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:8, fontSize:12, color:"#FF6B6B" }}>
                              ❌ Rejected: {q.rejection_reason}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, color:sc.color, background:sc.bg, border:`1px solid ${sc.color}33`, flexShrink:0 }}>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* ADD QUESTION MODAL */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,20,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }} onClick={() => setShowForm(false)}>
          <div style={{ background:"#fff", borderRadius:20, padding:28, width:"90%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800 }}>➕ Add Question</div>
              <button onClick={() => setShowForm(false)} style={{ background:"rgba(26,46,42,0.06)", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:14 }}>✕</button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.5)", letterSpacing:"0.05em" }}>QUESTION TEXT *</label>
                <textarea rows={3} placeholder="Enter your question here..." value={form.question_text} onChange={e => setForm({...form, question_text: e.target.value})}
                  style={{ padding:"10px 14px", border:"1px solid rgba(26,46,42,0.15)", borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif", resize:"vertical", transition:"all 0.15s" }} />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {["a","b","c","d"].map(opt => (
                  <div key={opt} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.5)", letterSpacing:"0.05em" }}>OPTION {opt.toUpperCase()} *</label>
                    <input placeholder={`Option ${opt.toUpperCase()}`} value={form[`option_${opt}`]} onChange={e => setForm({...form, [`option_${opt}`]: e.target.value})}
                      style={{ padding:"10px 14px", border:"1px solid rgba(26,46,42,0.15)", borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }} />
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.5)", letterSpacing:"0.05em" }}>CORRECT ANSWER *</label>
                <div style={{ display:"flex", gap:10 }}>
                  {["A","B","C","D"].map(opt => (
                    <button key={opt} className="act-btn" onClick={() => setForm({...form, correct_option: opt})}
                      style={{ flex:1, padding:"10px", borderRadius:8, border: form.correct_option===opt ? "2px solid #00C9A7" : "1px solid rgba(26,46,42,0.15)", background: form.correct_option===opt ? "rgba(0,201,167,0.1)" : "transparent", color: form.correct_option===opt ? "#00C9A7" : "#1a2e2a", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:12, justifyContent:"flex-end", marginTop:24 }}>
              <button onClick={() => setShowForm(false)} style={{ padding:"10px 20px", borderRadius:8, border:"1px solid rgba(26,46,42,0.15)", background:"transparent", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
              <button className="act-btn" onClick={handleAddQuestion}
                style={{ padding:"10px 24px", borderRadius:8, background:"#00C9A7", color:"#fff", border:"none", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(0,201,167,0.3)" }}>
                ➕ Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffQuestions;