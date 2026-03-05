import React, { useState, useEffect } from "react";
import api from "../../services/api";

const AdminReports = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => { fetchExams(); }, []);

  useEffect(() => {
    if (selectedExam) fetchResults(selectedExam.id);
  }, [selectedExam]);

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
    setStatsLoading(true);
    try {
      const res = await api.get(`/api/exams/${examId}/staff-results/`);
      setResults(res.data);
    } catch (err) {
      setResults([]);
    } finally {
      setStatsLoading(false);
    }
  };

  // Stats calculations
  const total = results.length;
  const passed = results.filter(r => (r.percentage||0) >= 50).length;
  const failed = total - passed;
  const avg = total > 0 ? Math.round(results.reduce((a,r) => a+(r.percentage||0), 0) / total) : 0;
  const highest = total > 0 ? Math.max(...results.map(r => r.score)) : 0;
  const lowest = total > 0 ? Math.min(...results.map(r => r.score)) : 0;
  const passRate = total > 0 ? Math.round((passed/total)*100) : 0;

  // Grade distribution
  const gradeDistribution = [
    { grade:"A+", range:"90-100", count: results.filter(r=>(r.percentage||0)>=90).length, color:"#00C9A7" },
    { grade:"A",  range:"80-89",  count: results.filter(r=>(r.percentage||0)>=80 && (r.percentage||0)<90).length, color:"#6C63FF" },
    { grade:"B",  range:"70-79",  count: results.filter(r=>(r.percentage||0)>=70 && (r.percentage||0)<80).length, color:"#FFD166" },
    { grade:"C",  range:"60-69",  count: results.filter(r=>(r.percentage||0)>=60 && (r.percentage||0)<70).length, color:"#FF9F43" },
    { grade:"D",  range:"50-59",  count: results.filter(r=>(r.percentage||0)>=50 && (r.percentage||0)<60).length, color:"#FF6B6B" },
    { grade:"F",  range:"0-49",   count: results.filter(r=>(r.percentage||0)<50).length, color:"#ee5a24" },
  ];

  const getGrade = (p) => {
    if (p >= 90) return { grade:"A+", color:"#00C9A7" };
    if (p >= 80) return { grade:"A",  color:"#6C63FF" };
    if (p >= 70) return { grade:"B",  color:"#FFD166" };
    if (p >= 60) return { grade:"C",  color:"#FF9F43" };
    if (p >= 50) return { grade:"D",  color:"#FF6B6B" };
    return { grade:"F", color:"#ee5a24" };
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
        @keyframes barGrow { from { height:0; } to { height:var(--h); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .row:hover { background: rgba(108,99,255,0.03) !important; }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a1a2e", maxWidth:1100 }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>📊 Reports & Analytics</div>
          <div style={{ fontSize:13, color:"rgba(26,26,46,0.45)" }}>Exam performance analytics and student results</div>
        </div>

        {exams.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:16, padding:"60px 20px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>No completed exams yet</div>
            <div style={{ fontSize:13, marginTop:4 }}>Reports will appear after exams are locked and students complete them!</div>
          </div>
        ) : (
          <>
            {/* Exam Selector */}
            <div style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"rgba(26,26,46,0.45)", letterSpacing:"0.08em", marginBottom:12 }}>SELECT EXAM</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {exams.map(exam => (
                  <button key={exam.id} className="act-btn" onClick={() => setSelectedExam(exam)}
                    style={{ padding:"10px 16px", borderRadius:10, border: selectedExam?.id===exam.id ? "2px solid #6C63FF" : "1px solid rgba(26,26,46,0.12)", background: selectedExam?.id===exam.id ? "rgba(108,99,255,0.08)" : "transparent", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color: selectedExam?.id===exam.id ? "#6C63FF" : "#1a1a2e" }}>
                    {exam.exam_name}
                  </button>
                ))}
              </div>
            </div>

            {statsLoading ? (
              <div style={{ textAlign:"center", padding:40, color:"rgba(26,26,46,0.4)" }}>Loading results...</div>
            ) : total === 0 ? (
              <div style={{ background:"#fff", borderRadius:16, padding:"60px 20px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>No students attempted yet</div>
              </div>
            ) : (
              <>
                {/* Key Stats */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:20 }}>
                  {[
                    { label:"Students",  value:total,    icon:"👨‍🎓", color:"#6C63FF" },
                    { label:"Passed",    value:passed,   icon:"✅",   color:"#00C9A7" },
                    { label:"Failed",    value:failed,   icon:"❌",   color:"#FF6B6B" },
                    { label:"Pass Rate", value:`${passRate}%`, icon:"📈", color:"#00C9A7" },
                    { label:"Avg Score", value:`${avg}%`, icon:"📊", color:"#FFD166" },
                    { label:"Highest",   value:highest,  icon:"🏆",   color:"#FFD166" },
                  ].map((s,i) => (
                    <div key={i} className="fade-up" style={{ background:"#fff", border:`1px solid ${s.color}22`, borderRadius:14, padding:"16px", animationDelay:`${i*0.05}s` }}>
                      <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:11, color:"rgba(26,26,46,0.45)", marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Pass/Fail + Grade Distribution Row */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>

                  {/* Pass/Fail Donut */}
                  <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:24, animationDelay:"0.1s" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:20 }}>✅ Pass / Fail Ratio</div>

                    {/* Visual Bar */}
                    <div style={{ height:24, borderRadius:12, overflow:"hidden", display:"flex", marginBottom:16 }}>
                      <div style={{ width:`${passRate}%`, background:"#00C9A7", transition:"width 1s ease" }} />
                      <div style={{ flex:1, background:"#FF6B6B" }} />
                    </div>

                    <div style={{ display:"flex", gap:16 }}>
                      {[
                        { label:"Passed", value:passed, pct:passRate, color:"#00C9A7" },
                        { label:"Failed", value:failed, pct:100-passRate, color:"#FF6B6B" },
                      ].map((item,i) => (
                        <div key={i} style={{ flex:1, padding:"14px", background:`${item.color}08`, border:`1px solid ${item.color}22`, borderRadius:10, textAlign:"center" }}>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:item.color }}>{item.value}</div>
                          <div style={{ fontSize:12, color:"rgba(26,26,46,0.5)", marginTop:2 }}>{item.label} ({item.pct}%)</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grade Distribution */}
                  <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:24, animationDelay:"0.15s" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:20 }}>📊 Grade Distribution</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {gradeDistribution.map((g,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:28, height:28, borderRadius:6, background:`${g.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:800, color:g.color, flexShrink:0 }}>
                            {g.grade}
                          </div>
                          <div style={{ fontSize:11, color:"rgba(26,26,46,0.4)", width:52, flexShrink:0 }}>{g.range}%</div>
                          <div style={{ flex:1, height:8, background:"rgba(26,26,46,0.05)", borderRadius:4, overflow:"hidden" }}>
                            <div style={{ height:"100%", background:g.color, borderRadius:4, width:`${total > 0 ? (g.count/total)*100 : 0}%`, transition:"width 1s ease" }} />
                          </div>
                          <div style={{ fontSize:13, fontWeight:700, color:g.color, width:20, textAlign:"right", flexShrink:0 }}>{g.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score Bar Chart */}
                <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:24, marginBottom:20, animationDelay:"0.2s" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:20 }}>📈 Student Score Overview</div>
                  <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120, paddingBottom:8, borderBottom:"1px solid rgba(26,26,46,0.06)" }}>
                    {results.map((r, i) => {
                      const pct = r.percentage || 0;
                      const g = getGrade(pct);
                      return (
                        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                          <div style={{ fontSize:9, color:g.color, fontWeight:700 }}>{pct}%</div>
                          <div style={{ width:"100%", background:g.color, borderRadius:"4px 4px 0 0", height:`${pct}%`, maxHeight:90, minHeight:4, transition:"height 1s ease", opacity:0.85 }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:8 }}>
                    {results.map((r,i) => (
                      <div key={i} style={{ flex:1, fontSize:9, color:"rgba(26,26,46,0.4)", textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {r.student_name?.split(" ")[0] || `S${i+1}`}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, overflow:"hidden", animationDelay:"0.25s" }}>
                  <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(26,26,46,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>🏆 Leaderboard</div>
                    <span style={{ fontSize:12, color:"rgba(26,26,46,0.4)" }}>{total} students</span>
                  </div>

                  {/* Table Header */}
                  <div style={{ display:"grid", gridTemplateColumns:"60px 2fr 1fr 1fr 1fr", gap:16, padding:"10px 20px", background:"rgba(26,26,46,0.02)", borderBottom:"1px solid rgba(26,26,46,0.05)" }}>
                    {["Rank","Student","Score","Percentage","Grade"].map(h => (
                      <div key={h} style={{ fontSize:11, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</div>
                    ))}
                  </div>

                  {[...results]
                    .sort((a,b) => (b.percentage||0) - (a.percentage||0))
                    .map((r,i) => {
                      const g = getGrade(r.percentage||0);
                      const medals = ["🥇","🥈","🥉"];
                      return (
                        <div key={i} className="row" style={{ display:"grid", gridTemplateColumns:"60px 2fr 1fr 1fr 1fr", gap:16, padding:"14px 20px", borderBottom:"1px solid rgba(26,26,46,0.04)", alignItems:"center", transition:"all 0.15s", background: i===0 ? "rgba(255,215,0,0.04)" : "transparent" }}>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color: i<3 ? ["#FFD700","#C0C0C0","#CD7F32"][i] : "rgba(26,26,46,0.3)" }}>
                            {i < 3 ? medals[i] : `#${i+1}`}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:10, background:"rgba(108,99,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>👨‍🎓</div>
                            <div style={{ fontSize:14, fontWeight:600 }}>{r.student_name}</div>
                          </div>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#6C63FF" }}>{r.score}</div>
                          <div>
                            <div style={{ height:6, background:"rgba(26,26,46,0.06)", borderRadius:3, overflow:"hidden", marginBottom:4 }}>
                              <div style={{ height:"100%", background:g.color, borderRadius:3, width:`${r.percentage||0}%` }} />
                            </div>
                            <div style={{ fontSize:12, fontWeight:600, color:g.color }}>{r.percentage||0}%</div>
                          </div>
                          <div style={{ width:36, height:36, borderRadius:10, background:`${g.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:g.color }}>
                            {g.grade}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AdminReports;
