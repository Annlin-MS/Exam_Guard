import React, { useState, useEffect } from "react";
import api from "../../services/api";

const emptyForm = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
};

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "rgba(26,26,46,0.5)", letterSpacing: "0.05em", marginBottom: 5,
};
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid rgba(26,26,46,0.15)",
  borderRadius: 8, fontSize: 13, background: "#fff", boxSizing: "border-box", minWidth: 0,
};
const textareaStyle = {
  width: "100%", padding: "10px 14px", border: "1px solid rgba(26,26,46,0.15)",
  borderRadius: 8, fontSize: 14, resize: "vertical", background: "#fff", boxSizing: "border-box",
};
const card = {
  background: "#fff", border: "1px solid rgba(26,26,46,0.08)",
  borderRadius: 16, padding: 20, marginBottom: 16,
};
const emptyBox = {
  background: "#fff", border: "1px dashed rgba(26,26,46,0.12)",
  borderRadius: 16, padding: "40px 16px", textAlign: "center", color: "rgba(26,26,46,0.4)",
};
const btnGreen = {
  padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
  background: "#00C9A7", color: "#fff", fontSize: 13, fontWeight: 700,
  boxShadow: "0 4px 12px rgba(0,201,167,0.3)",
};
const btnPurple = {
  padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
  background: "#6C63FF", color: "#fff", fontSize: 13, fontWeight: 700,
  boxShadow: "0 4px 12px rgba(108,99,255,0.3)",
};
const badgeStyle = (color) => ({
  padding: "9px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
  background: color + "10", border: `1px solid ${color}30`, color,
});

