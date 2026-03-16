import React, { useState, useEffect } from "react";
import api from "../../services/api";

const ACTION_ICONS = {
  CREATE_EXAM:     "📝",
  APPROVE_EXAM:    "✅",
  LOCK_PAPER:      "🔒",
  SUBMIT_EXAM:     "📤",
  PUBLISH_RESULT:  "📢",
  ENROLL_STUDENT:  "👨‍🎓",
  ADD_QUESTION:    "❓",
  REJECT_EXAM:     "❌",
  UPDATE_EXAM:     "✏️",
  SUBMIT_APPROVAL: "📋",
  APPROVE_QUESTION:"✅",
  REJECT_QUESTION: "❌",
  DELETE_QUESTION: "🗑️",
  LOGIN:           "🔑",
  CREATE_USER:     "👤",
  TOGGLE_USER:     "🔄",
};

const ACTION_COLORS = {
  CREATE_EXAM:     "#6C63FF",
  APPROVE_EXAM:    "#00C9A7",
  LOCK_PAPER:      "#6C63FF",
  SUBMIT_EXAM:     "#FFD166",
  PUBLISH_RESULT:  "#00C9A7",
  ENROLL_STUDENT:  "#6C63FF",
  ADD_QUESTION:    "#FFD166",
  REJECT_EXAM:     "#FF6B6B",
  UPDATE_EXAM:     "#FFD166",
  SUBMIT_APPROVAL: "#FFD166",
  APPROVE_QUESTION:"#00C9A7",
  REJECT_QUESTION: "#FF6B6B",
  DELETE_QUESTION: "#FF6B6B",
  LOGIN:           "#94a3b8",
  CREATE_USER:     "#6C63FF",
  TOGGLE_USER:     "#FF6B6B",
};

