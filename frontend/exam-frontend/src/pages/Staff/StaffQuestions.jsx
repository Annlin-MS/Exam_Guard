import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const StaffQuestions = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    question_text:"", option_a:"", option_b:"", option_c:"", option_d:"", correct_option:"A"
  });
  const navigate = useNavigate();

  useEffect(() => { fetchExams(); }, []);
  useEffect(() => { if (selectedExam) fetchQuestions(selectedExam.id); }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await api.get("/api/exams/");
      setExams(res.data);
      if (res.data.length > 0) setSelectedExam(res.data[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchQuestions = async (examId) => {
    setQuestionsLoading(true);
    try {
      const res = await api.get(`/api/exams/${examId}/questions/list/`);
      setQuestions(res.data);
    } catch (err) { setQuestions([]); }
    finally { setQuestionsLoading(false); }
  };

  const showToast = (msg, type="success") => {
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
      setShowAddModal(false);
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
      showToast("Submitted for approval! ✅");
      fetchExams();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to submit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Group questions by status
  const pendingQ  = questions.filter(q => q.status === "PENDING");
  const approvedQ = questions.filter(q => q.status === "APPROVED");
  const rejectedQ = questions.filter(q => q.status === "REJECTED");

  const canAdd    = selectedExam && ["DRAFT","REJECTED"].includes(selectedExam.workflow_status);
  const canSubmit = selectedExam && selectedExam.workflow_status === "DRAFT" && questions.length > 0;

  const QuestionCard = ({ q, index }) => (
    <div style={{ padding:"16px", background:"rgba(26,26,46,0.02)", border:"1px solid rgba(26,26,46,0.07)", borderRadius:12, marginBottom:8 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:"rgba(0,201,167,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#00C9A7", flexShrink:0 }}>
          {index+1}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:10, lineHeight:1.5 }}>{q.question_text}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {["a","b","c","d"].map(opt => (
              <div key={opt} style={{ padding:"6px 10px", borderRadius:8, background: q.correct_option===opt.toUpperCase() ? "rgba(0,201,167,0.08)" : "rgba(26,26,46,0.03)", border: q.correct_option===opt.toUpperCase() ? "1px solid rgba(0,201,167,0.2)" : "1px solid rgba(26,26,46,0.06)", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:18, height:18, borderRadius:4, background: q.correct_option===opt.toUpperCase() ? "#00C9A7" : "rgba(26,26,46,0.08)", color: q.correct_option===opt.toUpperCase() ? "#fff" : "rgba(26,26,46,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, flexShrink:0 }}>
                  {opt.toUpperCase()}
                </span>
                <span style={{ fontSize:11 }}>{q[`option_${opt}`]}</span>
                {q.correct_option===opt.toUpperCase() && <span style={{ marginLeft:"auto", fontSize:9, color:"#00C9A7", fontWeight:700 }}>✓</span>}
              </div>
            ))}
          </div>
          {q.status === "REJECTED" && q.rejection_reason && (
            <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:8, fontSize:12, color:"#FF6B6B" }}>
              💬 Admin Feedback: {q.rejection_reason}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const SectionBlock = ({ icon, title, count, color, children }) => (
    <div style={{ background:"#fff", border:`1px solid ${color}22`, borderRadius:16, padding:20, marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:`${color}08`, border:`1px solid ${color}20`, borderRadius:10, marginBottom:14 }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color }}>{title}</span>
        <span style={{ marginLeft:"auto", fontSize:12, fontWeight:700, padding:"2px 10px", borderRadius:20, background:`${color}15`, color }}>{count}</span>
      </div>
      {children}
    </div>
  );

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(26,46,42,0.5)", fontFamily:"'DM Sans',sans-serif" }}>Loading...</div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
        .exam-tab { transition: all 0.15s; cursor: pointer; }
        .exam-tab:hover { background: rgba(0,201,167,0.06) !important; }
        textarea:focus, input:focus, select:focus { outline: none; border-color: #00C9A7 !important; box-shadow: 0 0 0 3px rgba(0,201,167,0.1); }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"14px 24px", borderRadius:12, background: toast.type==="error" ? "#FF6B6B" : "#00C9A7", color:"#fff", fontSize:14, fontWeight:600, zIndex:9999, animation:"toastIn 0.3s ease", fontFamily:"'DM Sans',sans-serif" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a2e2a", maxWidth:1100 }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>📋 My Questions</div>
          <div style={{ fontSize:13, color:"rgba(26,46,42,0.45)" }}>Manage questions for your assigned exams</div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:20, alignItems:"start" }}>

          {/* LEFT — Exam List */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.45)", letterSpacing:"0.08em", marginBottom:10 }}>MY EXAMS ({exams.length})</div>
            {exams.length === 0 ? (
              <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:14, padding:"40px 16px", textAlign:"center", color:"rgba(26,46,42,0.4)" }}>
                <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
                <div style={{ fontSize:13, fontWeight:600 }}>No exams assigned</div>
              </div>
            ) : (
              exams.map((exam, i) => {
                const SC = {
                  DRAFT:     { color:"#94a3b8", label:"Draft"     },
                  SUBMITTED: { color:"#FFD166", label:"Submitted" },
                  APPROVED:  { color:"#00C9A7", label:"Approved"  },
                  REJECTED:  { color:"#FF6B6B", label:"Rejected"  },
                  LOCKED:    { color:"#6C63FF", label:"Locked"    },
                };
                const sc = SC[exam.workflow_status] || SC.DRAFT;
                const isSelected = selectedExam?.id === exam.id;
                return (
                  <div key={exam.id} className="exam-tab fade-up"
                    onClick={() => setSelectedExam(exam)}
                    style={{ background:"#fff", border: isSelected ? "2px solid #00C9A7" : "1px solid rgba(0,201,167,0.1)", borderRadius:14, padding:14, marginBottom:10, animationDelay:`${i*0.06}s` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:"rgba(0,201,167,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📝</div>
                      <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, color:sc.color, background:`${sc.color}15`, border:`1px solid ${sc.color}30` }}>
                        {sc.label}
                      </span>
                    </div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color: isSelected ? "#00C9A7" : "#1a2e2a", marginBottom:4 }}>
                      {exam.exam_name}
                    </div>
                    <div style={{ fontSize:11, color:"rgba(26,46,42,0.45)" }}>📅 {exam.exam_date}</div>
                    {isSelected && <div style={{ marginTop:8, fontSize:11, color:"#00C9A7", fontWeight:600 }}>→ Viewing</div>}
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT — Questions Panel */}
          <div>
            {!selectedExam ? (
              <div style={{ background:"#fff", border:"1px dashed rgba(0,201,167,0.2)", borderRadius:16, padding:"80px 20px", textAlign:"center", color:"rgba(26,46,42,0.4)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>👈</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>Select an exam</div>
              </div>
            ) : (
              <>
                {/* Exam Header */}
                <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, padding:20, marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                    <div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:4 }}>{selectedExam.exam_name}</div>
                      <div style={{ fontSize:13, color:"rgba(26,46,42,0.5)", display:"flex", gap:12 }}>
                        <span>📅 {selectedExam.exam_date}</span>
                        <span>❓ {questions.length}/{selectedExam.total_questions_allowed} questions</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:10 }}>
                      {canAdd && (
                        <button className="act-btn" onClick={() => setShowAddModal(true)}
                          style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#00C9A7", color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(0,201,167,0.3)" }}>
                          ➕ Add Question
                        </button>
                      )}
                      {canSubmit && (
                        <button className="act-btn" onClick={handleSubmitForApproval} disabled={submitting}
                          style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#6C63FF", color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(108,99,255,0.3)" }}>
                          {submitting ? "Submitting..." : "📤 Submit for Approval"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop:14 }}>
                    <div style={{ height:6, background:"rgba(26,46,42,0.06)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", background:"#00C9A7", borderRadius:3, width:`${Math.min((questions.length/selectedExam.total_questions_allowed)*100, 100)}%`, transition:"width 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize:11, color:"rgba(26,46,42,0.45)", marginTop:4 }}>
                      {questions.length} of {selectedExam.total_questions_allowed} questions added
                    </div>
                  </div>
                </div>

                {questionsLoading ? (
                  <div style={{ background:"#fff", borderRadius:16, padding:40, textAlign:"center", color:"rgba(26,46,42,0.4)" }}>Loading questions...</div>
                ) : questions.length === 0 ? (
                  <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, padding:"50px 20px", textAlign:"center", color:"rgba(26,46,42,0.4)" }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>No questions yet</div>
                    <div style={{ fontSize:13, marginTop:4 }}>Click "Add Question" to start!</div>
                  </div>
                ) : (
                  <>
                    {/* ⏳ PENDING */}
                    {pendingQ.length > 0 && (
                      <SectionBlock icon="⏳" title="Pending Review" count={pendingQ.length} color="#FFD166">
                        {pendingQ.map((q,i) => <QuestionCard key={q.id} q={q} index={i} />)}
                      </SectionBlock>
                    )}

                    {/* ✅ APPROVED */}
                    {approvedQ.length > 0 && (
                      <SectionBlock icon="✅" title="Approved by Admin" count={approvedQ.length} color="#00C9A7">
                        {approvedQ.map((q,i) => <QuestionCard key={q.id} q={q} index={i} />)}
                      </SectionBlock>
                    )}

                    {/* ❌ REJECTED */}
                    {rejectedQ.length > 0 && (
                      <SectionBlock icon="❌" title="Rejected — Needs Fix" count={rejectedQ.length} color="#FF6B6B">
                        {rejectedQ.map((q,i) => <QuestionCard key={q.id} q={q} index={i} />)}
                      </SectionBlock>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ADD QUESTION MODAL */}
      {showAddModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,20,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}
          onClick={() => setShowAddModal(false)}>
          <div style={{ background:"#fff", borderRadius:20, padding:28, width:"90%", maxWidth:560, boxShadow:"0 24px 64px rgba(0,0,0,0.15)", maxHeight:"90vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800 }}>➕ Add Question</div>
              <button onClick={() => setShowAddModal(false)} style={{ background:"rgba(26,26,46,0.06)", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer" }}>✕</button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.6)", letterSpacing:"0.05em" }}>Question *</label>
                <textarea rows={3} placeholder="Enter your question here..." value={form.question_text}
                  onChange={e => setForm({...form, question_text: e.target.value})}
                  style={{ padding:"10px 14px", border:"1px solid rgba(26,26,46,0.15)", borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif", resize:"vertical" }} />
              </div>

              {["a","b","c","d"].map(opt => (
                <div key={opt} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.6)", letterSpacing:"0.05em" }}>Option {opt.toUpperCase()} *</label>
                  <input type="text" placeholder={`Option ${opt.toUpperCase()}`} value={form[`option_${opt}`]}
                    onChange={e => setForm({...form, [`option_${opt}`]: e.target.value})}
                    style={{ padding:"10px 14px", border:"1px solid rgba(26,26,46,0.15)", borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif" }} />
                </div>
              ))}

              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.6)", letterSpacing:"0.05em" }}>Correct Answer *</label>
                <div style={{ display:"flex", gap:8 }}>
                  {["A","B","C","D"].map(opt => (
                    <button key={opt} className="act-btn" onClick={() => setForm({...form, correct_option: opt})}
                      style={{ flex:1, padding:"10px", borderRadius:8, border: form.correct_option===opt ? "2px solid #00C9A7" : "1px solid rgba(26,26,46,0.15)", background: form.correct_option===opt ? "rgba(0,201,167,0.1)" : "transparent", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color: form.correct_option===opt ? "#00C9A7" : "rgba(26,26,46,0.5)" }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:12, justifyContent:"flex-end" }}>
              <button onClick={() => setShowAddModal(false)}
                style={{ padding:"10px 20px", borderRadius:8, border:"1px solid rgba(26,26,46,0.15)", background:"transparent", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                Cancel
              </button>
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
