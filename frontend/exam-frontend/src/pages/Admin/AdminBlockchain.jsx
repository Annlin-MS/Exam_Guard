import React, { useState, useEffect } from "react";
import api from "../../services/api";

const AdminBlockchain = () => {
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [verifyExamId, setVerifyExamId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [resultExamId, setResultExamId] = useState("");
  const [resultVerify, setResultVerify] = useState(null);
  const [resultVerifying, setResultVerifying] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/api/admin/blockchain-status/");
      setStatus(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyExamId) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.get(`/api/exams/${verifyExamId}/verify/`);
      setVerifyResult(res.data);
    } catch (err) {
      setVerifyResult({ status: "ERROR", message: err.response?.data?.error || "Verification failed" });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyResult = async () => {
    if (!resultExamId) return;
    setResultVerifying(true);
    setResultVerify(null);
    try {
      const res = await api.get(`/api/admin/results/${resultExamId}/verify-hash/`);
      setResultVerify(res.data);
    } catch (err) {
      setResultVerify({ error: err.response?.data?.error || "Verification failed" });
    } finally {
      setResultVerifying(false);
    }
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "rgba(26,26,46,0.5)", fontFamily: "'DM Sans',sans-serif" }}>
      Loading...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,201,167,0.4); } 50% { box-shadow: 0 0 0 8px rgba(0,201,167,0); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        .fade-card { animation: fadeUp 0.3s ease both; }
        .act-btn { transition: all 0.15s; cursor: pointer; }
        .act-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        input:focus { outline: none; border-color: #6C63FF !important; box-shadow: 0 0 0 3px rgba(108,99,255,0.1); }
        .hash-text { font-family: 'JetBrains Mono', monospace; font-size: 12px; word-break: break-all; }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#1a1a2e", maxWidth:1000 }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:4 }}>⛓️ Blockchain Monitor</div>
          <div style={{ fontSize:13, color:"rgba(26,26,46,0.45)" }}>Real-time Ganache blockchain status and integrity verification</div>
        </div>

        {/* Connection Status Card */}
        <div className="fade-card" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:24, marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700 }}>🔌 Connection Status</div>
            <button className="act-btn" onClick={fetchStatus} style={{ padding:"7px 14px", borderRadius:8, border:"1px solid rgba(26,26,46,0.15)", background:"transparent", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              ↻ Refresh
            </button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {/* Connected */}
            <div style={{ background: status.connected ? "rgba(0,201,167,0.06)" : "rgba(255,107,107,0.06)", border: `1px solid ${status.connected ? "rgba(0,201,167,0.2)" : "rgba(255,107,107,0.2)"}`, borderRadius:12, padding:20, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>{status.connected ? "🟢" : "🔴"}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color: status.connected ? "#00C9A7" : "#FF6B6B" }}>
                {status.connected ? "Connected" : "Disconnected"}
              </div>
              <div style={{ fontSize:11, color:"rgba(26,26,46,0.4)", marginTop:4 }}>Ganache Network</div>
              {status.connected && (
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#00C9A7", margin:"10px auto 0", animation:"pulse 2s infinite" }} />
              )}
            </div>

            {/* Block Number */}
            <div style={{ background:"rgba(108,99,255,0.06)", border:"1px solid rgba(108,99,255,0.15)", borderRadius:12, padding:20, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📦</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:"#6C63FF" }}>
                #{status.current_block ?? "—"}
              </div>
              <div style={{ fontSize:11, color:"rgba(26,26,46,0.4)", marginTop:4 }}>Current Block</div>
            </div>

            {/* Network */}
            <div style={{ background:"rgba(255,209,102,0.06)", border:"1px solid rgba(255,209,102,0.2)", borderRadius:12, padding:20, textAlign:"center" }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🌐</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#FFD166" }}>
                Ganache Local
              </div>
              <div style={{ fontSize:11, color:"rgba(26,26,46,0.4)", marginTop:4 }}>http://127.0.0.1:7545</div>
            </div>
          </div>

          {/* Admin Account */}
          <div style={{ marginTop:16, padding:"14px 16px", background:"rgba(26,26,46,0.03)", border:"1px solid rgba(26,26,46,0.08)", borderRadius:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.08em", marginBottom:6 }}>ADMIN WALLET ADDRESS</div>
            <div className="hash-text" style={{ color:"#6C63FF" }}>{status.admin_account || "Not connected"}</div>
          </div>
        </div>

        {/* Verify Question Paper */}
        <div className="fade-card" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:24, marginBottom:20, animationDelay:"0.1s" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:6 }}>🔍 Verify Question Paper Integrity</div>
          <div style={{ fontSize:13, color:"rgba(26,26,46,0.5)", marginBottom:20 }}>
            Enter an Exam ID to verify the question paper hash stored on blockchain matches the database
          </div>

          <div style={{ display:"flex", gap:12, marginBottom:20 }}>
            <input
              type="number"
              placeholder="Enter Exam ID (e.g. 1)"
              value={verifyExamId}
              onChange={e => setVerifyExamId(e.target.value)}
              style={{ flex:1, padding:"11px 16px", border:"1px solid rgba(26,26,46,0.15)", borderRadius:10, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }}
            />
            <button className="act-btn" onClick={handleVerify} disabled={verifying || !verifyExamId}
              style={{ padding:"11px 28px", background:"#6C63FF", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(108,99,255,0.3)", opacity: (!verifyExamId || verifying) ? 0.6 : 1 }}>
              {verifying ? "Verifying..." : "🔍 Verify"}
            </button>
          </div>

          {verifyResult && (
            <div style={{ padding:20, borderRadius:12, background: verifyResult.status === "VERIFIED" ? "rgba(0,201,167,0.06)" : "rgba(255,107,107,0.06)", border: `1px solid ${verifyResult.status === "VERIFIED" ? "rgba(0,201,167,0.25)" : "rgba(255,107,107,0.25)"}`, animation:"fadeUp 0.3s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <span style={{ fontSize:24 }}>{verifyResult.status === "VERIFIED" ? "✅" : "❌"}</span>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color: verifyResult.status === "VERIFIED" ? "#00C9A7" : "#FF6B6B" }}>
                  {verifyResult.status === "VERIFIED" ? "Integrity Verified!" : "Tampering Detected!"}
                </div>
              </div>
              <div style={{ fontSize:13, color:"rgba(26,26,46,0.6)" }}>{verifyResult.message}</div>
            </div>
          )}
        </div>

        {/* Verify Result Integrity */}
        <div className="fade-card" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:24, marginBottom:20, animationDelay:"0.15s" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:6 }}>📊 Verify Result Integrity</div>
          <div style={{ fontSize:13, color:"rgba(26,26,46,0.5)", marginBottom:20 }}>
            Enter an Exam ID to verify all student result hashes on blockchain match the database
          </div>

          <div style={{ display:"flex", gap:12, marginBottom:20 }}>
            <input
              type="number"
              placeholder="Enter Exam ID (e.g. 1)"
              value={resultExamId}
              onChange={e => { setResultExamId(e.target.value); setResultVerify(null); }}
              style={{ flex:1, padding:"11px 16px", border:"1px solid rgba(26,26,46,0.15)", borderRadius:10, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }}
            />
            <button className="act-btn" onClick={handleVerifyResult} disabled={resultVerifying || !resultExamId}
              style={{ padding:"11px 28px", background:"#6C63FF", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 12px rgba(108,99,255,0.3)", opacity: (!resultExamId || resultVerifying) ? 0.6 : 1 }}>
              {resultVerifying ? "Verifying..." : "🔍 Verify Results"}
            </button>
          </div>

          {resultVerify && (
            <div style={{ animation:"fadeUp 0.3s ease" }}>
              {resultVerify.error ? (
                <div style={{ padding:20, borderRadius:12, background:"rgba(255,107,107,0.06)", border:"1px solid rgba(255,107,107,0.25)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:24 }}>❌</span>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:"#FF6B6B" }}>
                      {resultVerify.error}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding:20, borderRadius:12, background: resultVerify.all_valid ? "rgba(0,201,167,0.06)" : "rgba(255,107,107,0.06)", border:`1px solid ${resultVerify.all_valid ? "rgba(0,201,167,0.25)" : "rgba(255,107,107,0.25)"}` }}>

                  {/* Summary */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                    <span style={{ fontSize:24 }}>{resultVerify.all_valid ? "✅" : "⚠️"}</span>
                    <div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color: resultVerify.all_valid ? "#00C9A7" : "#FF6B6B" }}>
                        {resultVerify.all_valid ? "All Results NOT Tampered!" : "TAMPERED — Hash Mismatch Detected!"}
                      </div>
                      <div style={{ fontSize:13, color:"rgba(26,26,46,0.5)" }}>
                        {resultVerify.results?.length} student result(s) verified · Exam: {resultVerify.exam}
                      </div>
                    </div>
                  </div>

                  {/* Per Student Results */}
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {resultVerify.results?.map((r, i) => {
                      const valid = !r.tampered;
                      return (
                        <div key={i} style={{ padding:"14px 16px", background: valid ? "rgba(0,201,167,0.04)" : "rgba(255,107,107,0.04)", border:`1px solid ${valid ? "rgba(0,201,167,0.15)" : "rgba(255,107,107,0.2)"}`, borderRadius:10 }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:32, height:32, borderRadius:8, background:"rgba(108,99,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>👨‍🎓</div>
                              <div>
                                <div style={{ fontSize:13, fontWeight:600 }}>{r.student}</div>
                                <div style={{ fontSize:11, color:"rgba(26,26,46,0.45)" }}>Roll: {r.roll_number} · Score: {r.score}/{r.total_marks} · {r.percentage}%</div>
                              </div>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, background: r.is_published ? "rgba(0,201,167,0.1)" : "rgba(255,209,102,0.1)", color: r.is_published ? "#00C9A7" : "#FFD166" }}>
                                {r.is_published ? "✅ Published" : "⏳ Pending"}
                              </span>
                              <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, background: valid ? "rgba(0,201,167,0.1)" : "rgba(255,107,107,0.1)", color: valid ? "#00C9A7" : "#FF6B6B" }}>
                                {valid ? "✅ Valid" : "❌ Tampered!"}
                              </span>
                            </div>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                            <div style={{ padding:"8px 10px", background:"rgba(26,26,46,0.03)", borderRadius:8 }}>
                              <div style={{ fontSize:9, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.06em", marginBottom:4 }}>STORED HASH (DB)</div>
                              <div className="hash-text" style={{ color:"#6C63FF", fontSize:10 }}>{r.stored_hash?.substring(0,40)}...</div>
                            </div>
                            <div style={{ padding:"8px 10px", background:"rgba(26,26,46,0.03)", borderRadius:8, border:`1px solid ${r.db_match ? "rgba(0,201,167,0.15)" : "rgba(255,107,107,0.15)"}` }}>
                              <div style={{ fontSize:9, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.06em", marginBottom:4 }}>
                                RECOMPUTED HASH <span style={{ color: r.db_match ? "#00C9A7" : "#FF6B6B" }}>{r.db_match ? "✓" : "✗"}</span>
                              </div>
                              <div className="hash-text" style={{ color: r.db_match ? "#00C9A7" : "#FF6B6B", fontSize:10 }}>{r.recomputed_hash?.substring(0,40)}...</div>
                            </div>
                            <div style={{ padding:"8px 10px", background:"rgba(26,26,46,0.03)", borderRadius:8, border:`1px solid ${r.chain_match ? "rgba(0,201,167,0.15)" : "rgba(255,107,107,0.15)"}` }}>
                              <div style={{ fontSize:9, fontWeight:700, color:"rgba(26,26,46,0.4)", letterSpacing:"0.06em", marginBottom:4 }}>
                                BLOCKCHAIN HASH <span style={{ color: r.chain_match ? "#00C9A7" : "#FF6B6B" }}>{r.chain_match ? "✓" : "✗"}</span>
                              </div>
                              <div className="hash-text" style={{ color: r.chain_match ? "#00C9A7" : "#FF6B6B", fontSize:10 }}>
                                {r.chain_hash && !r.chain_hash.startsWith("Blockchain") ? `${r.chain_hash.substring(0,40)}...` : (r.chain_hash || "—")}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        {/* How it Works */}
        <div className="fade-card" style={{ background:"#fff", border:"1px solid rgba(26,26,46,0.08)", borderRadius:16, padding:24, animationDelay:"0.2s" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:20 }}>⚙️ How Blockchain Security Works</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {[
              { step:"01", icon:"📝", title:"Questions Created",  desc:"Staff creates MCQ questions for the exam" },
              { step:"02", icon:"🔐", title:"Hash Generated",     desc:"SHA-256 hash of all questions generated" },
              { step:"03", icon:"⛓️", title:"Stored on Chain",   desc:"Hash stored permanently on Ganache blockchain" },
              { step:"04", icon:"✅", title:"Verified Anytime",   desc:"Anyone can verify integrity by comparing hashes" },
            ].map((item, i) => (
              <div key={i} style={{ textAlign:"center", padding:16, background:"rgba(108,99,255,0.03)", borderRadius:12, border:"1px solid rgba(108,99,255,0.08)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(108,99,255,0.5)", letterSpacing:"0.1em", marginBottom:8 }}>STEP {item.step}</div>
                <div style={{ fontSize:28, marginBottom:8 }}>{item.icon}</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, marginBottom:6 }}>{item.title}</div>
                <div style={{ fontSize:12, color:"rgba(26,26,46,0.5)", lineHeight:1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default AdminBlockchain;