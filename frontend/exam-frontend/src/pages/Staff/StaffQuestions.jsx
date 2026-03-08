import React, { useState, useEffect } from "react";
import api from "../../services/api";

const StaffQuestions = () => {
  const [exams, setExams]                       = useState([]);
  const [selectedExam, setSelectedExam]         = useState(null);
  const [questions, setQuestions]               = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showAddModal, setShowAddModal]         = useState(false);
  const [submitting, setSubmitting]             = useState(false);
  const [deleting, setDeleting]                 = useState(null);
  const [toast, setToast]                       = useState(null);
  const [replacingId, setReplacingId]           = useState(null);
  const [replaceSaving, setReplaceSaving]       = useState(false);
  const [replaceForm, setReplaceForm]           = useState({
    question_text:"", option_a:"", option_b:"",
    option_c:"", option_d:"", correct_option:"A"
  });
  const [form, setForm] = useState({
    question_text:"", option_a:"", option_b:"",
    option_c:"", option_d:"", correct_option:"A"
  });

  const emptyForm = { question_text:"", option_a:"", option_b:"", option_c:"", option_d:"", correct_option:"A" };

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
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddQuestion = async () => {
    if (!form.question_text||!form.option_a||!form.option_b||!form.option_c||!form.option_d) {
      showToast("Please fill all fields!", "error"); return;
    }
    try {
      await api.post(`/api/exams/${selectedExam.id}/add-question/`, form);
      showToast("Question added! ✅");
      setShowAddModal(false);
      setForm(emptyForm);
      fetchQuestions(selectedExam.id);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to add", "error");
    }
  };

  // ✅ Set replacingId BEFORE fetchQuestions so form appears immediately
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this question?")) return;
    setDeleting(questionId);
    setReplacingId(questionId);   // ← set BEFORE delete
    setReplaceForm(emptyForm);
    try {
      await api.delete(`/api/exams/questions/${questionId}/delete/`);
      showToast("Deleted! Write your replacement below ✅");
      fetchQuestions(selectedExam.id);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to delete", "error");
      setReplacingId(null); // reset if delete failed
    } finally {
      setDeleting(null);
    }
  };

  const handleSaveReplacement = async () => {
    if (!replaceForm.question_text||!replaceForm.option_a||!replaceForm.option_b||!replaceForm.option_c||!replaceForm.option_d) {
      showToast("Please fill all fields!", "error"); return;
    }
    setReplaceSaving(true);
    try {
      await api.post(`/api/exams/${selectedExam.id}/add-question/`, replaceForm);
      showToast("Replacement saved! ✅ Now resubmit for approval.");
      setReplacingId(null);
      setReplaceForm(emptyForm);
      fetchQuestions(selectedExam.id);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save replacement", "error");
    } finally {
      setReplaceSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/api/exams/${selectedExam.id}/submit-for-approval/`);
      showToast("Submitted for approval! ✅");
      const res = await api.get("/api/exams/");
      setExams(res.data);
      const updated = res.data.find(e => e.id === selectedExam.id);
      if (updated) setSelectedExam(updated);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to submit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived counts ──
  const pendingQ     = questions.filter(q => q.status === "PENDING");
  const approvedQ    = questions.filter(q => q.status === "APPROVED");
  const rejectedQ    = questions.filter(q => q.status === "REJECTED");
  const activeCount  = questions.filter(q => q.status !== "REJECTED").length;
  const totalAllowed = selectedExam?.total_questions_allowed || 0;
  const remainingSlots = totalAllowed - activeCount;

  const canAdd = selectedExam &&
    ["DRAFT","REJECTED"].includes(selectedExam.workflow_status) &&
    activeCount < totalAllowed;

  const canSubmit = selectedExam &&
    ["DRAFT","REJECTED"].includes(selectedExam.workflow_status) &&
    activeCount === totalAllowed &&
    rejectedQ.length === 0 &&
    replacingId === null;

  const STATUS_CONFIG = {
    DRAFT:     { color:"#94a3b8", label:"Draft"     },
    SUBMITTED: { color:"#FFD166", label:"Submitted" },
    APPROVED:  { color:"#00C9A7", label:"Approved"  },
    REJECTED:  { color:"#FF6B6B", label:"Rejected"  },
    LOCKED:    { color:"#6C63FF", label:"Locked"    },
  };

  // ── Shared Form Fields ──
  const FormFields = ({ data, onChange }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        <label style={{ fontSize:11, fontWeight:700, color:"rgba(26,26,46,0.5)", letterSpacing:"0.05em" }}>QUESTION *</label>
        <textarea rows={3} placeholder="Enter your question here..."
          value={data.question_text}
          onChange={e => onChange({...data, question_text: e.target.value})}
          style={{ padding:"10px 14px", border:"1px solid rgba(26,26,46,0.15)", borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif", resize:"vertical", background:"#fff" }} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {["a","b","c","d"].map(opt => (
          <div key={opt} style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={{ fontSize:11, fontWeight:700, color:"rgba(26,26,46,0.5)", letterSpacing:"0.05em" }}>OPTION {opt.toUpperCase()} *</label>
            <input type="text" placeholder={`Option ${opt.toUpperCase()}`}
              value={data[`option_${opt}`]}
              onChange={e => onChange({...data, [`option_${opt}`]: e.target.value})}
              style={{ padding:"9px 12px", border:"1px solid rgba(26,26,46,0.15)", borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", background:"#fff" }} />
          </div>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        <label style={{ fontSize:11, fontWeight:700, color:"rgba(26,26,46,0.5)", letterSpacing:"0.05em" }}>CORRECT ANSWER *</label>
        <div style={{ display:"flex", gap:8 }}>
          {["A","B","C","D"].map(opt => (
            <button key={opt}
              onClick={() => onChange({...data, correct_option: opt})}
              style={{ flex:1, padding:"10px", borderRadius:8, border: data.correct_option===opt ? "2px solid #00C9A7" : "1px solid rgba(26,26,46,0.15)", background: data.correct_option===opt ? "rgba(0,201,167,0.1)" : "#fff", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color: data.correct_option===opt ? "#00C9A7" : "rgba(26,26,46,0.4)", cursor:"pointer", transition:"all 0.15s" }}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Question Card ──
  const QuestionCard = ({ q, index, showDelete = false }) => (
    <div style={{ padding:"16px", background: q.status==="REJECTED" ? "rgba(255,107,107,0.02)" : "rgba(26,26,46,0.02)", border:`1px solid ${q.status==="REJECTED" ? "rgba(255,107,107,0.2)" : "rgba(26,26,46,0.07)"}`, borderRadius:12, marginBottom:8 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
        <div style={{ width:28, height:28, borderRadius:8, background: q.status==="REJECTED" ? "rgba(255,107,107,0.1)" : "rgba(0,201,167,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color: q.status==="REJECTED" ? "#FF6B6B" : "#00C9A7", flexShrink:0 }}>
          {index+1}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:10, lineHeight:1.5, color:"#1a1a2e" }}>
            {q.question_text}
          </div>
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

          {/* Rejection reason */}
          {q.status === "REJECTED" && q.rejection_reason && (
            <div style={{ marginTop:10, padding:"10px 14px", background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:10, fontSize:12, color:"#FF6B6B" }}>
              <div style={{ fontWeight:700, marginBottom:3 }}>💬 Admin Feedback:</div>
              <div>{q.rejection_reason}</div>
            </div>
          )}

          {/* Delete & Replace button */}
          {showDelete && (
            <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:10 }}>
              <button
                onClick={() => handleDeleteQuestion(q.id)}
                disabled={deleting === q.id || replacingId !== null}
                style={{ padding:"8px 18px", borderRadius:8, border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.08)", color:"#FF6B6B", fontSize:12, fontWeight:700, cursor: (deleting===q.id || replacingId!==null) ? "not-allowed" : "pointer", fontFamily:"'DM Sans',sans-serif", opacity: (deleting===q.id || replacingId!==null) ? 0.5 : 1, transition:"all 0.15s" }}>
                {deleting === q.id ? "Deleting..." : "🗑️ Delete & Replace"}
              </button>
              {replacingId !== null && (
                <span style={{ fontSize:11, color:"rgba(26,26,46,0.4)" }}>⚠️ Finish current replacement first</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Section Block ──
  const SectionBlock = ({ icon, title, count, color, children }) => (
    <div style={{ background:"#fff", border:`1px solid ${color}22`, borderRadius:16, overflow:"hidden", marginBottom:16 }}>
      <div style={{ padding:"12px 20px", background:`${color}08`, borderBottom:`1px solid ${color}18`, display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color }}>{title}</span>
        <span style={{ marginLeft:"auto", fontSize:12, fontWeight:700, padding:"2px 10px", borderRadius:20, background:`${color}15`, color }}>{count}</span>
      </div>
      <div style={{ padding:16 }}>{children}</div>
    </div>
  );

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(26,26,46,0.5)", fontFamily:"'DM Sans',sans-serif" }}>Loading...</div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp    { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .fade-up    { animation: fadeUp 0.3s ease both; }
        .slide-down { animation: slideDown 0.25s ease both; }
        .act-btn    { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
        .exam-tab   { transition: all 0.15s; cursor: pointer; }
        .exam-tab:hover { background: rgba(0,201,167,0.04) !important; }
        textarea:focus, input:focus { outline:none; border-color:#00C9A7 !important; box-shadow:0 0 0 3px rgba(0,201,167,0.1); }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"14px 24px", borderRadius:12, background: toast.type==="error" ? "#FF6B6B" : "#00C9A7", color:"#fff", fontSize:14, fontWeight:600, zIndex:9999, animation:"toastIn 0.3s ease", fontFamily:"'DM Sans',sans-serif", maxWidth:360 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a1a2e", maxWidth:1100 }}>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>📋 My Questions</div>
          <div style={{ fontSize:13, color:"rgba(26,26,46,0.45)" }}>Add questions · get approved · replace rejected · resubmit</div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"270px 1fr", gap:20, alignItems:"start" }}>

          {/* ── LEFT — Exam List ── */}
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(26,26,46,0.45)", letterSpacing:"0.08em", marginBottom:10 }}>
              MY EXAMS ({exams.length})
            </div>
            {exams.length === 0 ? (
              <div style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:14, padding:"40px 16px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
                <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
                <div style={{ fontSize:13, fontWeight:600 }}>No exams assigned</div>
              </div>
            ) : (
              exams.map((exam, i) => {
                const sc = STATUS_CONFIG[exam.workflow_status] || STATUS_CONFIG.DRAFT;
                const isSelected = selectedExam?.id === exam.id;
                return (
                  <div key={exam.id} className="exam-tab fade-up"
                    onClick={() => { setSelectedExam(exam); setReplacingId(null); }}
                    style={{ background:"#fff", border: isSelected ? "2px solid #00C9A7" : "1px solid rgba(26,26,46,0.08)", borderRadius:14, padding:14, marginBottom:10, animationDelay:`${i*0.06}s` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:"rgba(0,201,167,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📝</div>
                      <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, color:sc.color, background:`${sc.color}15`, border:`1px solid ${sc.color}30` }}>
                        {sc.label}
                      </span>
                    </div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color: isSelected ? "#00C9A7" : "#1a1a2e", marginBottom:4 }}>
                      {exam.exam_name}
                    </div>
                    <div style={{ fontSize:11, color:"rgba(26,26,46,0.45)", marginBottom:6 }}>📅 {exam.exam_date}</div>
                    {exam.department && (
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6, background:"rgba(0,201,167,0.08)", color:"#00C9A7" }}>🏛️ {exam.department}</span>
                        {exam.semester && <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:6, background:"rgba(108,99,255,0.08)", color:"#6C63FF" }}>Sem {exam.semester}</span>}
                      </div>
                    )}
                    {isSelected && <div style={{ marginTop:6, fontSize:11, color:"#00C9A7", fontWeight:600 }}>→ Viewing</div>}
                  </div>
                );
              })
            )}
          </div>

          {/* ── RIGHT — Questions Panel ── */}
          <div>
            {!selectedExam ? (
              <div style={{ background:"#fff", border:"1px dashed rgba(26,26,46,0.12)", borderRadius:16, padding:"80px 20px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>👈</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>Select an exam</div>
              </div>
            ) : (
              <>
                {/* Exam Header */}
                <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:20, marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:14 }}>
                    <div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:6 }}>{selectedExam.exam_name}</div>
                      <div style={{ fontSize:13, color:"rgba(26,26,46,0.5)", display:"flex", gap:12, flexWrap:"wrap" }}>
                        <span>📅 {selectedExam.exam_date}</span>
                        {selectedExam.department && (
                          <span style={{ color:"#00C9A7", fontWeight:600 }}>🏛️ {selectedExam.department} · Sem {selectedExam.semester}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                      {canAdd ? (
                        <button className="act-btn" onClick={() => setShowAddModal(true)}
                          style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#00C9A7", color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(0,201,167,0.3)" }}>
                          ➕ Add Question
                        </button>
                      ) : (
                        ["DRAFT","REJECTED"].includes(selectedExam.workflow_status) && (
                          <div style={{ padding:"9px 14px", borderRadius:10, background:"rgba(0,201,167,0.08)", border:"1px solid rgba(0,201,167,0.2)", color:"#00C9A7", fontSize:12, fontWeight:600 }}>
                            ✅ All {totalAllowed} questions added!
                          </div>
                        )
                      )}
                      {canSubmit && (
                        <button className="act-btn" onClick={handleSubmit} disabled={submitting}
                          style={{ padding:"9px 18px", borderRadius:10, border:"none", background:"#6C63FF", color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(108,99,255,0.3)", opacity: submitting ? 0.7 : 1 }}>
                          {submitting ? "Submitting..." : selectedExam.workflow_status === "REJECTED" ? "🔄 Resubmit for Approval" : "📤 Submit for Approval"}
                        </button>
                      )}
                      {selectedExam.workflow_status === "REJECTED" && rejectedQ.length > 0 && replacingId === null && (
                        <div style={{ padding:"9px 14px", borderRadius:10, background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.2)", color:"#FF6B6B", fontSize:12, fontWeight:600 }}>
                          ⚠️ Replace {rejectedQ.length} rejected question(s) first
                        </div>
                      )}
                      {replacingId !== null && (
                        <div style={{ padding:"9px 14px", borderRadius:10, background:"rgba(108,99,255,0.08)", border:"1px solid rgba(108,99,255,0.2)", color:"#6C63FF", fontSize:12, fontWeight:600 }}>
                          ✏️ Finish writing replacement first
                        </div>
                      )}
                      {selectedExam.workflow_status === "SUBMITTED" && (
                        <div style={{ padding:"9px 14px", borderRadius:10, background:"rgba(255,209,102,0.1)", border:"1px solid rgba(255,209,102,0.25)", color:"#FFD166", fontSize:12, fontWeight:600 }}>
                          ⏳ Waiting for admin review...
                        </div>
                      )}
                      {selectedExam.workflow_status === "APPROVED" && (
                        <div style={{ padding:"9px 14px", borderRadius:10, background:"rgba(0,201,167,0.1)", border:"1px solid rgba(0,201,167,0.25)", color:"#00C9A7", fontSize:12, fontWeight:600 }}>
                          ✅ Approved — Go lock the paper!
                        </div>
                      )}
                      {selectedExam.workflow_status === "LOCKED" && (
                        <div style={{ padding:"9px 14px", borderRadius:10, background:"rgba(108,99,255,0.1)", border:"1px solid rgba(108,99,255,0.25)", color:"#6C63FF", fontSize:12, fontWeight:600 }}>
                          🔒 Locked on Blockchain
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height:8, background:"rgba(26,26,46,0.06)", borderRadius:4, overflow:"hidden", marginBottom:8 }}>
                    <div style={{ height:"100%", background: activeCount===totalAllowed ? "#00C9A7" : "#6C63FF", borderRadius:4, width:`${totalAllowed > 0 ? Math.min((activeCount/totalAllowed)*100,100) : 0}%`, transition:"width 0.5s ease" }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:12, color:"rgba(26,26,46,0.5)" }}>
                      <span style={{ fontWeight:700, color: activeCount===totalAllowed ? "#00C9A7" : "#6C63FF" }}>{activeCount}</span>
                      <span> of </span>
                      <span style={{ fontWeight:700 }}>{totalAllowed}</span>
                      <span> active questions</span>
                      {activeCount === totalAllowed && <span style={{ color:"#00C9A7", marginLeft:6 }}>✅ Complete</span>}
                    </div>
                    {remainingSlots > 0 && ["DRAFT","REJECTED"].includes(selectedExam.workflow_status) && (
                      <div style={{ fontSize:12, fontWeight:700, color:"#FF6B6B", padding:"3px 10px", borderRadius:20, background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.15)" }}>
                        {remainingSlots} slot(s) remaining
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                {questions.length > 0 && (
                  <div className="fade-up" style={{ display:"flex", gap:10, marginBottom:16 }}>
                    {[
                      { label:"Total Added", value:questions.length, color:"#6C63FF" },
                      { label:"Active",      value:activeCount,      color:"#1a1a2e" },
                      { label:"Pending",     value:pendingQ.length,  color:"#FFD166" },
                      { label:"Approved",    value:approvedQ.length, color:"#00C9A7" },
                      { label:"Rejected",    value:rejectedQ.length, color:"#FF6B6B" },
                    ].map((s,i) => (
                      <div key={i} style={{ padding:"10px 14px", borderRadius:12, background:`${s.color}10`, border:`1px solid ${s.color}22`, textAlign:"center", flex:1 }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                        <div style={{ fontSize:10, color:"rgba(26,26,46,0.45)", marginTop:2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Workflow guide when rejected */}
                {selectedExam.workflow_status === "REJECTED" && rejectedQ.length > 0 && (
                  <div className="fade-up" style={{ background:"rgba(108,99,255,0.04)", border:"1px solid rgba(108,99,255,0.15)", borderRadius:14, padding:"14px 18px", marginBottom:16 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:"#6C63FF", marginBottom:10 }}>📋 Steps to fix rejected questions:</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {[
                        { step:"1", text:"Read admin feedback",              color:"#FF6B6B" },
                        { step:"2", text:"Click 🗑️ Delete & Replace",        color:"#FF6B6B" },
                        { step:"3", text:"Write replacement in form below",   color:"#6C63FF" },
                        { step:"4", text:"Save replacement",                  color:"#6C63FF" },
                        { step:"5", text:"Repeat for all rejected",           color:"#FFD166" },
                        { step:"6", text:"Click 🔄 Resubmit",                color:"#00C9A7" },
                      ].map((s,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 12px", background:"#fff", borderRadius:8, border:`1px solid ${s.color}22` }}>
                          <div style={{ width:20, height:20, borderRadius:"50%", background:`${s.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:s.color, flexShrink:0 }}>{s.step}</div>
                          <span style={{ fontSize:11, fontWeight:600, color:"rgba(26,26,46,0.65)" }}>{s.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions Content */}
                {questionsLoading ? (
                  <div style={{ background:"#fff", borderRadius:16, padding:40, textAlign:"center", color:"rgba(26,26,46,0.4)" }}>Loading questions...</div>
                ) : questions.length === 0 ? (
                  <div style={{ background:"#fff", border:"1px dashed rgba(26,26,46,0.1)", borderRadius:16, padding:"50px 20px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
                    <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>No questions yet</div>
                    <div style={{ fontSize:13, marginTop:4 }}>Click "Add Question" — you need {totalAllowed} questions total.</div>
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
                      <SectionBlock icon="❌" title={`Rejected — Replace These`} count={rejectedQ.length} color="#FF6B6B">
                        {rejectedQ.map((q,i) => (
                          <QuestionCard
                            key={q.id}
                            q={q}
                            index={i}
                            showDelete={["REJECTED","DRAFT"].includes(selectedExam.workflow_status)}
                          />
                        ))}
                      </SectionBlock>
                    )}

                    {/* ✅ REPLACE FORM — OUTSIDE all sections so it never disappears */}
                    {replacingId !== null && (
                      <div className="slide-down" style={{ marginBottom:16 }}>
                        {/* Info banner */}
                        <div style={{ padding:"12px 16px", background:"rgba(0,201,167,0.06)", border:"1px solid rgba(0,201,167,0.25)", borderRadius:10, marginBottom:12, fontSize:13, color:"#00C9A7", display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:18 }}>✅</span>
                          <div>
                            <div style={{ fontWeight:700 }}>Question deleted successfully!</div>
                            <div style={{ fontSize:12, marginTop:2, opacity:0.8 }}>
                              Write your replacement below. <strong>{remainingSlots} slot(s) remaining</strong> out of {totalAllowed} total.
                            </div>
                          </div>
                        </div>

                        {/* Replace form card */}
                        <div style={{ background:"#fff", border:"2px solid rgba(108,99,255,0.25)", borderRadius:16, overflow:"hidden" }}>
                          <div style={{ padding:"14px 20px", background:"rgba(108,99,255,0.06)", borderBottom:"1px solid rgba(108,99,255,0.15)", display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontSize:18 }}>🔄</span>
                            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#6C63FF" }}>Write Replacement Question</span>
                            <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"rgba(255,107,107,0.1)", color:"#FF6B6B" }}>
                              {remainingSlots} slot(s) left
                            </span>
                          </div>
                          <div style={{ padding:20 }}>
                            <FormFields data={replaceForm} onChange={setReplaceForm} />
                            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
                              <button onClick={() => setReplacingId(null)}
                                style={{ padding:"10px 20px", borderRadius:8, border:"1px solid rgba(26,26,46,0.15)", background:"transparent", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                                Cancel
                              </button>
                              <button onClick={handleSaveReplacement} disabled={replaceSaving}
                                style={{ padding:"10px 26px", borderRadius:8, border:"none", background: replaceSaving ? "rgba(108,99,255,0.5)" : "#6C63FF", color:"#fff", cursor: replaceSaving ? "not-allowed" : "pointer", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 14px rgba(108,99,255,0.35)", opacity: replaceSaving ? 0.7 : 1, transition:"all 0.15s" }}>
                                {replaceSaving ? "Saving..." : "✅ Save Replacement"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ADD QUESTION MODAL ── */}
      {showAddModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,20,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}
          onClick={() => setShowAddModal(false)}>
          <div style={{ background:"#fff", borderRadius:20, padding:28, width:"90%", maxWidth:560, boxShadow:"0 24px 64px rgba(0,0,0,0.15)", maxHeight:"90vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800 }}>➕ Add Question</div>
                <div style={{ fontSize:12, color:"rgba(26,26,46,0.45)", marginTop:3 }}>
                  {activeCount} of {totalAllowed} added ·{" "}
                  <span style={{ color:"#FF6B6B", fontWeight:700 }}>{remainingSlots} remaining</span>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)}
                style={{ background:"rgba(26,26,46,0.06)", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ marginBottom:20 }}>
              <FormFields data={form} onChange={setForm} />
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