const AdminAuditLogs = () => {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterUser, setFilterUser]     = useState("ALL");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/audit-logs/");
      setLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  const uniqueActions = ["ALL", ...new Set(logs.map(l => l.action).filter(Boolean))];
  const uniqueUsers   = ["ALL", ...new Set(logs.map(l => l.user).filter(Boolean))];

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      log.description?.toLowerCase().includes(search.toLowerCase()) ||
      log.user?.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === "ALL" || log.action === filterAction;
    const matchUser   = filterUser   === "ALL" || log.user   === filterUser;
    return matchSearch && matchAction && matchUser;
  });

  // Stats
  const todayLogs = logs.filter(l => {
    const d = new Date(l.timestamp);
    const n = new Date();
    return d.getDate()===n.getDate() && d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear();
  });

  const actionCounts = logs.reduce((acc, l) => {
    acc[l.action] = (acc[l.action] || 0) + 1;
    return acc;
  }, {});

  const topAction = Object.entries(actionCounts).sort((a,b) => b[1]-a[1])[0];

  if (loading) return (
    <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", color:"#8F80C9" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📜</div>
        <div>Loading audit logs...</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.3s ease both }
        .log-row { transition: background 0.15s; }
        .log-row:hover { background: #F5F2FF !important; }
        select:focus, input:focus { outline: none; border-color: #6C63FF !important; box-shadow: 0 0 0 3px rgba(108,99,255,0.1); }
      `}</style>

      <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#4B2E83", maxWidth:1100 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:"#5A3EC8", marginBottom:4 }}>
              📜 Audit Logs
            </div>
            <div style={{ fontSize:13, color:"#8F80C9" }}>
              Complete activity history across the system
            </div>
          </div>
          <button onClick={fetchLogs}
            style={{ padding:"8px 16px", background:"#EFE9FF", border:"1px solid #D8CFFF", borderRadius:8, color:"#5A3EC8", cursor:"pointer", fontWeight:600, fontSize:13 }}>
            ↻ Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
          {[
            { icon:"📊", label:"Total Logs",    value:logs.length,           color:"#6C63FF", bg:"#EFE9FF" },
            { icon:"📅", label:"Today",         value:todayLogs.length,      color:"#00C9A7", bg:"#E6FFFB" },
            { icon:"👥", label:"Active Users",  value:uniqueUsers.length-1,  color:"#FFD166", bg:"#FFF7E0" },
            { icon:"🏆", label:"Top Action",    value:topAction?.[0] || "—", color:"#FF6584", bg:"#FFE9EF" },
          ].map((s, i) => (
            <div key={i} style={{ background:"#fff", borderRadius:14, padding:"18px 20px", border:`1px solid ${s.color}22`, boxShadow:"0 2px 8px rgba(108,99,255,0.06)" }}>
              <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, marginBottom:10 }}>
                {s.icon}
              </div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:i===3?14:24, fontWeight:800, color:s.color, marginBottom:2 }}>{s.value}</div>
              <div style={{ fontSize:11, color:"#8F80C9" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="fade-up" style={{ background:"#fff", borderRadius:14, padding:"16px 20px", marginBottom:20, border:"1px solid #E6E0F8", display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by user or description..."
            style={{ flex:1, minWidth:200, padding:"9px 14px", borderRadius:10, border:"1px solid #E6E0F8", fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#4B2E83" }}
          />

          {/* Action filter */}
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            style={{ padding:"9px 14px", borderRadius:10, border:"1px solid #E6E0F8", fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#4B2E83", background:"#fff", minWidth:160 }}>
            {uniqueActions.map(a => (
              <option key={a} value={a}>{a === "ALL" ? "All Actions" : a}</option>
            ))}
          </select>

          {/* User filter */}
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
            style={{ padding:"9px 14px", borderRadius:10, border:"1px solid #E6E0F8", fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#4B2E83", background:"#fff", minWidth:140 }}>
            {uniqueUsers.map(u => (
              <option key={u} value={u}>{u === "ALL" ? "All Users" : u}</option>
            ))}
          </select>

          {/* Clear */}
          {(search || filterAction !== "ALL" || filterUser !== "ALL") && (
            <button onClick={() => { setSearch(""); setFilterAction("ALL"); setFilterUser("ALL"); }}
              style={{ padding:"9px 14px", borderRadius:10, border:"1px solid rgba(255,107,107,0.3)", background:"rgba(255,107,107,0.06)", color:"#FF6B6B", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              ✕ Clear
            </button>
          )}

          <div style={{ fontSize:12, color:"#8F80C9", marginLeft:"auto" }}>
            {filtered.length} of {logs.length} entries
          </div>
        </div>

        {/* Logs Table */}
        <div className="fade-up" style={{ background:"#fff", borderRadius:16, border:"1px solid #E6E0F8", overflow:"hidden", boxShadow:"0 4px 12px rgba(108,99,255,0.06)" }}>

          {/* Table Header */}
          <div style={{ display:"grid", gridTemplateColumns:"50px 140px 180px 1fr 120px", gap:12, padding:"12px 20px", background:"#F5F2FF", borderBottom:"1px solid #E6E0F8" }}>
            {["#", "ACTION", "USER", "DESCRIPTION", "TIME"].map(h => (
              <div key={h} style={{ fontSize:10, fontWeight:700, color:"#8F80C9", letterSpacing:"0.08em" }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"#8F80C9" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700 }}>No logs found</div>
              <div style={{ fontSize:12, marginTop:6 }}>Try adjusting your filters</div>
            </div>
          ) : (
            filtered.map((log, i) => {
              const icon  = ACTION_ICONS[log.action]  || "⚙️";
              const color = ACTION_COLORS[log.action] || "#94a3b8";
              return (
                <div key={i} className="log-row"
                  style={{ display:"grid", gridTemplateColumns:"50px 140px 180px 1fr 120px", gap:12, padding:"14px 20px", borderBottom:"1px solid rgba(26,26,46,0.04)", alignItems:"center" }}>

                  {/* # */}
                  <div style={{ fontSize:12, fontWeight:700, color:"#C4B8F0" }}>#{i+1}</div>

                  {/* Action */}
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                      {icon}
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, padding:"3px 7px", borderRadius:20, background:`${color}12`, color, whiteSpace:"nowrap" }}>
                      {log.action || "—"}
                    </span>
                  </div>

                  {/* User */}
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"#EFE9FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>
                      👤
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:"#5A3EC8" }}>{log.user || "System"}</span>
                  </div>

                  {/* Description */}
                  <div style={{ fontSize:12, color:"#6B5CA5", lineHeight:1.5 }}>{log.description || "—"}</div>

                  {/* Time */}
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#8F80C9" }}>{timeAgo(log.timestamp)}</div>
                    <div style={{ fontSize:10, color:"#B0A6D8", marginTop:2 }}>
                      {new Date(log.timestamp).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                    </div>
                    <div style={{ fontSize:10, color:"#C4B8F0" }}>
                      {new Date(log.timestamp).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </>
  );
};

export default AdminAuditLogs;