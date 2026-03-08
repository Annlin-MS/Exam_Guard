import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await api.get("/api/student/results/");
      setResults(res.data);
      // Auto select if coming from exam submission
      if (location.state?.examId) {
        const match = res.data.find(r => r.exam_id === location.state.examId);
        if (match) handleSelectResult(match);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = async (result) => {
    setSelectedResult(result);
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/student/results/${result.id}/detail/`);
      setAnswers(res.data.answers || []);
    } catch (err) {
      setAnswers([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 80) return "#00C9A7";
    if (percentage >= 60) return "#FFD166";
    if (percentage >= 40) return "#FF6B6B";
    return "#94a3b8";
  };

  const getGradeLabel = (percentage) => {
    if (percentage >= 80) return "A";
    if (percentage >= 60) return "B";
    if (percentage >= 40) return "C";
    return "F";
  };

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(46,26,26,0.5)", fontFamily:"'DM Sans',sans-serif" }}>Loading results...</div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .result-tab { transition: all 0.15s; cursor: pointer; }
        .result-tab:hover { background: rgba(255,107,107,0.04) !important; }
        .q-card { transition: all 0.15s; }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#2e1a1a", maxWidth:1100 }}>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>📊 My Results</div>
          <div style={{ fontSize:13, color:"rgba(46,26,26,0.45)" }}>View your exam results and detailed answers</div>
        </div>

        {results.length === 0 ? (
          <div style={{ textAlign:"center", padding:"80px 20px", color:"rgba(46,26,26,0.4)" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📭</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700 }}>No results yet</div>
            <div style={{ fontSize:13, marginTop:8 }}>Results will appear here after admin publishes them</div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:20 }}>

            {/* Results List */}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {results.map((result, i) => {
                const pct = result.percentage ?? 0;
                const gradeColor = getGradeColor(pct);
                const isSelected = selectedResult?.id === result.id;
                return (
                  <div key={result.id} className="result-tab fade-up"
                    onClick={() => handleSelectResult(result)}
                    style={{ padding:"16px", borderRadius:14, border: isSelected ? `2px solid ${gradeColor}` : "1px solid rgba(46,26,26,0.08)", background: isSelected ? `${gradeColor}08` : "#fff", animationDelay:`${i*0.06}s` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:"#2e1a1a" }}>
                        {result.exam_name}
                      </div>
                      <div style={{ width:36, height:36, borderRadius:10, background:`${gradeColor}15`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:gradeColor }}>
                        {getGradeLabel(pct)}
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:"rgba(46,26,26,0.5)", marginBottom:8 }}>📅 {result.exam_date}</div>
                    {/* Score bar */}
                    <div style={{ height:4, background:"rgba(46,26,26,0.08)", borderRadius:2, overflow:"hidden", marginBottom:6 }}>
                      <div style={{ height:"100%", background:gradeColor, borderRadius:2, width:`${pct}%`, transition:"width 0.5s ease" }} />
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(46,26,26,0.5)" }}>
                      <span>{result.score ?? "—"} / {result.total_marks ?? "—"} marks</span>
                      <span style={{ fontWeight:700, color:gradeColor }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail Panel */}
            <div>
              {!selectedResult ? (
                <div style={{ background:"#fff", borderRadius:16, padding:"80px 20px", textAlign:"center", border:"1px solid rgba(46,26,26,0.08)", color:"rgba(46,26,26,0.4)" }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>👈</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>Select a result</div>
                  <div style={{ fontSize:12, marginTop:4 }}>to see detailed answers</div>
                </div>
              ) : (
                <div className="fade-up" style={{ background:"#fff", borderRadius:16, overflow:"hidden", border:"1px solid rgba(46,26,26,0.08)" }}>

                  {/* Result Header */}
                  <div style={{ padding:"20px 24px", borderBottom:"1px solid rgba(46,26,26,0.06)", background:`${getGradeColor(selectedResult.percentage ?? 0)}08` }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:4 }}>
                      {selectedResult.exam_name}
                    </div>
                    <div style={{ fontSize:12, color:"rgba(46,26,26,0.5)", marginBottom:16 }}>📅 {selectedResult.exam_date}</div>

                    {/* Score Cards */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                      {[
                        { label:"Score",    value:`${selectedResult.score ?? "—"}/${selectedResult.total_marks ?? "—"}`, color:"#FF6B6B" },
                        { label:"Percentage", value:`${selectedResult.percentage ?? 0}%`, color:getGradeColor(selectedResult.percentage ?? 0) },
                        { label:"Grade",    value:getGradeLabel(selectedResult.percentage ?? 0), color:getGradeColor(selectedResult.percentage ?? 0) },
                        { label:"Correct",  value:`${selectedResult.correct_count ?? 0}/${selectedResult.total_questions ?? 0}`, color:"#00C9A7" },
                      ].map((s,i) => (
                        <div key={i} style={{ padding:"12px", background:"#fff", borderRadius:10, border:`1px solid ${s.color}22`, textAlign:"center" }}>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                          <div style={{ fontSize:10, color:"rgba(46,26,26,0.45)", marginTop:2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Answer Review */}
                  <div style={{ padding:"20px 24px" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:16 }}>
                      📝 Answer Review
                    </div>

                    {detailLoading ? (
                      <div style={{ textAlign:"center", padding:40, color:"rgba(46,26,26,0.4)" }}>Loading answers...</div>
                    ) : answers.length === 0 ? (
                      <div style={{ textAlign:"center", padding:40, color:"rgba(46,26,26,0.4)" }}>
                        <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
                        <div style={{ fontSize:13 }}>Detailed answers not available</div>
                      </div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                        {answers.map((ans, i) => {
                          const isCorrect  = ans.is_correct;
                          const isSkipped  = !ans.selected_option;
                          const cardColor  = isSkipped ? "#94a3b8" : isCorrect ? "#00C9A7" : "#FF6B6B";
                          return (
                            <div key={i} className="q-card"
                              style={{ padding:"16px", borderRadius:12, border:`1px solid ${cardColor}25`, background:`${cardColor}04` }}>
                              {/* Question */}
                              <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
                                <div style={{ width:26, height:26, borderRadius:7, background:`${cardColor}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:cardColor, flexShrink:0 }}>
                                  {i+1}
                                </div>
                                <div style={{ flex:1, fontSize:14, fontWeight:600, color:"#2e1a1a", lineHeight:1.5 }}>
                                  {ans.question_text}
                                </div>
                                <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background:`${cardColor}15`, color:cardColor, flexShrink:0 }}>
                                  {isSkipped ? "⏭ Skipped" : isCorrect ? "✅ Correct" : "❌ Wrong"}
                                </span>
                              </div>

                              {/* Options */}
                              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom: (!isCorrect && !isSkipped) ? 10 : 0 }}>
                                {["A","B","C","D"].map(opt => {
                                  const optKey = `option_${opt.toLowerCase()}`;
                                  const isSelected = ans.selected_option === opt;
                                  const isCorrectOpt = ans.correct_option === opt;
                                  let bg = "rgba(46,26,26,0.03)";
                                  let border = "1px solid rgba(46,26,26,0.08)";
                                  let color = "rgba(46,26,26,0.6)";
                                  if (isCorrectOpt) { bg="rgba(0,201,167,0.08)"; border="1px solid rgba(0,201,167,0.3)"; color="#00C9A7"; }
                                  if (isSelected && !isCorrect) { bg="rgba(255,107,107,0.08)"; border="1px solid rgba(255,107,107,0.3)"; color="#FF6B6B"; }
                                  return (
                                    <div key={opt} style={{ padding:"8px 12px", borderRadius:8, background:bg, border, display:"flex", alignItems:"center", gap:8 }}>
                                      <span style={{ width:18, height:18, borderRadius:4, background: isCorrectOpt ? "#00C9A7" : isSelected && !isCorrect ? "#FF6B6B" : "rgba(46,26,26,0.08)", color: (isCorrectOpt || (isSelected && !isCorrect)) ? "#fff" : "rgba(46,26,26,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, flexShrink:0 }}>
                                        {opt}
                                      </span>
                                      <span style={{ fontSize:12, color, fontWeight: isCorrectOpt || isSelected ? 600 : 400 }}>
                                        {ans[optKey]}
                                      </span>
                                      {isCorrectOpt && <span style={{ marginLeft:"auto", fontSize:12 }}>✅</span>}
                                      {isSelected && !isCorrect && <span style={{ marginLeft:"auto", fontSize:12 }}>❌</span>}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Marks */}
                              <div style={{ marginTop:8, fontSize:11, color:"rgba(46,26,26,0.45)", display:"flex", gap:12 }}>
                                <span>Marks: <strong style={{ color:cardColor }}>{isSkipped ? 0 : isCorrect ? `+${ans.marks_correct}` : ans.marks_wrong}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentResults;