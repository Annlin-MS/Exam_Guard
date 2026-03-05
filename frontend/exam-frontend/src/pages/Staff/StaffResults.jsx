import React, { useState, useEffect } from "react";
import api from "../../services/api";

const StaffResults = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchExams(); }, []);
  useEffect(() => { if (selectedExam) fetchResults(selectedExam.id); }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await api.get("/api/exams/");
      const locked = res.data.filter(e => e.workflow_status === "LOCKED");
      setExams(locked);
      if (locked.length > 0) setSelectedExam(locked[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (examId) => {
    try {
      const res = await api.get(`/api/exams/${examId}/staff-results/`);
      setResults(res.data);
    } catch (err) {
      setResults([]);
    }
  };

  const total   = results.length;
  const passed  = results.filter(r => (r.percentage||0) >= 50).length;
  const failed  = total - passed;
  const avg     = total > 0 ? Math.round(results.reduce((a,r) => a+(r.percentage||0), 0) / total) : 0;
  const highest = total > 0 ? Math.max(...results.map(r => r.score)) : 0;

  const getGrade = (p) => {
    if (p >= 90) return { grade:"A+", color:"#00C9A7" };
    if (p >= 80) return { grade:"A",  color:"#00C9A7" };
    if (p >= 70) return { grade:"B",  color:"#6C63FF" };
    if (p >= 60) return { grade:"C",  color:"#FFD166" };
    if (p >= 50) return { grade:"D",  color:"#FFD166" };
    return { grade:"F", color:"#FF6B6B" };
  };

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(26,46,42,0.5)", fontFamily:"'DM Sans',sans-serif" }}>Loading...</div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); }
        .row:hover { background: rgba(0,201,167,0.03) !important; }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a2e2a", maxWidth:1000 }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>📊 Exam Results</div>
          <div style={{ fontSize:13, color:"rgba(26,46,42,0.45)" }}>Student performance for your exams</div>
        </div>

        {exams.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:16, padding:"60px 20px", textAlign:"center", color:"rgba(26,46,42,0.4)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>No completed exams</div>
            <div style={{ fontSize:13, marginTop:4 }}>Results appear after exams are locked and students complete them!</div>
          </div>
        ) : (
          <>
            {/* Exam Selector */}
            <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"rgba(26,46,42,0.45)", letterSpacing:"0.08em", marginBottom:12 }}>SELECT EXAM</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {exams.map(exam => (
                  <button key={exam.id} className="act-btn" onClick={() => setSelectedExam(exam)}
                    style={{ padding:"10px 16px", borderRadius:10, border: selectedExam?.id===exam.id ? "2px solid #00C9A7" : "1px solid rgba(26,46,42,0.12)", background: selectedExam?.id===exam.id ? "rgba(0,201,167,0.08)" : "transparent", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color: selectedExam?.id===exam.id ? "#00C9A7" : "#1a2e2a" }}>
                    {exam.exam_name}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:20 }}>
              {[
                { label:"Total Students", value:total,   icon:"👨‍🎓", color:"#6C63FF" },
                { label:"Passed",         value:passed,  icon:"✅",   color:"#00C9A7" },
                { label:"Failed",         value:failed,  icon:"❌",   color:"#FF6B6B" },
                { label:"Average",        value:`${avg}%`,icon:"📊",  color:"#FFD166" },
                { label:"Highest Score",  value:highest, icon:"🏆",   color:"#FFD166" },
              ].map((s,i) => (
                <div key={i} className="fade-up" style={{ background:"#fff", border:`1px solid ${s.color}22`, borderRadius:14, padding:"16px", animationDelay:`${i*0.06}s` }}>
                  <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:11, color:"rgba(26,46,42,0.45)", marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Results Table */}
            <div style={{ background:"#fff", border:"1px solid rgba(0,201,167,0.1)", borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(0,201,167,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>🏆 Student Leaderboard</div>
                <span style={{ fontSize:12, color:"rgba(26,46,42,0.4)" }}>{total} students</span>
              </div>

              {/* Header */}
              <div style={{ display:"grid", gridTemplateColumns:"50px 2fr 1fr 1fr 1fr 1fr", gap:16, padding:"10px 20px", background:"rgba(26,46,42,0.02)", borderBottom:"1px solid rgba(26,46,42,0.05)" }}>
                {["Rank","Student","Score","Percentage","Grade","Result"].map(h => (
                  <div key={h} style={{ fontSize:11, fontWeight:700, color:"rgba(26,46,42,0.4)", letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</div>
                ))}
              </div>

              {results.length === 0 ? (
                <div style={{ padding:"40px 20px", textAlign:"center", color:"rgba(26,46,42,0.4)" }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
                  <div>No students have completed this exam yet</div>
                </div>
              ) : (
                [...results]
                  .sort((a,b) => (b.percentage||0) - (a.percentage||0))
                  .map((r, i) => {
                    const g = getGrade(r.percentage||0);
                    const medals = ["🥇","🥈","🥉"];
                    const passed = (r.percentage||0) >= 50;
                    return (
                      <div key={i} className="row fade-up" style={{ display:"grid", gridTemplateColumns:"50px 2fr 1fr 1fr 1fr 1fr", gap:16, padding:"14px 20px", borderBottom:"1px solid rgba(0,201,167,0.04)", alignItems:"center", transition:"all 0.15s", animationDelay:`${i*0.04}s`, background: i===0 ? "rgba(255,215,0,0.03)" : "transparent" }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color: i<3 ? ["#FFD700","#C0C0C0","#CD7F32"][i] : "rgba(26,46,42,0.3)" }}>
                          {i < 3 ? medals[i] : `#${i+1}`}
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:10, background:"rgba(0,201,167,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>👨‍🎓</div>
                          <div style={{ fontSize:14, fontWeight:600 }}>{r.student_name}</div>
                        </div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#00C9A7" }}>{r.score}</div>
                        <div>
                          <div style={{ height:5, background:"rgba(26,46,42,0.06)", borderRadius:3, overflow:"hidden", marginBottom:3 }}>
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
      </div>
    </>
  );
};

export default StaffResults;