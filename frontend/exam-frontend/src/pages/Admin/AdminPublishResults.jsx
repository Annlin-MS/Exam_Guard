import React, { useState, useEffect } from "react";
import api from "../../services/api";

const AdminPublishResults = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [results, setResults] = useState([]);
  const [verifyData, setVerifyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchExams(); }, []);
  useEffect(() => { if (selectedExam) fetchResults(selectedExam.id); }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await api.get("/api/admin/results/");
      setExams(res.data);
      if (res.data.length > 0) setSelectedExam(res.data[0]);
    } catch (err) {
      showToast("Failed to load exams", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (examId) => {
    try {
      const res = await api.get(`/api/exams/${examId}/staff-results/`);
      setResults(res.data);
      setVerifyData(null);
    } catch (err) {
      setResults([]);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.get(`/api/admin/results/${selectedExam.id}/verify-hash/`);
      setVerifyData(res.data);
      if (res.data.all_valid) {
        showToast("All result hashes verified! ✅");
      } else {
        showToast("⚠️ Some results may be tampered!", "error");
      }
    } catch (err) {
      showToast("Verification failed!", "error");
    } finally {
      setVerifying(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await api.post(`/api/admin/results/${selectedExam.id}/publish/`);
      showToast(res.data.message + " 🎉");
      fetchExams();
      fetchResults(selectedExam.id);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to publish!", "error");
    } finally {
      setPublishing(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getGrade = (p) => {
    if (p >= 90) return { grade:"A+", color:"#00C9A7" };
    if (p >= 80) return { grade:"A",  color:"#00C9A7" };
    if (p >= 70) return { grade:"B",  color:"#6C63FF" };
    if (p >= 60) return { grade:"C",  color:"#FFD166" };
    if (p >= 50) return { grade:"D",  color:"#FFD166" };
    return { grade:"F", color:"#FF6B6B" };
  };

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(26,26,46,0.5)", fontFamily:"'DM Sans',sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .row:hover { background: rgba(108,99,255,0.03) !important; }
        .hash-text { font-family: 'JetBrains Mono', monospace; font-size: 10px; word-break: break-all; }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, padding:"14px 24px", borderRadius:12, background: toast.type==="error" ? "#FF6B6B" : "#00C9A7", color:"#fff", fontSize:14, fontWeight:600, zIndex:9999, animation:"toastIn 0.3s ease", fontFamily:"'DM Sans',sans-serif", maxWidth:360 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a1a2e", maxWidth:1100 }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>📊 Publish Results</div>
          <div style={{ fontSize:13, color:"rgba(26,26,46,0.45)" }}>Verify blockchain hashes and publish student results</div>
        </div>

        {exams.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:16, padding:"60px 20px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>No completed exams</div>
            <div style={{ fontSize:13, marginTop:4 }}>Results will appear after students complete locked exams!</div>
          </div>
        ) : (
          <>
            {/* Exam Selector */}
            <div style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"rgba(26,26,46,0.45)", letterSpacing:"0.08em", marginBottom:12 }}>SELECT EXAM</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {exams.map(exam => (
                  <button key={exam.id} className="act-btn"
                    onClick={() => { setSelectedExam(exam); setVerifyData(null); }}
                    style={{ padding:"10px 16px", borderRadius:10, border: selectedExam?.id===exam.id ? "2px solid #6C63FF" : "1px solid rgba(26,26,46,0.12)", background: selectedExam?.id===exam.id ? "rgba(108,99,255,0.08)" : "transparent", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color: selectedExam?.id===exam.id ? "#6C63FF" : "#1a1a2e", position:"relative" }}>
                    {exam.exam_name}
                    {exam.all_published && (
                      <span style={{ marginLeft:8, fontSize:10, color:"#00C9A7" }}>✅</span>
                    )}
                    {!exam.all_published && exam.total_attempts > 0 && (
                      <span style={{ marginLeft:8, fontSize:10, color:"#FFD166" }}>⏳</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedExam && (
              <>
                {/* Exam Info + Actions */}
                <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:20, marginBottom:20 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                    <div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:6 }}>{selectedExam.exam_name}</div>
                      <div style={{ display:"flex", gap:16, fontSize:13, color:"rgba(26,26,46,0.5)" }}>
                        <span>📅 {selectedExam.exam_date}</span>
                        <span>👨‍🎓 {selectedExam.total_attempts} students attempted</span>
                        <span>✅ {selectedExam.published_count} results published</span>
                      </div>
                    </div>

                    <div style={{ display:"flex", gap:10 }}>
                      {/* Verify Button */}
                      <button className="act-btn" onClick={handleVerify} disabled={verifying || results.length === 0}
                        style={{ padding:"10px 20px", borderRadius:10, border:"1px solid rgba(108,99,255,0.3)", background:"rgba(108,99,255,0.08)", color:"#6C63FF", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", opacity: results.length === 0 ? 0.5 : 1 }}>
                        {verifying ? "⏳ Verifying..." : "⛓️ Verify Hashes"}
                      </button>

                      {/* Publish Button */}
                      {!selectedExam.all_published && results.length > 0 && (
                        <button className="act-btn" onClick={handlePublish} disabled={publishing}
                          style={{ padding:"10px 20px", borderRadius:10, border:"none", background:"#6C63FF", color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(108,99,255,0.3)", opacity: publishing ? 0.7 : 1 }}>
                          {publishing ? "⏳ Publishing..." : "📢 Publish Results"}
                        </button>
                      )}

                      {selectedExam.all_published && (
                        <div style={{ padding:"10px 20px", borderRadius:10, background:"rgba(0,201,167,0.1)", border:"1px solid rgba(0,201,167,0.25)", color:"#00C9A7", fontSize:13, fontWeight:700 }}>
                          ✅ All Results Published
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Blockchain Verification Result */}
                {verifyData && (
                  <div className="fade-up" style={{ background:"#fff", border:`2px solid ${verifyData.all_valid ? "rgba(0,201,167,0.3)" : "rgba(255,107,107,0.3)"}`, borderRadius:16, padding:20, marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                      <div style={{ fontSize:28 }}>{verifyData.all_valid ? "✅" : "⚠️"}</div>
                      <div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color: verifyData.all_valid ? "#00C9A7" : "#FF6B6B" }}>
                          {verifyData.all_valid ? "All Result Hashes Verified!" : "Hash Mismatch Detected!"}
                        </div>
                        <div style={{ fontSize:13, color:"rgba(26,26,46,0.5)" }}>
                          {verifyData.all_valid
                            ? "Blockchain hashes match — results are tamper-proof ✅"
                            : "Some results may have been tampered with!"}
                        </div>
                      </div>
                    </div>

                    {/* Hash Details */}
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {verifyData.results.map((r, i) => (
                        <div key={i} style={{ padding:"14px 16px", background: r.is_valid ? "rgba(0,201,167,0.04)" : "rgba(255,107,107,0.04)", border:`1px solid ${r.is_valid ? "rgba(0,201,167,0.15)" : "rgba(255,107,107,0.2)"}`, borderRadius:12 }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:32, height:32, borderRadius:8, background:"rgba(108,99,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>👨‍🎓</div>
                              <div>
                                <div style={{ fontSize:13, fontWeight:600 }}>{r.student_name}</div>
                                <div style={{ fontSize:11, color:"rgba(26,26,46,0.45)" }}>Score: {r.score}</div>
                              </div>
                            </div>
                            <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, background: r.is_valid ? "rgba(0,201,167,0.1)" : "rgba(255,107,107,0.1)", color: r.is_valid ? "#00C9A7" : "#FF6B6B" }}>
                              {r.is_valid ? "✅ Valid" : "❌ Tampered!"}
                            </span>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                            <div style={{ padding:"8px 10px", background:"rgba(26,26,46,0.03)", borderRadius:8 }}>
                              <div style={{ fontSize:10, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.06em", marginBottom:4 }}>STORED HASH (DB)</div>
                              <div className="hash-text" style={{ color:"#6C63FF" }}>{r.stored_hash}</div>
                            </div>
                            <div style={{ padding:"8px 10px", background:"rgba(26,26,46,0.03)", borderRadius:8 }}>
                              <div style={{ fontSize:10, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.06em", marginBottom:4 }}>REGENERATED HASH</div>
                              <div className="hash-text" style={{ color: r.is_valid ? "#00C9A7" : "#FF6B6B" }}>{r.regenerated_hash}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results Table */}
                <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, overflow:"hidden", animationDelay:"0.1s" }}>
                  <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(26,26,46,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>🏆 Student Results</div>
                    <span style={{ fontSize:12, color:"rgba(26,26,46,0.4)" }}>{results.length} students</span>
                  </div>

                  {/* Table Header */}
                  <div style={{ display:"grid", gridTemplateColumns:"50px 2fr 1fr 1fr 1fr 1fr", gap:16, padding:"10px 20px", background:"rgba(26,26,46,0.02)", borderBottom:"1px solid rgba(26,26,46,0.05)" }}>
                    {["Rank","Student","Score","Percentage","Grade","Status"].map(h => (
                      <div key={h} style={{ fontSize:11, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</div>
                    ))}
                  </div>

                  {results.length === 0 ? (
                    <div style={{ padding:"40px 20px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
                      <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
                      <div>No students have completed this exam yet</div>
                    </div>
                  ) : (
                    [...results]
                      .sort((a,b) => (b.percentage||0) - (a.percentage||0))
                      .map((r, i) => {
                        const g = getGrade(r.percentage||0);
                        const passed = (r.percentage||0) >= 50;
                        const medals = ["🥇","🥈","🥉"];
                        return (
                          <div key={i} className="row fade-up" style={{ display:"grid", gridTemplateColumns:"50px 2fr 1fr 1fr 1fr 1fr", gap:16, padding:"14px 20px", borderBottom:"1px solid rgba(26,26,46,0.04)", alignItems:"center", transition:"all 0.15s", animationDelay:`${i*0.04}s`, background: i===0 ? "rgba(255,215,0,0.03)" : "transparent" }}>
                            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color: i<3 ? ["#FFD700","#C0C0C0","#CD7F32"][i] : "rgba(26,26,46,0.3)" }}>
                              {i < 3 ? medals[i] : `#${i+1}`}
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:32, height:32, borderRadius:10, background:"rgba(108,99,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>👨‍🎓</div>
                              <div style={{ fontSize:14, fontWeight:600 }}>{r.student_name}</div>
                            </div>
                            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#6C63FF" }}>{r.score}</div>
                            <div>
                              <div style={{ height:5, background:"rgba(26,26,46,0.06)", borderRadius:3, overflow:"hidden", marginBottom:3 }}>
                                <div style={{ height:"100%", background:g.color, borderRadius:3, width:`${r.percentage||0}%` }} />
                              </div>
                              <div style={{ fontSize:12, fontWeight:600, color:g.color }}>{r.percentage||0}%</div>
                            </div>
                            <div style={{ width:34, height:34, borderRadius:10, background:`${g.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:g.color }}>
                              {g.grade}
                            </div>
                            <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, background: passed ? "rgba(0,201,167,0.1)" : "rgba(255,107,107,0.1)", color: passed ? "#00C9A7" : "#FF6B6B" }}>
                              {passed ? "✅ Pass" : "❌ Fail"}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AdminPublishResults;