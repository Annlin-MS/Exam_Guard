import React, { useState, useEffect } from "react";
import api from "../../services/api";

const AdminApprovals = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approving, setApproving] = useState(null);

  useEffect(() => { fetchExams(); }, []);
  useEffect(() => { if (selectedExam) fetchQuestions(selectedExam.id); }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await api.get("/api/exams/");
      const reviewable = res.data.filter(e =>
        ["SUBMITTED","APPROVED","REJECTED"].includes(e.workflow_status)
      );
      setExams(reviewable);
    } catch (err) {
      showToast("Failed to load exams", "error");
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
      showToast("Failed to load questions", "error");
    } finally {
      setQuestionsLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApproveQuestion = async (questionId) => {
    setApproving(questionId);
    try {
      await api.post(`/api/admin/questions/${questionId}/approve/`);
      showToast("Question approved! ✅");
      fetchQuestions(selectedExam.id);
    } catch (err) {
      showToast("Failed to approve", "error");
    } finally {
      setApproving(null);
    }
  };

  const handleRejectQuestion = async () => {
    if (!rejectReason.trim()) {
      showToast("Please enter rejection reason!", "error"); return;
    }
    try {
      await api.post(`/api/admin/questions/${rejectModal}/reject/`, {
        reason: rejectReason
      });
      showToast("Question rejected!");
      setRejectModal(null);
      setRejectReason("");
      fetchQuestions(selectedExam.id);
    } catch (err) {
      showToast("Failed to reject", "error");
    }
  };

  const handleApproveAllPending = async () => {
    const pending = questions.filter(q => q.status === "PENDING");
    for (const q of pending) {
      await api.post(`/api/admin/questions/${q.id}/approve/`);
    }
    showToast(`${pending.length} questions approved! ✅`);
    fetchQuestions(selectedExam.id);
  };

  const handleApproveExam = async () => {
    try {
      await api.post(`/api/exams/${selectedExam.id}/approve/`);
      showToast("Exam approved! ✅");
      fetchExams();
      setSelectedExam({...selectedExam, workflow_status:"APPROVED"});
    } catch (err) {
      showToast(err.response?.data?.error || "Failed!", "error");
    }
  };

  const handleRejectExam = async () => {
    try {
      await api.post(`/api/exams/${selectedExam.id}/reject/`);
      showToast("Exam rejected!");
      fetchExams();
      setSelectedExam({...selectedExam, workflow_status:"REJECTED"});
    } catch (err) {
      showToast(err.response?.data?.error || "Failed!", "error");
    }
  };

  const pendingQ  = questions.filter(q => q.status === "PENDING");
  const approvedQ = questions.filter(q => q.status === "APPROVED");
  const rejectedQ = questions.filter(q => q.status === "REJECTED");

  const allReviewed = questions.length > 0 && pendingQ.length === 0;

  const DEPT_LABELS = {
    CS:"CS", ECE:"ECE", MECH:"Mech",
    CIVIL:"Civil", MBA:"MBA", ALL:"All Depts"
  };

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(26,26,46,0.5)", fontFamily:"'DM Sans',sans-serif" }}>
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
        .exam-card { transition: all 0.2s; cursor: pointer; }
        .exam-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(108,99,255,0.1) !important; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .q-row { transition: background 0.15s; }
        .q-row:hover { background: rgba(108,99,255,0.02) !important; }
        textarea:focus { outline:none; border-color:#6C63FF !important; box-shadow:0 0 0 3px rgba(108,99,255,0.1); }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"14px 24px", borderRadius:12, background: toast.type==="error" ? "#FF6B6B" : "#00C9A7", color:"#fff", fontSize:14, fontWeight:600, zIndex:9999, animation:"toastIn 0.3s ease", fontFamily:"'DM Sans',sans-serif" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a1a2e" }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>✅ Approvals</div>
          <div style={{ fontSize:13, color:"rgba(26,26,46,0.45)" }}>
            Review each question individually then approve or reject the exam
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:20, alignItems:"start" }}>

          {/* LEFT — Exam List */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(26,26,46,0.45)", letterSpacing:"0.08em", marginBottom:10 }}>
              SUBMITTED EXAMS ({exams.length})
            </div>

            {exams.length === 0 ? (
              <div style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:14, padding:"40px 16px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
                <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
                <div style={{ fontSize:13, fontWeight:600 }}>No exams to review</div>
                <div style={{ fontSize:12, marginTop:4 }}>Staff needs to submit exams first!</div>
              </div>
            ) : (
              exams.map((exam, i) => {
                const SC = {
                  SUBMITTED: { color:"#FFD166", label:"Submitted" },
                  APPROVED:  { color:"#00C9A7", label:"Approved"  },
                  REJECTED:  { color:"#FF6B6B", label:"Rejected"  },
                };
                const sc = SC[exam.workflow_status] || SC.SUBMITTED;
                const isSelected = selectedExam?.id === exam.id;
                return (
                  <div key={exam.id} className="exam-card fade-up"
                    onClick={() => setSelectedExam(exam)}
                    style={{ background:"#fff", border: isSelected ? "2px solid #6C63FF" : "1px solid rgba(26,26,46,0.08)", borderRadius:14, padding:16, marginBottom:10, animationDelay:`${i*0.06}s` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:"rgba(108,99,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>📝</div>
                      <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, color:sc.color, background:`${sc.color}15`, border:`1px solid ${sc.color}30` }}>
                        {sc.label}
                      </span>
                    </div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color: isSelected ? "#6C63FF" : "#1a1a2e", marginBottom:6 }}>
                      {exam.exam_name}
                    </div>
                    <div style={{ fontSize:11, color:"rgba(26,26,46,0.45)", display:"flex", flexDirection:"column", gap:2 }}>
                      <span>📅 {exam.exam_date}</span>
                      <span>👨‍🏫 {exam.assigned_staff || "—"}</span>
                      <span>🏛️ {DEPT_LABELS[exam.department] || exam.department} {exam.semester ? `· Sem ${exam.semester}` : ""}</span>
                    </div>
                    {isSelected && <div style={{ marginTop:8, fontSize:11, color:"#6C63FF", fontWeight:600 }}>→ Currently viewing</div>}
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT — Questions Panel */}
          <div>
            {!selectedExam ? (
              <div style={{ background:"#fff", border:"1px dashed rgba(26,26,46,0.15)", borderRadius:16, padding:"80px 20px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>👈</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>Select an exam</div>
                <div style={{ fontSize:13, marginTop:4 }}>Click on an exam to review its questions</div>
              </div>
            ) : (
              <>
                {/* Exam Header */}
                <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:20, marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16 }}>
                    <div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:6 }}>
                        {selectedExam.exam_name}
                      </div>
                      <div style={{ display:"flex", gap:10, fontSize:13, color:"rgba(26,26,46,0.5)", flexWrap:"wrap" }}>
                        <span>📅 {selectedExam.exam_date}</span>
                        <span>⏰ {selectedExam.start_time}</span>
                        <span>👨‍🏫 {selectedExam.assigned_staff || "—"}</span>
                        <span>🏛️ {DEPT_LABELS[selectedExam.department]} {selectedExam.semester ? `Sem ${selectedExam.semester}` : ""}</span>
                        <span>👨‍🎓 {selectedExam.enrolled_count || 0} enrolled</span>
                      </div>
                    </div>

                    {/* Exam Level Actions */}
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {/* Approve all pending */}
                      {pendingQ.length > 0 && (
                        <button className="act-btn" onClick={handleApproveAllPending}
                          style={{ padding:"8px 16px", borderRadius:10, border:"1px solid rgba(0,201,167,0.3)", background:"rgba(0,201,167,0.08)", color:"#00C9A7", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                          ✅ Approve All Pending ({pendingQ.length})
                        </button>
                      )}

                      {/* Approve/Reject Exam — only after all questions reviewed */}
                      {selectedExam.workflow_status === "SUBMITTED" && (
                        <>
                          {!allReviewed && (
                            <div style={{ padding:"8px 14px", borderRadius:10, background:"rgba(255,209,102,0.1)", border:"1px solid rgba(255,209,102,0.25)", color:"#FFD166", fontSize:12, fontWeight:600 }}>
                              ⏳ Review all {pendingQ.length} pending question(s) first
                            </div>
                          )}
                          {allReviewed && (
                            <>
                              <button className="act-btn" onClick={handleRejectExam}
                                style={{ padding:"9px 18px", borderRadius:10, border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.08)", color:"#FF6B6B", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                                ❌ Reject Exam
                              </button>
                              <button className="act-btn" onClick={handleApproveExam}
                                style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#00C9A7", color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(0,201,167,0.3)" }}>
                                ✅ Approve Exam
                              </button>
                            </>
                          )}
                        </>
                      )}

                      {selectedExam.workflow_status === "APPROVED" && (
                        <div style={{ padding:"9px 18px", borderRadius:10, background:"rgba(0,201,167,0.1)", border:"1px solid rgba(0,201,167,0.25)", color:"#00C9A7", fontSize:13, fontWeight:700 }}>
                          ✅ Exam Approved
                        </div>
                      )}
                      {selectedExam.workflow_status === "REJECTED" && (
                        <div style={{ padding:"9px 18px", borderRadius:10, background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.25)", color:"#FF6B6B", fontSize:13, fontWeight:700 }}>
                          ❌ Exam Rejected
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question Stats */}
                  {questions.length > 0 && (
                    <div style={{ display:"flex", gap:10 }}>
                      {[
                        { label:"Total",    value:questions.length, color:"#6C63FF" },
                        { label:"Pending",  value:pendingQ.length,  color:"#FFD166" },
                        { label:"Approved", value:approvedQ.length, color:"#00C9A7" },
                        { label:"Rejected", value:rejectedQ.length, color:"#FF6B6B" },
                      ].map((s,i) => (
                        <div key={i} style={{ padding:"8px 16px", borderRadius:10, background:`${s.color}10`, border:`1px solid ${s.color}22`, textAlign:"center" }}>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
                          <div style={{ fontSize:10, color:"rgba(26,26,46,0.45)", marginTop:2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Questions */}
                {questionsLoading ? (
                  <div style={{ background:"#fff", borderRadius:16, padding:40, textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
                    Loading questions...
                  </div>
                ) : questions.length === 0 ? (
                  <div style={{ background:"#fff", borderRadius:16, padding:"50px 20px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>No questions added yet</div>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                    {/* ⏳ PENDING — with approve/reject buttons */}
                    {pendingQ.length > 0 && (
                      <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(255,209,102,0.2)", borderRadius:16, overflow:"hidden" }}>
                        <div style={{ padding:"14px 20px", background:"rgba(255,209,102,0.06)", borderBottom:"1px solid rgba(255,209,102,0.15)", display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:16 }}>⏳</span>
                          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"#FFD166" }}>Pending Review</span>
                          <span style={{ marginLeft:"auto", fontSize:12, fontWeight:700, padding:"2px 10px", borderRadius:20, background:"rgba(255,209,102,0.15)", color:"#FFD166" }}>{pendingQ.length}</span>
                        </div>
                        {pendingQ.map((q, i) => (
                          <div key={q.id} className="q-row" style={{ padding:"18px 20px", borderBottom:"1px solid rgba(26,26,46,0.04)" }}>
                            <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                              {/* Number */}
                              <div style={{ width:30, height:30, borderRadius:8, background:"rgba(255,209,102,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#FFD166", flexShrink:0, marginTop:2 }}>
                                {i+1}
                              </div>
                              {/* Content */}
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:14, fontWeight:600, color:"#1a1a2e", marginBottom:12, lineHeight:1.5 }}>
                                  {q.question_text}
                                </div>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                                  {["a","b","c","d"].map(opt => (
                                    <div key={opt} style={{ padding:"7px 12px", borderRadius:8, background: q.correct_option===opt.toUpperCase() ? "rgba(0,201,167,0.08)" : "rgba(26,26,46,0.03)", border: q.correct_option===opt.toUpperCase() ? "1px solid rgba(0,201,167,0.25)" : "1px solid rgba(26,26,46,0.07)", display:"flex", alignItems:"center", gap:8 }}>
                                      <span style={{ width:20, height:20, borderRadius:5, background: q.correct_option===opt.toUpperCase() ? "#00C9A7" : "rgba(26,26,46,0.08)", color: q.correct_option===opt.toUpperCase() ? "#fff" : "rgba(26,26,46,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, flexShrink:0 }}>
                                        {opt.toUpperCase()}
                                      </span>
                                      <span style={{ fontSize:12, color:"#1a1a2e" }}>{q[`option_${opt}`]}</span>
                                      {q.correct_option===opt.toUpperCase() && (
                                        <span style={{ marginLeft:"auto", fontSize:10, color:"#00C9A7", fontWeight:700 }}>✓ Correct</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {/* Action Buttons */}
                              <div style={{ display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>
                                <button className="act-btn"
                                  onClick={() => handleApproveQuestion(q.id)}
                                  disabled={approving === q.id}
                                  style={{ padding:"7px 16px", borderRadius:8, border:"none", background:"#00C9A7", color:"#fff", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 2px 8px rgba(0,201,167,0.3)", opacity: approving===q.id ? 0.6 : 1 }}>
                                  {approving === q.id ? "..." : "✅ Approve"}
                                </button>
                                <button className="act-btn"
                                  onClick={() => { setRejectModal(q.id); setRejectReason(""); }}
                                  style={{ padding:"7px 16px", borderRadius:8, border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.08)", color:"#FF6B6B", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                                  ❌ Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ✅ APPROVED */}
                    {approvedQ.length > 0 && (
                      <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.15)", borderRadius:16, overflow:"hidden", animationDelay:"0.05s" }}>
                        <div style={{ padding:"14px 20px", background:"rgba(0,201,167,0.04)", borderBottom:"1px solid rgba(0,201,167,0.1)", display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:16 }}>✅</span>
                          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"#00C9A7" }}>Approved Questions</span>
                          <span style={{ marginLeft:"auto", fontSize:12, fontWeight:700, padding:"2px 10px", borderRadius:20, background:"rgba(0,201,167,0.12)", color:"#00C9A7" }}>{approvedQ.length}</span>
                        </div>
                        {approvedQ.map((q, i) => (
                          <div key={q.id} style={{ padding:"16px 20px", borderBottom:"1px solid rgba(0,201,167,0.06)" }}>
                            <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                              <div style={{ width:30, height:30, borderRadius:8, background:"rgba(0,201,167,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#00C9A7", flexShrink:0, marginTop:2 }}>
                                {i+1}
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:14, fontWeight:600, color:"#1a1a2e", marginBottom:10, lineHeight:1.5 }}>{q.question_text}</div>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                                  {["a","b","c","d"].map(opt => (
                                    <div key={opt} style={{ padding:"6px 10px", borderRadius:8, background: q.correct_option===opt.toUpperCase() ? "rgba(0,201,167,0.08)" : "rgba(26,26,46,0.03)", border: q.correct_option===opt.toUpperCase() ? "1px solid rgba(0,201,167,0.2)" : "1px solid rgba(26,26,46,0.06)", display:"flex", alignItems:"center", gap:6 }}>
                                      <span style={{ width:18, height:18, borderRadius:4, background: q.correct_option===opt.toUpperCase() ? "#00C9A7" : "rgba(26,26,46,0.08)", color: q.correct_option===opt.toUpperCase() ? "#fff" : "rgba(26,26,46,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, flexShrink:0 }}>
                                        {opt.toUpperCase()}
                                      </span>
                                      <span style={{ fontSize:11 }}>{q[`option_${opt}`]}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, background:"rgba(0,201,167,0.1)", color:"#00C9A7", flexShrink:0 }}>✅ Approved</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ❌ REJECTED */}
                    {rejectedQ.length > 0 && (
                      <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(255,107,107,0.15)", borderRadius:16, overflow:"hidden", animationDelay:"0.1s" }}>
                        <div style={{ padding:"14px 20px", background:"rgba(255,107,107,0.04)", borderBottom:"1px solid rgba(255,107,107,0.1)", display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:16 }}>❌</span>
                          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"#FF6B6B" }}>Rejected Questions</span>
                          <span style={{ marginLeft:"auto", fontSize:12, fontWeight:700, padding:"2px 10px", borderRadius:20, background:"rgba(255,107,107,0.12)", color:"#FF6B6B" }}>{rejectedQ.length}</span>
                        </div>
                        {rejectedQ.map((q, i) => (
                          <div key={q.id} style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,107,107,0.06)" }}>
                            <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                              <div style={{ width:30, height:30, borderRadius:8, background:"rgba(255,107,107,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#FF6B6B", flexShrink:0, marginTop:2 }}>
                                {i+1}
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:14, fontWeight:600, color:"#1a1a2e", marginBottom:10, lineHeight:1.5 }}>{q.question_text}</div>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                                  {["a","b","c","d"].map(opt => (
                                    <div key={opt} style={{ padding:"6px 10px", borderRadius:8, background: q.correct_option===opt.toUpperCase() ? "rgba(0,201,167,0.08)" : "rgba(26,26,46,0.03)", border: q.correct_option===opt.toUpperCase() ? "1px solid rgba(0,201,167,0.2)" : "1px solid rgba(26,26,46,0.06)", display:"flex", alignItems:"center", gap:6 }}>
                                      <span style={{ width:18, height:18, borderRadius:4, background: q.correct_option===opt.toUpperCase() ? "#00C9A7" : "rgba(26,26,46,0.08)", color: q.correct_option===opt.toUpperCase() ? "#fff" : "rgba(26,26,46,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, flexShrink:0 }}>
                                        {opt.toUpperCase()}
                                      </span>
                                      <span style={{ fontSize:11 }}>{q[`option_${opt}`]}</span>
                                    </div>
                                  ))}
                                </div>
                                {q.rejection_reason && (
                                  <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:8, fontSize:12, color:"#FF6B6B" }}>
                                    💬 Reason: {q.rejection_reason}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, background:"rgba(255,107,107,0.1)", color:"#FF6B6B", flexShrink:0 }}>❌ Rejected</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* REJECT QUESTION MODAL */}
      {rejectModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,20,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}
          onClick={() => setRejectModal(null)}>
          <div style={{ background:"#fff", borderRadius:20, padding:28, width:"90%", maxWidth:460, boxShadow:"0 24px 64px rgba(0,0,0,0.15)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:6 }}>❌ Reject Question</div>
            <div style={{ fontSize:13, color:"rgba(26,26,46,0.5)", marginBottom:20 }}>
              Give a reason so staff knows what to fix
            </div>
            <textarea rows={4} placeholder="e.g. Question is unclear, wrong correct answer marked..."
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              style={{ width:"100%", padding:"12px 14px", border:"1px solid rgba(26,26,46,0.15)", borderRadius:10, fontSize:14, fontFamily:"'DM Sans',sans-serif", resize:"vertical", marginBottom:20, boxSizing:"border-box" }} />
            <div style={{ display:"flex", gap:12, justifyContent:"flex-end" }}>
              <button onClick={() => setRejectModal(null)}
                style={{ padding:"10px 20px", borderRadius:8, border:"1px solid rgba(26,26,46,0.15)", background:"transparent", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                Cancel
              </button>
              <button className="act-btn" onClick={handleRejectQuestion}
                style={{ padding:"10px 24px", borderRadius:8, background:"#FF6B6B", color:"#fff", border:"none", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>
                ❌ Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminApprovals;
