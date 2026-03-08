import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

const AttemptExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examName, setExamName] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [marked, setMarked] = useState([]);
  const timerRef = useRef(null);
  const answersRef = useRef({});
  const autoSubmitRef = useRef(false);

  // Keep answersRef in sync with answers state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    startAndFetch();
    // Tab switch detection
    const handleVisibility = () => {
      if (document.hidden) {
        alert("⚠️ Warning: Do not switch tabs during exam!");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const startAndFetch = async () => {
  try {
    await api.post(`/api/exams/${examId}/start/`);

    // ✅ fetch-paper returns questions + duration together
    const res = await api.get(`/api/exams/${examId}/fetch-paper/`);
    setQuestions(res.data.questions);
    setExamName(res.data.exam);

    // ✅ Get duration directly from fetch-paper response
    const duration = res.data.duration_minutes || 60;
    const remaining = Math.max(parseInt(duration) * 60, 60);
    setTimeLeft(remaining);
    startTimer(remaining);

  } catch (err) {
    console.error("Failed to load exam:", err);
  } finally {
    setLoading(false);
  }
};

  const startTimer = (seconds) => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // ✅ FIX 2 — Auto submit using answersRef to avoid stale closure
          if (!autoSubmitRef.current) {
            autoSubmitRef.current = true;
            submitAnswers();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  // ✅ FIX 2 — Uses answersRef instead of answers state
  const submitAnswers = async () => {
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const answersArr = Object.entries(answersRef.current).map(([question_id, selected_option]) => ({
        question_id: parseInt(question_id),
        selected_option
      }));
      const res = await api.post(`/api/exams/${examId}/submit/`, { answers: answersArr });
      navigate(`/student/results`, { state: { result: res.data, examId } });
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const handleAnswer = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const toggleMark = (idx) => {
    setMarked(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  // Manual submit from button
  const handleSubmit = async () => {
    setShowConfirm(false);
    await submitAnswers();
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fff8f0", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>📝</div>
        <div style={{ fontSize:16, color:"rgba(46,26,26,0.6)" }}>Loading exam...</div>
      </div>
    </div>
  );

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const isRed = timeLeft !== null && timeLeft < 300;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .opt-btn { transition: all 0.15s; cursor: pointer; border: none; text-align: left; width: 100%; font-family: 'DM Sans', sans-serif; }
        .opt-btn:hover { transform: translateX(4px); }
        .nav-q { transition: all 0.15s; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; font-weight: 700; }
        .nav-q:hover { filter: brightness(1.1); }
      `}</style>

      <div style={{ minHeight:"100vh", background:"#fff8f0", fontFamily:"'DM Sans',sans-serif" }}>

        {/* ── TOP BAR ── */}
        <div style={{ background:"#fff", borderBottom:"1px solid rgba(255,107,107,0.15)", padding:"0 28px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#2e1a1a" }}>
            {examName}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ fontSize:13, color:"rgba(46,26,26,0.5)" }}>
              {answeredCount}/{questions.length} answered
            </div>
            {timeLeft !== null && (
              <div style={{ padding:"8px 16px", borderRadius:10, background: isRed ? "rgba(255,107,107,0.1)" : "rgba(0,201,167,0.08)", border:`1px solid ${isRed ? "rgba(255,107,107,0.3)" : "rgba(0,201,167,0.2)"}`, fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color: isRed ? "#FF6B6B" : "#00C9A7", animation: isRed ? "blink 1s infinite" : "none" }}>
                ⏱️ {formatTime(timeLeft)}
              </div>
            )}
            <button onClick={() => setShowConfirm(true)} disabled={submitting}
              style={{ padding:"9px 20px", background:"#FF6B6B", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(255,107,107,0.3)", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Submitting..." : "📤 Submit Exam"}
            </button>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20, padding:24, maxWidth:1200, margin:"0 auto" }}>

          {/* ── QUESTION AREA ── */}
          <div>
            {q && (
              <div key={current} className="fade-up" style={{ background:"#fff", borderRadius:16, padding:28, border:"1px solid rgba(255,107,107,0.08)" }}>

                {/* Question Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"rgba(46,26,26,0.4)", letterSpacing:"0.08em" }}>
                    QUESTION {current+1} OF {questions.length}
                  </span>
                  <button className="nav-q" onClick={() => toggleMark(current)}
                    style={{ padding:"6px 14px", borderRadius:8, background: marked.includes(current) ? "rgba(255,209,102,0.15)" : "rgba(46,26,26,0.05)", color: marked.includes(current) ? "#FFD166" : "rgba(46,26,26,0.4)", fontSize:12 }}>
                    {marked.includes(current) ? "🔖 Marked" : "🔖 Mark for Review"}
                  </button>
                </div>

                {/* Progress Bar */}
                <div style={{ height:4, background:"rgba(255,107,107,0.1)", borderRadius:2, marginBottom:24, overflow:"hidden" }}>
                  <div style={{ height:"100%", background:"#FF6B6B", borderRadius:2, width:`${((current+1)/questions.length)*100}%`, transition:"width 0.3s" }} />
                </div>

                {/* Question Text */}
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:"#2e1a1a", marginBottom:24, lineHeight:1.6 }}>
                  {q.question_text}
                </div>

                {/* Options */}
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {["A","B","C","D"].map(opt => {
                    const isSelected = answers[q.id] === opt;
                    return (
                      <button key={opt} className="opt-btn" onClick={() => handleAnswer(q.id, opt)}
                        style={{ padding:"16px 20px", borderRadius:12, background: isSelected ? "rgba(255,107,107,0.08)" : "rgba(46,26,26,0.02)", border: isSelected ? "2px solid #FF6B6B" : "1px solid rgba(46,26,26,0.1)", display:"flex", alignItems:"center", gap:14 }}>
                        <div style={{ width:32, height:32, borderRadius:8, background: isSelected ? "#FF6B6B" : "rgba(46,26,26,0.06)", color: isSelected ? "#fff" : "rgba(46,26,26,0.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, flexShrink:0 }}>
                          {opt}
                        </div>
                        <span style={{ fontSize:15, color:"#2e1a1a", fontWeight: isSelected ? 600 : 400 }}>
                          {q[`option_${opt.toLowerCase()}`]}
                        </span>
                        {isSelected && <span style={{ marginLeft:"auto", color:"#FF6B6B", fontSize:18 }}>●</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Prev / Next */}
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:24 }}>
                  <button className="nav-q" onClick={() => setCurrent(p => Math.max(0,p-1))} disabled={current===0}
                    style={{ padding:"10px 24px", borderRadius:10, background: current===0 ? "rgba(46,26,26,0.04)" : "rgba(255,107,107,0.08)", color: current===0 ? "rgba(46,26,26,0.3)" : "#FF6B6B", fontSize:14 }}>
                    ← Previous
                  </button>
                  <button className="nav-q" onClick={() => setCurrent(p => Math.min(questions.length-1,p+1))} disabled={current===questions.length-1}
                    style={{ padding:"10px 24px", borderRadius:10, background: current===questions.length-1 ? "rgba(46,26,26,0.04)" : "#FF6B6B", color: current===questions.length-1 ? "rgba(46,26,26,0.3)" : "#fff", fontSize:14, boxShadow: current===questions.length-1 ? "none" : "0 4px 12px rgba(255,107,107,0.3)" }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── QUESTION NAVIGATOR ── */}
          <div>
            <div style={{ background:"#fff", borderRadius:16, padding:20, border:"1px solid rgba(255,107,107,0.08)", position:"sticky", top:84 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, marginBottom:16 }}>
                📊 Question Navigator
              </div>

              {/* Grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:16 }}>
                {questions.map((q, i) => (
                  <button key={i} className="nav-q" onClick={() => setCurrent(i)}
                    style={{ width:"100%", aspectRatio:"1", borderRadius:8, fontSize:12, background: current===i ? "#FF6B6B" : answers[q.id] ? "rgba(0,201,167,0.12)" : marked.includes(i) ? "rgba(255,209,102,0.15)" : "rgba(46,26,26,0.05)", color: current===i ? "#fff" : answers[q.id] ? "#00C9A7" : marked.includes(i) ? "#FFD166" : "rgba(46,26,26,0.5)", border: current===i ? "none" : answers[q.id] ? "1px solid rgba(0,201,167,0.25)" : "1px solid transparent" }}>
                    {i+1}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
                {[
                  ["#FF6B6B",              "Current"   ],
                  ["#00C9A7",              "Answered"  ],
                  ["#FFD166",              "Marked"    ],
                  ["rgba(46,26,26,0.3)",   "Not visited"],
                ].map(([color, label]) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:"rgba(46,26,26,0.5)" }}>
                    <div style={{ width:12, height:12, borderRadius:3, background:color }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Answered Count */}
              <div style={{ padding:"12px", background:"rgba(255,107,107,0.05)", borderRadius:10, textAlign:"center", marginBottom:12 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:"#FF6B6B" }}>
                  {answeredCount}/{questions.length}
                </div>
                <div style={{ fontSize:11, color:"rgba(46,26,26,0.45)", marginTop:2 }}>Answered</div>
              </div>

              {/* Marked Count */}
              {marked.length > 0 && (
                <div style={{ padding:"10px 12px", background:"rgba(255,209,102,0.08)", borderRadius:10, textAlign:"center", marginBottom:12, border:"1px solid rgba(255,209,102,0.2)" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:"#FFD166" }}>
                    {marked.length}
                  </div>
                  <div style={{ fontSize:11, color:"rgba(46,26,26,0.45)", marginTop:2 }}>Marked for Review</div>
                </div>
              )}

              {/* Submit Button */}
              <button onClick={() => setShowConfirm(true)} disabled={submitting}
                style={{ width:"100%", padding:"12px", background:"#FF6B6B", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(255,107,107,0.3)", opacity: submitting ? 0.7 : 1 }}>
                📤 Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONFIRM SUBMIT MODAL ── */}
      {showConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(10,10,20,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)" }}
          onClick={() => setShowConfirm(false)}>
          <div style={{ background:"#fff", borderRadius:20, padding:32, width:"90%", maxWidth:420, textAlign:"center", boxShadow:"0 24px 64px rgba(0,0,0,0.15)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:48, marginBottom:16 }}>📤</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:8 }}>Submit Exam?</div>
            <div style={{ fontSize:14, color:"rgba(46,26,26,0.5)", marginBottom:8 }}>
              You answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.
            </div>
            {answeredCount < questions.length && (
              <div style={{ padding:"10px", background:"rgba(255,209,102,0.1)", borderRadius:8, fontSize:13, color:"#FFD166", marginBottom:16, border:"1px solid rgba(255,209,102,0.25)" }}>
                ⚠️ {questions.length - answeredCount} question(s) unanswered!
              </div>
            )}
            {marked.length > 0 && (
              <div style={{ padding:"10px", background:"rgba(255,209,102,0.08)", borderRadius:8, fontSize:13, color:"#FFD166", marginBottom:16, border:"1px solid rgba(255,209,102,0.2)" }}>
                🔖 {marked.length} question(s) marked for review!
              </div>
            )}
            <div style={{ fontSize:13, color:"rgba(46,26,26,0.4)", marginBottom:24 }}>
              This action cannot be undone.
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <button onClick={() => setShowConfirm(false)}
                style={{ padding:"12px 24px", borderRadius:10, border:"1px solid rgba(46,26,26,0.15)", background:"transparent", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                Continue
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding:"12px 28px", background:"#FF6B6B", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 16px rgba(255,107,107,0.3)", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Submitting..." : "📤 Submit Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttemptExam;