function FormFields({ data, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label style={labelStyle}>QUESTION *</label>
        <textarea
          rows={3}
          placeholder="Enter question..."
          value={data.question_text}
          onChange={e => onChange({ ...data, question_text: e.target.value })}
          style={textareaStyle}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {["a", "b", "c", "d"].map(opt => (
          <div key={opt} style={{ minWidth: 0 }}>
            <label style={labelStyle}>OPTION {opt.toUpperCase()} *</label>
            <input
              type="text"
              placeholder={`Option ${opt.toUpperCase()}`}
              value={data[`option_${opt}`]}
              onChange={e => onChange({ ...data, [`option_${opt}`]: e.target.value })}
              style={inputStyle}
            />
          </div>
        ))}
      </div>
      <div>
        <label style={labelStyle}>CORRECT ANSWER *</label>
        <div style={{ display: "flex", gap: 8 }}>
          {["A", "B", "C", "D"].map(opt => (
            <button
              key={opt}
              onClick={() => onChange({ ...data, correct_option: opt })}
              style={{
                flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer",
                border: data.correct_option === opt ? "2px solid #00C9A7" : "1px solid rgba(26,26,46,0.15)",
                background: data.correct_option === opt ? "rgba(0,201,167,0.1)" : "#fff",
                color: data.correct_option === opt ? "#00C9A7" : "rgba(26,26,46,0.4)",
                fontWeight: 800, fontSize: 14, transition: "all 0.15s",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ q, index, selectedExam, replacingId, deleting, handleDelete }) {
  const isRejected = q.status === "REJECTED";
  const canDelete  = isRejected
    && ["DRAFT", "REJECTED", "APPROVED"].includes(selectedExam?.workflow_status)
    && replacingId === null;

  return (
    <div style={{
      padding: 16, borderRadius: 12, marginBottom: 10,
      background: isRejected ? "rgba(255,107,107,0.02)" : "rgba(26,26,46,0.02)",
      border: `1px solid ${isRejected ? "rgba(255,107,107,0.2)" : "rgba(26,26,46,0.07)"}`,
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: isRejected ? "rgba(255,107,107,0.1)" : "rgba(0,201,167,0.08)",
          color: isRejected ? "#FF6B6B" : "#00C9A7",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800,
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, lineHeight: 1.5 }}>
            {q.question_text}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {["a", "b", "c", "d"].map(opt => {
              const isCorrect = q.correct_option === opt.toUpperCase();
              return (
                <div key={opt} style={{
                  padding: "6px 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6,
                  background: isCorrect ? "rgba(0,201,167,0.08)" : "rgba(26,26,46,0.03)",
                  border: `1px solid ${isCorrect ? "rgba(0,201,167,0.2)" : "rgba(26,26,46,0.06)"}`,
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 800,
                    background: isCorrect ? "#00C9A7" : "rgba(26,26,46,0.08)",
                    color: isCorrect ? "#fff" : "rgba(26,26,46,0.4)",
                  }}>
                    {opt.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11 }}>{q[`option_${opt}`]}</span>
                  {isCorrect && (
                    <span style={{ marginLeft: "auto", fontSize: 9, color: "#00C9A7", fontWeight: 700 }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>

          {isRejected && q.rejection_reason && (
            <div style={{
              marginTop: 10, padding: "10px 14px", borderRadius: 10, fontSize: 12,
              background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.2)",
              color: "#FF6B6B",
            }}>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>💬 Admin Feedback:</div>
              <div>{q.rejection_reason}</div>
            </div>
          )}

          {isRejected && (
            <div style={{ marginTop: 12 }}>
              {canDelete ? (
                <button
                  onClick={() => handleDelete(q.id)}
                  disabled={deleting === q.id}
                  style={{
                    padding: "8px 18px", borderRadius: 8, cursor: "pointer",
                    border: "1px solid rgba(255,107,107,0.3)",
                    background: "rgba(255,107,107,0.08)",
                    color: "#FF6B6B", fontSize: 12, fontWeight: 700,
                    opacity: deleting === q.id ? 0.6 : 1, transition: "all 0.15s",
                  }}>
                  {deleting === q.id ? "Deleting..." : "🗑️ Delete & Replace"}
                </button>
              ) : replacingId !== null ? (
                <div style={{ fontSize: 11, color: "rgba(26,26,46,0.4)", padding: "8px 0" }}>
                  ⚠️ Finish current replacement first
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, count, color, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 16,
      border: `1px solid ${color}22`,
    }}>
      <div style={{
        padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
        background: color + "08", borderBottom: `1px solid ${color}18`,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color }}>{title}</span>
        <span style={{
          marginLeft: "auto", fontSize: 12, fontWeight: 700,
          padding: "2px 10px", borderRadius: 20, background: color + "15", color,
        }}>{count}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

export default function StaffQuestions() {
  const [exams, setExams]                 = useState([]);
  const [selectedExam, setSelectedExam]   = useState(null);
  const [questions, setQuestions]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [qLoading, setQLoading]           = useState(false);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [deleting, setDeleting]           = useState(null);
  const [toast, setToast]                 = useState(null);

  const [replacingId, setReplacingId]     = useState(null);
  const [replaceForm, setReplaceForm]     = useState(emptyForm);
  const [replaceSaving, setReplaceSaving] = useState(false);

  const [addForm, setAddForm]             = useState(emptyForm);
  const [addSaving, setAddSaving]         = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get("/api/exams/");
      setExams(res.data);
      if (res.data.length > 0) {
        setSelectedExam(res.data[0]);
        fetchQuestions(res.data[0].id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchQuestions = async (examId) => {
    setQLoading(true);
    try {
      const res = await api.get(`/api/exams/${examId}/questions/list/`);
      setQuestions(res.data);
    } catch (e) { setQuestions([]); }
    finally { setQLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    setReplacingId(null);
    setReplaceForm(emptyForm);
    fetchQuestions(exam.id);
  };

  const handleAddQuestion = async () => {
    if (!addForm.question_text || !addForm.option_a || !addForm.option_b || !addForm.option_c || !addForm.option_d) {
      showToast("Please fill all fields!", "error");
      return;
    }
    setAddSaving(true);
    try {
      await api.post(`/api/exams/${selectedExam.id}/add-question/`, addForm);
      showToast("Question added! ✅");
      setShowAddModal(false);
      setAddForm(emptyForm);
      fetchQuestions(selectedExam.id);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to add", "error");
    } finally { setAddSaving(false); }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm("Delete this question and write a replacement?")) return;
    setDeleting(questionId);
    try {
      await api.delete(`/api/exams/questions/${questionId}/delete/`);
      setReplacingId(questionId);
      setReplaceForm(emptyForm);
      showToast("Deleted! Write your replacement below ↓");
      fetchQuestions(selectedExam.id);
    } catch (err) {
      showToast(err.response?.data?.error || "Delete failed", "error");
    } finally { setDeleting(null); }
  };

  const handleSaveReplacement = async () => {
    if (!replaceForm.question_text || !replaceForm.option_a || !replaceForm.option_b || !replaceForm.option_c || !replaceForm.option_d) {
      showToast("Please fill all fields!", "error");
      return;
    }
    setReplaceSaving(true);
    try {
      await api.post(`/api/exams/${selectedExam.id}/add-question/`, replaceForm);
      showToast("Replacement saved! ✅ Resubmit when ready.");
      setReplacingId(null);
      setReplaceForm(emptyForm);
      fetchQuestions(selectedExam.id);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save", "error");
    } finally { setReplaceSaving(false); }
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
    } finally { setSubmitting(false); }
  };

  const pendingQ     = questions.filter(q => q.status === "PENDING");
  const approvedQ    = questions.filter(q => q.status === "APPROVED");
  const rejectedQ    = questions.filter(q => q.status === "REJECTED");
  const activeCount  = questions.filter(q => q.status !== "REJECTED").length;
  const totalAllowed = selectedExam?.total_questions_allowed || 0;
  const remaining    = totalAllowed - activeCount;

  const canAdd = selectedExam
    && ["DRAFT", "REJECTED", "APPROVED"].includes(selectedExam.workflow_status)
    && activeCount < totalAllowed
    && replacingId === null;

  const canSubmit = selectedExam
    && ["DRAFT", "REJECTED", "APPROVED"].includes(selectedExam.workflow_status)
    && activeCount === totalAllowed
    && rejectedQ.length === 0
    && replacingId === null;

  const statusColor = {
    DRAFT:     "#94a3b8",
    SUBMITTED: "#FFD166",
    APPROVED:  "#00C9A7",
    REJECTED:  "#FF6B6B",
    LOCKED:    "#6C63FF",
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "rgba(26,26,46,0.5)" }}>Loading...</div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up    { animation: fadeUp 0.3s ease both }
        .slide-down { animation: slideDown 0.25s ease both }
        textarea:focus, input:focus { outline:none; border-color:#00C9A7!important; box-shadow:0 0 0 3px rgba(0,201,167,0.1) }
      `}</style>

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          padding: "14px 24px", borderRadius: 12, maxWidth: 360,
          background: toast.type === "error" ? "#FF6B6B" : "#00C9A7",
          color: "#fff", fontSize: 14, fontWeight: 600,
          animation: "toastIn 0.3s ease", fontFamily: "'DM Sans',sans-serif",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily: "'DM Sans',sans-serif", color: "#1a1a2e", maxWidth: 1100 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            📋 My Questions
          </div>
          <div style={{ fontSize: 13, color: "rgba(26,26,46,0.45)" }}>
            Add questions · get approved · replace rejected · resubmit
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 20, alignItems: "start" }}>

          {/* LEFT: Exam list */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(26,26,46,0.45)", letterSpacing: "0.08em", marginBottom: 10 }}>
              MY EXAMS ({exams.length})
            </div>
            {exams.length === 0 ? (
              <div style={emptyBox}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>No exams assigned</div>
              </div>
            ) : (
              exams.map((exam, i) => {
                const sc  = statusColor[exam.workflow_status] || "#94a3b8";
                const sel = selectedExam?.id === exam.id;
                return (
                  <div key={exam.id}
                    onClick={() => handleSelectExam(exam)}
                    className="fade-up"
                    style={{
                      background: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, cursor: "pointer",
                      border: sel ? "2px solid #00C9A7" : "1px solid rgba(26,26,46,0.08)",
                      transition: "all 0.15s", animationDelay: `${i * 0.06}s`,
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,201,167,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📝</div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, color: sc, background: sc + "20", border: `1px solid ${sc}40` }}>
                        {exam.workflow_status}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: sel ? "#00C9A7" : "#1a1a2e", marginBottom: 4 }}>
                      {exam.exam_name}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(26,26,46,0.45)", marginBottom: 6 }}>📅 {exam.exam_date}</div>
                    {exam.department && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "rgba(0,201,167,0.08)", color: "#00C9A7" }}>🏛️ {exam.department}</span>
                        {exam.semester && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "rgba(108,99,255,0.08)", color: "#6C63FF" }}>Sem {exam.semester}</span>}
                      </div>
                    )}
                    {sel && <div style={{ marginTop: 6, fontSize: 11, color: "#00C9A7", fontWeight: 600 }}>→ Viewing</div>}
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT: Questions panel */}
          <div>
            {!selectedExam ? (
              <div style={{ ...emptyBox, padding: "80px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👈</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700 }}>Select an exam</div>
              </div>
            ) : (
              <>
                {/* Exam header */}
                <div className="fade-up" style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                        {selectedExam.exam_name}
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(26,26,46,0.5)" }}>
                        📅 {selectedExam.exam_date}
                        {selectedExam.department && (
                          <span style={{ color: "#00C9A7", fontWeight: 600, marginLeft: 12 }}>
                            🏛️ {selectedExam.department} · Sem {selectedExam.semester}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      {canAdd && (
                        <button onClick={() => setShowAddModal(true)} style={btnGreen}>
                          ➕ Add Question
                        </button>
                      )}
                      {!canAdd && ["DRAFT", "REJECTED", "APPROVED"].includes(selectedExam.workflow_status) && remaining === 0 && replacingId === null && rejectedQ.length === 0 && (
                        <div style={badgeStyle("#00C9A7")}>✅ All {totalAllowed} questions filled!</div>
                      )}
                      {canSubmit && (
                        <button onClick={handleSubmit} disabled={submitting} style={btnPurple}>
                          {submitting ? "Submitting..." : selectedExam.workflow_status === "REJECTED" ? "🔄 Resubmit" : selectedExam.workflow_status === "APPROVED" ? "🔄 Resubmit for Approval" : "📤 Submit for Approval"}
                        </button>
                      )}
                      {selectedExam.workflow_status === "REJECTED" && rejectedQ.length > 0 && replacingId === null && (
                        <div style={badgeStyle("#FF6B6B")}>⚠️ Replace {rejectedQ.length} rejected question(s) first</div>
                      )}
                      {replacingId !== null && (
                        <div style={badgeStyle("#6C63FF")}>✏️ Finish writing replacement first</div>
                      )}
                      {selectedExam.workflow_status === "SUBMITTED" && (
                        <div style={badgeStyle("#FFD166")}>⏳ Awaiting admin review...</div>
                      )}
                      {selectedExam.workflow_status === "APPROVED" && rejectedQ.length === 0 && (
                        <div style={badgeStyle("#00C9A7")}>✅ Approved — go lock the paper!</div>
                      )}
                      {selectedExam.workflow_status === "APPROVED" && rejectedQ.length > 0 && (
                        <div style={badgeStyle("#FF6B6B")}>⚠️ Fix {rejectedQ.length} rejected question(s) before locking!</div>
                      )}
                      {selectedExam.workflow_status === "LOCKED" && (
                        <div style={badgeStyle("#6C63FF")}>🔒 Locked on Blockchain</div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 8, background: "rgba(26,26,46,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{
                      height: "100%", borderRadius: 4, transition: "width 0.5s ease",
                      background: activeCount === totalAllowed ? "#00C9A7" : "#6C63FF",
                      width: `${totalAllowed > 0 ? Math.min((activeCount / totalAllowed) * 100, 100) : 0}%`,
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(26,26,46,0.5)" }}>
                    <span>
                      <b style={{ color: activeCount === totalAllowed ? "#00C9A7" : "#6C63FF" }}>{activeCount}</b>
                      {" of "}<b>{totalAllowed}</b> active questions
                      {activeCount === totalAllowed && <span style={{ color: "#00C9A7", marginLeft: 6 }}>✅</span>}
                    </span>
                    {remaining > 0 && ["DRAFT", "REJECTED", "APPROVED"].includes(selectedExam.workflow_status) && (
                      <span style={{ color: "#FF6B6B", fontWeight: 700 }}>{remaining} slot(s) remaining</span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                {questions.length > 0 && (
                  <div className="fade-up" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Total",    value: questions.length, color: "#6C63FF" },
                      { label: "Active",   value: activeCount,      color: "#1a1a2e" },
                      { label: "Pending",  value: pendingQ.length,  color: "#FFD166" },
                      { label: "Approved", value: approvedQ.length, color: "#00C9A7" },
                      { label: "Rejected", value: rejectedQ.length, color: "#FF6B6B" },
                    ].map((s, i) => (
                      <div key={i} style={{
                        flex: 1, padding: "10px 14px", borderRadius: 12, textAlign: "center",
                        background: s.color + "10", border: `1px solid ${s.color}22`,
                      }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: "rgba(26,26,46,0.45)", marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Workflow guide — show for APPROVED with rejected questions too */}
                {(selectedExam.workflow_status === "REJECTED" || 
                  (selectedExam.workflow_status === "APPROVED" && rejectedQ.length > 0)) && 
                  rejectedQ.length > 0 && (
                  <div className="fade-up" style={{
                    background: "rgba(108,99,255,0.04)", border: "1px solid rgba(108,99,255,0.15)",
                    borderRadius: 14, padding: "14px 18px", marginBottom: 16,
                  }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#6C63FF", marginBottom: 10 }}>
                      📋 How to fix rejected questions:
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[
                        { n: "1", t: "Read admin feedback",         c: "#FF6B6B" },
                        { n: "2", t: "Click 🗑️ Delete & Replace", c: "#FF6B6B" },
                        { n: "3", t: "Write replacement below",     c: "#6C63FF" },
                        { n: "4", t: "Save replacement",            c: "#6C63FF" },
                        { n: "5", t: "Repeat for all rejected",     c: "#FFD166" },
                        { n: "6", t: "Click 🔄 Resubmit",          c: "#00C9A7" },
                      ].map((s, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 7,
                          padding: "7px 12px", background: "#fff", borderRadius: 8,
                          border: `1px solid ${s.c}22`,
                        }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 800, background: s.c + "15", color: s.c,
                          }}>{s.n}</div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(26,26,46,0.65)" }}>{s.t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions content */}
                {qLoading ? (
                  <div style={emptyBox}>Loading questions...</div>
                ) : questions.length === 0 ? (
                  <div style={{ ...emptyBox, padding: "50px 20px" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700 }}>No questions yet</div>
                    <div style={{ fontSize: 13, marginTop: 4, color: "rgba(26,26,46,0.4)" }}>
                      Click "Add Question" — need {totalAllowed} total.
                    </div>
                  </div>
                ) : (
                  <>
                    {pendingQ.length > 0 && (
                      <Section icon="⏳" title="Pending Review" count={pendingQ.length} color="#FFD166">
                        {pendingQ.map((q, i) => (
                          <QuestionCard key={q.id} q={q} index={i}
                            selectedExam={selectedExam}
                            replacingId={replacingId}
                            deleting={deleting}
                            handleDelete={handleDelete}
                          />
                        ))}
                      </Section>
                    )}
                    {approvedQ.length > 0 && (
                      <Section icon="✅" title="Approved" count={approvedQ.length} color="#00C9A7">
                        {approvedQ.map((q, i) => (
                          <QuestionCard key={q.id} q={q} index={i}
                            selectedExam={selectedExam}
                            replacingId={replacingId}
                            deleting={deleting}
                            handleDelete={handleDelete}
                          />
                        ))}
                      </Section>
                    )}
                    {rejectedQ.length > 0 && (
                      <Section icon="❌" title="Rejected — Replace These" count={rejectedQ.length} color="#FF6B6B">
                        {rejectedQ.map((q, i) => (
                          <QuestionCard key={q.id} q={q} index={i}
                            selectedExam={selectedExam}
                            replacingId={replacingId}
                            deleting={deleting}
                            handleDelete={handleDelete}
                          />
                        ))}
                      </Section>
                    )}
                  </>
                )}

                {/* REPLACE FORM */}
                {replacingId !== null && (
                  <div className="slide-down" style={{ marginBottom: 16 }}>
                    <div style={{
                      padding: "12px 16px", borderRadius: 10, marginBottom: 12,
                      background: "rgba(0,201,167,0.06)", border: "1px solid rgba(0,201,167,0.25)",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ fontSize: 20 }}>✅</span>
                      <div style={{ fontSize: 13, color: "#00C9A7" }}>
                        <div style={{ fontWeight: 700 }}>Question deleted!</div>
                        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                          Write your replacement below. <strong>{remaining} slot(s) remaining</strong> out of {totalAllowed}.
                        </div>
                      </div>
                    </div>
                    <div style={{ background: "#fff", border: "2px solid rgba(108,99,255,0.3)", borderRadius: 16, overflow: "hidden" }}>
                      <div style={{
                        padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
                        background: "rgba(108,99,255,0.06)", borderBottom: "1px solid rgba(108,99,255,0.15)",
                      }}>
                        <span style={{ fontSize: 18 }}>🔄</span>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, color: "#6C63FF" }}>
                          Write Replacement Question
                        </span>
                        <span style={{
                          marginLeft: "auto", fontSize: 11, fontWeight: 700,
                          padding: "3px 10px", borderRadius: 20,
                          background: "rgba(255,107,107,0.1)", color: "#FF6B6B",
                        }}>
                          {remaining} slot(s) left
                        </span>
                      </div>
                      <div style={{ padding: 20 }}>
                        <FormFields data={replaceForm} onChange={setReplaceForm} />
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                          <button
                            onClick={() => { setReplacingId(null); setReplaceForm(emptyForm); }}
                            style={{
                              padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                              border: "1px solid rgba(26,26,46,0.15)", background: "transparent",
                              fontSize: 13, fontWeight: 600,
                            }}>
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveReplacement}
                            disabled={replaceSaving}
                            style={{
                              padding: "10px 26px", borderRadius: 8, border: "none", cursor: "pointer",
                              background: replaceSaving ? "rgba(108,99,255,0.5)" : "#6C63FF",
                              color: "#fff", fontSize: 13, fontWeight: 700,
                              boxShadow: "0 4px 14px rgba(108,99,255,0.35)",
                              opacity: replaceSaving ? 0.7 : 1, transition: "all 0.15s",
                            }}>
                            {replaceSaving ? "Saving..." : "✅ Save Replacement"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ADD QUESTION MODAL */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(10,10,20,0.5)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 20, padding: 28,
              width: "90%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800 }}>➕ Add Question</div>
                <div style={{ fontSize: 12, color: "rgba(26,26,46,0.45)", marginTop: 3 }}>
                  {activeCount} of {totalAllowed} added ·{" "}
                  <span style={{ color: "#FF6B6B", fontWeight: 700 }}>{remaining} remaining</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "rgba(26,26,46,0.06)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>
                ✕
              </button>
            </div>
            <FormFields data={addForm} onChange={setAddForm} />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowAddModal(false)} style={{
                padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                border: "1px solid rgba(26,26,46,0.15)", background: "transparent", fontSize: 14, fontWeight: 600,
              }}>
                Cancel
              </button>
              <button onClick={handleAddQuestion} disabled={addSaving} style={{ ...btnGreen, fontSize: 14 }}>
                {addSaving ? "Adding..." : "➕ Add Question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}