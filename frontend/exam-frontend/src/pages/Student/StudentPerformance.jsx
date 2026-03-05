import React, { useState, useEffect } from "react";
import api from "../../services/api";

const StudentPerformance = () => {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const examsRes = await api.get("/api/exams/");
      const completed = examsRes.data.filter(e => e.status === "SUBMITTED");
      setExams(completed);

      const resultPromises = completed.map(e =>
        api.get(`/api/exams/${e.id}/my-result/`)
          .then(r => ({ ...r.data, exam_id: e.id }))
          .catch(() => null)
      );
      const allResults = (await Promise.all(resultPromises)).filter(Boolean);
      setResults(allResults);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const avg = results.length > 0
    ? Math.round(results.reduce((a,r) => a + (r.percentage||0), 0) / results.length)
    : 0;
  const passed = results.filter(r => (r.percentage||0) >= 50).length;
  const failed = results.filter(r => (r.percentage||0) < 50).length;
  const best = results.length > 0 ? results.reduce((a,b) => (a.percentage||0) > (b.percentage||0) ? a : b) : null;

  const getGrade = (p) => {
    if (p >= 90) return { grade:"A+", color:"#00C9A7" };
    if (p >= 80) return { grade:"A",  color:"#00C9A7" };
    if (p >= 70) return { grade:"B",  color:"#6C63FF" };
    if (p >= 60) return { grade:"C",  color:"#FFD166" };
    if (p >= 50) return { grade:"D",  color:"#FFD166" };
    return { grade:"F", color:"#FF6B6B" };
  };

  if (loading) return (
    <div style={{ padding:40, textAlign:"center", color:"rgba(46,26,26,0.5)", fontFamily:"'DM Sans',sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes barGrow { from { width:0; } to { width:var(--w); } }
        .fade-up { animation: fadeUp 0.3s ease both; }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#2e1a1a", maxWidth:900 }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>📈 Performance</div>
          <div style={{ fontSize:13, color:"rgba(46,26,26,0.45)" }}>Your academic performance overview</div>
        </div>

        {results.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:16, padding:"60px 20px", textAlign:"center", color:"rgba(46,26,26,0.4)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>No performance data yet</div>
            <div style={{ fontSize:13, marginTop:4 }}>Complete exams to see your performance!</div>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
              {[
                { label:"Avg Score",    value:`${avg}%`,      icon:"📊", color:"#FF6B6B" },
                { label:"Exams Done",   value:results.length, icon:"📝", color:"#6C63FF" },
                { label:"Passed",       value:passed,         icon:"✅", color:"#00C9A7" },
                { label:"Failed",       value:failed,         icon:"❌", color:"#FF6B6B" },
              ].map((s,i) => (
                <div key={i} className="fade-up" style={{ background:"#fff", border:`1px solid ${s.color}22`, borderRadius:14, padding:"20px", animationDelay:`${i*0.07}s` }}>
                  <div style={{ fontSize:24, marginBottom:10 }}>{s.icon}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:12, color:"rgba(46,26,26,0.45)", marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Best Performance */}
            {best && (
              <div className="fade-up" style={{ background:"linear-gradient(135deg, #FF6B6B, #ee5a24)", borderRadius:16, padding:24, marginBottom:20, color:"#fff", display:"flex", alignItems:"center", gap:20 }}>
                <div style={{ fontSize:48 }}>🏆</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, opacity:0.8, marginBottom:4 }}>BEST PERFORMANCE</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:4 }}>{best.exam}</div>
                  <div style={{ fontSize:14, opacity:0.85 }}>Score: {best.score} pts · {best.percentage}%</div>
                </div>
                <div style={{ marginLeft:"auto", fontFamily:"'Syne',sans-serif", fontSize:48, fontWeight:800, opacity:0.9 }}>
                  {getGrade(best.percentage||0).grade}
                </div>
              </div>
            )}

            {/* Pass/Fail Chart */}
            <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(255,107,107,0.1)", borderRadius:16, padding:24, marginBottom:20, animationDelay:"0.1s" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:20 }}>📊 Pass / Fail Overview</div>
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#00C9A7" }}>✅ Passed</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#00C9A7" }}>{passed}</span>
                  </div>
                  <div style={{ height:12, background:"rgba(0,201,167,0.1)", borderRadius:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", background:"#00C9A7", borderRadius:6, width:`${results.length > 0 ? (passed/results.length)*100 : 0}%`, transition:"width 1s ease" }} />
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:"#FF6B6B" }}>❌ Failed</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#FF6B6B" }}>{failed}</span>
                  </div>
                  <div style={{ height:12, background:"rgba(255,107,107,0.1)", borderRadius:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", background:"#FF6B6B", borderRadius:6, width:`${results.length > 0 ? (failed/results.length)*100 : 0}%`, transition:"width 1s ease" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Score History */}
            <div className="fade-up" style={{ background:"#fff", border:"1px solid rgba(255,107,107,0.1)", borderRadius:16, padding:24, animationDelay:"0.2s" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:20 }}>📋 Exam History</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {results.map((r, i) => {
                  const g = getGrade(r.percentage||0);
                  return (
                    <div key={i} className="fade-up" style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:"rgba(46,26,26,0.02)", border:"1px solid rgba(46,26,26,0.07)", borderRadius:12, animationDelay:`${i*0.05}s` }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:`${g.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:g.color, flexShrink:0 }}>
                        {g.grade}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>{r.exam}</div>
                        <div style={{ height:6, background:"rgba(46,26,26,0.06)", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", background:g.color, borderRadius:3, width:`${r.percentage||0}%`, transition:"width 1s ease" }} />
                        </div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:g.color }}>{r.percentage||0}%</div>
                        <div style={{ fontSize:11, color:"rgba(46,26,26,0.4)" }}>{r.score} pts</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default StudentPerformance;