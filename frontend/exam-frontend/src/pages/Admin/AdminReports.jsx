import React, { useState, useEffect } from "react";
import api from "../../services/api";

const DEPT_LABELS = {
  CS: "Computer Science", ECE: "Electronics", MECH: "Mechanical",
  CIVIL: "Civil", MBA: "MBA",
};

const AdminReports = () => {
  const [allExams, setAllExams]         = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedSem, setSelectedSem]   = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [results, setResults]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => { fetchExams(); }, []);
  useEffect(() => { if (selectedExam) fetchResults(selectedExam.id); }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const res = await api.get("/api/exams/");
      setAllExams(res.data.filter(e => e.workflow_status === "LOCKED"));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchResults = async (examId) => {
    setStatsLoading(true);
    setResults([]);
    try {
      const res = await api.get(`/api/exams/${examId}/staff-results/`);
      setResults(res.data);
    } catch (err) { setResults([]); }
    finally { setStatsLoading(false); }
  };

  // Derived
  const departments = [...new Set(allExams.map(e => e.department).filter(Boolean))];
  const semesters   = selectedDept
    ? [...new Set(allExams.filter(e => e.department === selectedDept).map(e => e.semester).filter(Boolean))].sort()
    : [];
  const examsForFilter = allExams.filter(e =>
    e.department === selectedDept && (!selectedSem || e.semester === selectedSem)
  );

  const handleDeptSelect = (dept) => {
    setSelectedDept(dept); setSelectedSem(null); setSelectedExam(null); setResults([]);
  };
  const handleSemSelect = (sem) => {
    setSelectedSem(sem); setSelectedExam(null); setResults([]);
  };

  // Stats
  const total    = results.length;
  const passed   = results.filter(r => (r.percentage||0) >= 50).length;
  const failed   = total - passed;
  const avg      = total > 0 ? Math.round(results.reduce((a,r) => a+(r.percentage||0),0)/total) : 0;
  const highest  = total > 0 ? Math.max(...results.map(r => r.score)) : 0;
  const passRate = total > 0 ? Math.round((passed/total)*100) : 0;

  const gradeDistribution = [
    { grade:"A+", range:"90-100", count: results.filter(r=>(r.percentage||0)>=90).length,                                          color:"#00C9A7" },
    { grade:"A",  range:"80-89",  count: results.filter(r=>(r.percentage||0)>=80&&(r.percentage||0)<90).length,                    color:"#6C63FF" },
    { grade:"B",  range:"70-79",  count: results.filter(r=>(r.percentage||0)>=70&&(r.percentage||0)<80).length,                    color:"#FFD166" },
    { grade:"C",  range:"60-69",  count: results.filter(r=>(r.percentage||0)>=60&&(r.percentage||0)<70).length,                    color:"#FF9F43" },
    { grade:"D",  range:"50-59",  count: results.filter(r=>(r.percentage||0)>=50&&(r.percentage||0)<60).length,                    color:"#FF6B6B" },
    { grade:"F",  range:"0-49",   count: results.filter(r=>(r.percentage||0)<50).length,                                           color:"#ee5a24" },
  ];

  const getGrade = (p) => {
    if (p >= 90) return { grade:"A+", color:"#00C9A7" };
    if (p >= 80) return { grade:"A",  color:"#6C63FF" };
    if (p >= 70) return { grade:"B",  color:"#FFD166" };
    if (p >= 60) return { grade:"C",  color:"#FF9F43" };
    if (p >= 50) return { grade:"D",  color:"#FF6B6B" };
    return { grade:"F", color:"#ee5a24" };
  };

  if (loading) return <div style={{ padding:40, textAlign:"center", fontFamily:"'DM Sans',sans-serif", color:"rgba(26,26,46,0.5)" }}>Loading...</div>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
        .sel-btn { transition: all 0.15s; cursor: pointer; }
        .sel-btn:hover { transform: translateY(-2px); filter: brightness(1.03); }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .row:hover { background: rgba(108,99,255,0.03) !important; }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a1a2e", maxWidth:1100 }}>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>📊 Reports & Analytics</div>
          <div style={{ fontSize:13, color:"rgba(26,26,46,0.45)" }}>Exam performance analytics filtered by department</div>
        </div>

        {allExams.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:16, padding:"60px 20px", textAlign:"center", color:"rgba(26,26,46,0.4)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>No completed exams yet</div>
          </div>
        ) : (
          <>
            {/* STEP 1 — Department */}
            <div className="fade-up" style={{ background:"#fff", borderRadius:16, padding:"20px 24px", marginBottom:16, border:"1px solid rgba(26,26,46,0.08)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.1em", marginBottom:14 }}>STEP 1 — SELECT DEPARTMENT</div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                {departments.map(dept => {
                  const isSelected = selectedDept === dept;
                  const count = allExams.filter(e => e.department === dept).length;
                  return (
                    <button key={dept} className="sel-btn" onClick={() => handleDeptSelect(dept)}
                      style={{ padding:"12px 20px", borderRadius:12, border: isSelected ? "2px solid #6C63FF" : "1px solid rgba(26,26,46,0.1)", background: isSelected ? "rgba(108,99,255,0.08)" : "#fff", textAlign:"left", minWidth:140 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color: isSelected ? "#6C63FF" : "#1a1a2e" }}>
                        {DEPT_LABELS[dept] || dept}
                      </div>
                      <div style={{ fontSize:11, color:"rgba(26,26,46,0.4)", marginTop:4 }}>📝 {count} exams</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2 — Semester */}
            {selectedDept && (
              <div className="fade-up" style={{ background:"#fff", borderRadius:16, padding:"20px 24px", marginBottom:16, border:"1px solid rgba(26,26,46,0.08)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.1em", marginBottom:14 }}>
                  STEP 2 — SELECT SEMESTER
                  <span style={{ marginLeft:8, fontSize:10, color:"#6C63FF", fontWeight:500 }}>{DEPT_LABELS[selectedDept]}</span>
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {semesters.map(sem => {
                    const isSelected = selectedSem === sem;
                    const count = allExams.filter(e => e.department === selectedDept && e.semester === sem).length;
                    return (
                      <button key={sem} className="sel-btn" onClick={() => handleSemSelect(sem)}
                        style={{ padding:"10px 20px", borderRadius:10, border: isSelected ? "2px solid #6C63FF" : "1px solid rgba(26,26,46,0.1)", background: isSelected ? "rgba(108,99,255,0.08)" : "#fff", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color: isSelected ? "#6C63FF" : "#1a1a2e", textAlign:"left" }}>
                        Semester {sem}
                        <div style={{ fontSize:10, color:"rgba(26,26,46,0.4)", marginTop:2, fontWeight:400 }}>{count} exams</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3 — Exam */}
            {selectedSem && (
              <div className="fade-up" style={{ background:"#fff", borderRadius:16, padding:"20px 24px", marginBottom:16, border:"1px solid rgba(26,26,46,0.08)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.1em", marginBottom:14 }}>
                  STEP 3 — SELECT EXAM
                  <span style={{ marginLeft:8, fontSize:10, color:"#6C63FF", fontWeight:500 }}>{DEPT_LABELS[selectedDept]} · Sem {selectedSem}</span>
                </div>
                {examsForFilter.length === 0 ? (
                  <div style={{ fontSize:13, color:"rgba(26,26,46,0.4)", padding:"12px 0" }}>No exams for this filter</div>
                ) : (
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {examsForFilter.map(exam => {
                      const isSelected = selectedExam?.id === exam.id;
                      return (
                        <button key={exam.id} className="sel-btn" onClick={() => setSelectedExam(exam)}
                          style={{ padding:"12px 20px", borderRadius:12, border: isSelected ? "2px solid #FF6B6B" : "1px solid rgba(26,26,46,0.1)", background: isSelected ? "rgba(255,107,107,0.06)" : "#fff", textAlign:"left", minWidth:160 }}>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color: isSelected ? "#FF6B6B" : "#1a1a2e" }}>{exam.exam_name}</div>
                          <div style={{ fontSize:11, color:"rgba(26,26,46,0.4)", marginTop:3 }}>📅 {exam.exam_date}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Breadcrumb */}
            {selectedExam && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, fontSize:12, color:"rgba(26,26,46,0.5)" }}>
                <span style={{ cursor:"pointer", color:"#6C63FF" }} onClick={() => { setSelectedDept(null); setSelectedSem(null); setSelectedExam(null); setResults([]); }}>All Depts</span>
                <span>›</span>
                <span style={{ cursor:"pointer", color:"#6C63FF" }} onClick={() => { setSelectedSem(null); setSelectedExam(null); setResults([]); }}>{DEPT_LABELS[selectedDept]}</span>
                <span>›</span>
                <span style={{ cursor:"pointer", color:"#6C63FF" }} onClick={() => { setSelectedExam(null); setResults([]); }}>Semester {selectedSem}</span>
                <span>›</span>
                <span style={{ fontWeight:700, color:"#1a1a2e" }}>{selectedExam.exam_name}</span>
              </div>
            )}

            {/* Results */}
            {selectedExam && (
              statsLoading ? (
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
                      { label:"Students",  value:total,         icon:"👨‍🎓", color:"#6C63FF" },
                      { label:"Passed",    value:passed,        icon:"✅",   color:"#00C9A7" },
                      { label:"Failed",    value:failed,        icon:"❌",   color:"#FF6B6B" },
                      { label:"Pass Rate", value:`${passRate}%`,icon:"📈",   color:"#00C9A7" },
                      { label:"Avg Score", value:`${avg}%`,     icon:"📊",   color:"#FFD166" },
                      { label:"Highest",   value:highest,       icon:"🏆",   color:"#FFD166" },
                    ].map((s,i) => (
                      <div key={i} className="fade-up" style={{ background:"#fff", border:`1px solid ${s.color}22`, borderRadius:14, padding:"16px", animationDelay:`${i*0.05}s` }}>
                        <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
                        <div style={{ fontSize:11, color:"rgba(26,26,46,0.45)", marginTop:2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pass/Fail + Grade Distribution */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
                    <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:24 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:20 }}>✅ Pass / Fail Ratio</div>
                      <div style={{ height:24, borderRadius:12, overflow:"hidden", display:"flex", marginBottom:16 }}>
                        <div style={{ width:`${passRate}%`, background:"#00C9A7", transition:"width 1s ease" }} />
                        <div style={{ flex:1, background:"#FF6B6B" }} />
                      </div>
                      <div style={{ display:"flex", gap:16 }}>
                        {[{ label:"Passed", value:passed, pct:passRate, color:"#00C9A7" }, { label:"Failed", value:failed, pct:100-passRate, color:"#FF6B6B" }].map((item,i) => (
                          <div key={i} style={{ flex:1, padding:"14px", background:`${item.color}08`, border:`1px solid ${item.color}22`, borderRadius:10, textAlign:"center" }}>
                            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:item.color }}>{item.value}</div>
                            <div style={{ fontSize:12, color:"rgba(26,26,46,0.5)", marginTop:2 }}>{item.label} ({item.pct}%)</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:24 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:20 }}>📊 Grade Distribution</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {gradeDistribution.map((g,i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:28, height:28, borderRadius:6, background:`${g.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:800, color:g.color, flexShrink:0 }}>{g.grade}</div>
                            <div style={{ fontSize:11, color:"rgba(26,26,46,0.4)", width:52, flexShrink:0 }}>{g.range}%</div>
                            <div style={{ flex:1, height:8, background:"rgba(26,26,46,0.05)", borderRadius:4, overflow:"hidden" }}>
                              <div style={{ height:"100%", background:g.color, borderRadius:4, width:`${total>0?(g.count/total)*100:0}%`, transition:"width 1s ease" }} />
                            </div>
                            <div style={{ fontSize:13, fontWeight:700, color:g.color, width:20, textAlign:"right", flexShrink:0 }}>{g.count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Score Bar Chart */}
                  <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:24, marginBottom:20 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:20 }}>📈 Student Score Overview</div>
                    <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120, paddingBottom:8, borderBottom:"1px solid rgba(26,26,46,0.06)" }}>
                      {results.map((r,i) => {
                        const pct = r.percentage||0;
                        const g = getGrade(pct);
                        return (
                          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                            <div style={{ fontSize:9, color:g.color, fontWeight:700 }}>{pct}%</div>
                            <div style={{ width:"100%", background:g.color, borderRadius:"4px 4px 0 0", height:`${pct}%`, maxHeight:90, minHeight:4, opacity:0.85 }} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:"flex", gap:8, marginTop:8 }}>
                      {results.map((r,i) => (
                        <div key={i} style={{ flex:1, fontSize:9, color:"rgba(26,26,46,0.4)", textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {r.student_name?.split(" ")[0]||`S${i+1}`}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leaderboard */}
                  <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, overflow:"hidden" }}>
                    <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(26,26,46,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>🏆 Leaderboard — {selectedExam.exam_name}</div>
                      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                        <span style={{ fontSize:12, color:"rgba(26,26,46,0.4)" }}>🏛️ {DEPT_LABELS[selectedDept]} · Sem {selectedSem}</span>
                        <span style={{ fontSize:12, color:"rgba(26,26,46,0.4)" }}>{total} students</span>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"60px 2fr 1fr 1fr 1fr", gap:16, padding:"10px 20px", background:"rgba(26,26,46,0.02)", borderBottom:"1px solid rgba(26,26,46,0.05)" }}>
                      {["Rank","Student","Score","Percentage","Grade"].map(h => (
                        <div key={h} style={{ fontSize:11, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {[...results].sort((a,b)=>(b.percentage||0)-(a.percentage||0)).map((r,i) => {
                      const g = getGrade(r.percentage||0);
                      return (
                        <div key={i} className="row" style={{ display:"grid", gridTemplateColumns:"60px 2fr 1fr 1fr 1fr", gap:16, padding:"14px 20px", borderBottom:"1px solid rgba(26,26,46,0.04)", alignItems:"center", background: i===0?"rgba(255,215,0,0.04)":"transparent" }}>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color: i<3?["#FFD700","#C0C0C0","#CD7F32"][i]:"rgba(26,26,46,0.3)" }}>
                            {i<3?["🥇","🥈","🥉"][i]:`#${i+1}`}
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
              )
            )}

            {!selectedDept && (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"rgba(26,26,46,0.4)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🏛️</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>Select a department to view reports</div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AdminReports;