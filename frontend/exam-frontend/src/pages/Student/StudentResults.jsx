import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";

const StudentResults = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => { fetchExams(); }, []);

  useEffect(() => {
    if (location.state?.result) setResult(location.state.result);
  }, [location]);

  useEffect(() => {
    if (selectedExam) fetchResult(selectedExam.id);
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await api.get("/api/exams/");
      const completed = res.data.filter(e => e.status === "SUBMITTED");
      setExams(completed);
      if (completed.length > 0) setSelectedExam(completed[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResult = async (examId) => {
    try {
      const res = await api.get(`/api/exams/${examId}/my-result/`);
      setResult(res.data);
    } catch (err) {
      setResult(null);
    }
  };

  const getGrade = (p) => {
    if (p >= 90) return { grade:"A+", color:"#00C9A7", msg:"Outstanding! 🌟" };
    if (p >= 80) return { grade:"A",  color:"#00C9A7", msg:"Excellent! 🎉"  };
    if (p >= 70) return { grade:"B",  color:"#6C63FF", msg:"Good Job! 👍"   };
    if (p >= 60) return { grade:"C",  color:"#FFD166", msg:"Keep it up! 💪" };
    if (p >= 50) return { grade:"D",  color:"#FFD166", msg:"Just Passed 😅" };
    return { grade:"F", color:"#FF6B6B", msg:"Better luck next time 🙏" };
  };

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(46,26,26,0.5)", fontFamily:"'DM Sans',sans-serif" }}>Loading...</div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes countUp { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#2e1a1a", maxWidth:800 }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>📊 My Results</div>
          <div style={{ fontSize:13, color:"rgba(46,26,26,0.45)" }}>Your exam scores and grades</div>
        </div>

        {exams.length === 0 && !location.state?.result ? (
          <div style={{ background:"#fff", borderRadius:16, padding:"60px 20px", textAlign:"center", color:"rgba(46,26,26,0.4)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>No results yet</div>
            <div style={{ fontSize:13, marginTop:4 }}>Complete an exam to see your results!</div>
          </div>
        ) : (
          <>
            {/* Exam Selector */}
            {exams.length > 0 && (
              <div style={{ background:"#fff", border:"1px solid rgba(255,107,107,0.1)", borderRadius:16, padding:20, marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"rgba(46,26,26,0.45)", letterSpacing:"0.08em", marginBottom:12 }}>SELECT EXAM</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {exams.map(exam => (
                    <button key={exam.id} className="act-btn" onClick={() => setSelectedExam(exam)}
                      style={{ padding:"10px 16px", borderRadius:10, border: selectedExam?.id===exam.id ? "2px solid #FF6B6B" : "1px solid rgba(46,26,26,0.12)", background: selectedExam?.id===exam.id ? "rgba(255,107,107,0.08)" : "transparent", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color: selectedExam?.id===exam.id ? "#FF6B6B" : "#2e1a1a" }}>
                      {exam.exam_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {result && (() => {
              const g = getGrade(result.percentage || 0);
              const passed = (result.percentage || 0) >= 50;
              return (
                <>
                  {/* Grade Card */}
                  <div className="fade-up" style={{ background:`linear-gradient(135deg, ${g.color}, ${g.color}cc)`, borderRadius:20, padding:"36px 32px", marginBottom:20, color:"#fff", textAlign:"center", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15), transparent 60%)" }} />
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:88, fontWeight:800, lineHeight:1, marginBottom:8, animation:"countUp 0.5s cubic-bezier(.34,1.56,.64,1) both" }}>
                      {g.grade}
                    </div>
                    <div style={{ fontSize:16, opacity:0.9, marginBottom:20, fontWeight:600 }}>{g.msg}</div>

                    {/* Score Stats */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, background:"rgba(255,255,255,0.15)", borderRadius:14, padding:"16px 20px", backdropFilter:"blur(10px)" }}>
                      {[
                        { label:"Score",      value: result.score },
                        { label:"Percentage", value: `${result.percentage || 0}%` },
                        { label:"Status",     value: passed ? "PASSED ✅" : "FAILED ❌" },
                      ].map((s,i) => (
                        <div key={i}>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800 }}>{s.value}</div>
                          <div style={{ fontSize:11, opacity:0.75, marginTop:2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Result Details */}
                  <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(255,107,107,0.1)", borderRadius:16, padding:24, marginBottom:16, animationDelay:"0.1s" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:16 }}>📋 Result Details</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      {[
                        { label:"Exam Name",    value: result.exam },
                        { label:"Submitted At", value: result.submitted_at ? new Date(result.submitted_at).toLocaleString() : "—" },
                        { label:"Your Score",   value: result.score },
                        { label:"Final Result", value: passed ? "✅ Passed" : "❌ Failed" },
                      ].map((item,i) => (
                        <div key={i} style={{ padding:"14px 16px", background:"rgba(46,26,26,0.02)", border:"1px solid rgba(46,26,26,0.07)", borderRadius:10 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:"rgba(46,26,26,0.4)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:6 }}>{item.label}</div>
                          <div style={{ fontSize:14, fontWeight:600 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Result secured note — no hash shown */}
                  <div className="fade-up" style={{ background:"rgba(108,99,255,0.04)", border:"1px solid rgba(108,99,255,0.12)", borderRadius:16, padding:16, animationDelay:"0.15s", display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ fontSize:24 }}>🔒</div>
                    <div style={{ fontSize:13, color:"rgba(46,26,26,0.5)" }}>
                      Your result is securely stored on blockchain and verified by admin. Results cannot be tampered with.
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </>
  );
};

export default StudentResults;
