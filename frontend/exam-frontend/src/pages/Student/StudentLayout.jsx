import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", path: "/student/dashboard" },
  { icon: "📝", label: "My Exams", path: "/student/exams" },
  { icon: "📊", label: "Results", path: "/student/results" },
  { icon: "📈", label: "Performance", path: "/student/performance" },
  { icon: "👤", label: "Profile", path: "/student/profile" },
];

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const activeLabel = NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.label || "Dashboard";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        :root {
          --bg: #fff8f0;
          --surface: #ffffff;
          --border: rgba(255,107,107,0.15);
          --accent: #FF6B6B;
          --accent2: #FFD166;
          --text: #2e1a1a;
          --muted: rgba(46,26,26,0.45);
        }
        .student-root { display:flex; min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--text); }
        .sidebar { width:240px; min-height:100vh; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; transition:width 0.3s cubic-bezier(.4,0,.2,1); position:fixed; left:0; top:0; z-index:100; overflow:hidden; }
        .sidebar.collapsed { width:72px; }
        .sidebar-top { padding:24px 16px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:12px; min-height:72px; }
        .logo-icon { width:40px; height:40px; background:linear-gradient(135deg, #FF6B6B, #ee5a24); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; box-shadow:0 0 20px rgba(255,107,107,0.3); }
        .logo-text { font-family:'Syne',sans-serif; font-weight:800; font-size:18px; color:#2e1a1a; white-space:nowrap; opacity:1; transition:opacity 0.2s; }
        .collapsed .logo-text { opacity:0; }
        .collapse-btn { margin-left:auto; background:none; border:none; color:var(--muted); cursor:pointer; font-size:16px; padding:4px; border-radius:6px; flex-shrink:0; }
        .collapse-btn:hover { color:var(--accent); }
        .role-badge { margin:16px; padding:10px 12px; background:rgba(255,107,107,0.06); border:1px solid rgba(255,107,107,0.15); border-radius:10px; display:flex; align-items:center; gap:10px; overflow:hidden; }
        .role-avatar { width:32px; height:32px; background:linear-gradient(135deg, #FF6B6B, #ee5a24); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
        .role-name { font-size:13px; font-weight:600; white-space:nowrap; color:#2e1a1a; }
        .role-tag { font-size:10px; color:#FF6B6B; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; }
        .nav { flex:1; padding:8px 10px; }
        .nav-link { display:flex; align-items:center; gap:12px; padding:10px; border-radius:10px; text-decoration:none; color:var(--muted); font-size:14px; font-weight:500; transition:all 0.18s; margin-bottom:2px; white-space:nowrap; position:relative; overflow:hidden; }
        .nav-link:hover { background:rgba(255,107,107,0.06); color:var(--text); }
        .nav-link.active { background:rgba(255,107,107,0.1); color:#FF6B6B; }
        .nav-link.active::before { content:''; position:absolute; left:0; top:20%; bottom:20%; width:3px; background:#FF6B6B; border-radius:0 3px 3px 0; }
        .nav-icon { font-size:17px; flex-shrink:0; width:22px; text-align:center; }
        .nav-label { transition:opacity 0.2s; }
        .collapsed .nav-label { opacity:0; }
        .sidebar-bottom { padding:16px; border-top:1px solid var(--border); }
        .logout-btn { width:100%; padding:10px 12px; background:rgba(255,107,107,0.08); border:1px solid rgba(255,107,107,0.2); border-radius:10px; color:#FF6B6B; cursor:pointer; font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; transition:all 0.18s; white-space:nowrap; overflow:hidden; font-family:'DM Sans',sans-serif; }
        .logout-btn:hover { background:rgba(255,107,107,0.15); }
        .collapsed .nav-label, .collapsed .logout-text { opacity:0; }
        .main { margin-left:240px; flex:1; display:flex; flex-direction:column; transition:margin-left 0.3s cubic-bezier(.4,0,.2,1); min-height:100vh; }
        .main.collapsed { margin-left:72px; }
        .topbar { height:64px; background:var(--surface); border-bottom:1px solid var(--border); display:flex; align-items:center; padding:0 28px; gap:16px; position:sticky; top:0; z-index:50; }
        .topbar-right { margin-left:auto; display:flex; align-items:center; gap:16px; }
        .topbar-time { font-size:12px; color:var(--muted); background:#fff8f0; padding:6px 12px; border-radius:8px; border:1px solid var(--border); }
        .topbar-avatar { width:36px; height:36px; background:linear-gradient(135deg, #FF6B6B, #ee5a24); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:14px; border:2px solid rgba(255,107,107,0.3); }
        .page-content { flex:1; padding:28px; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,107,107,0.3); border-radius:2px; }
      `}</style>

      <div className="student-root">
        <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="sidebar-top">
            <div className="logo-icon">⛓️</div>
            <span className="logo-text">ExamChain</span>
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? "›" : "‹"}
            </button>
          </div>
          <div className="role-badge">
            <div className="role-avatar">👨‍🎓</div>
            <div>
              <div className="role-name">{localStorage.getItem("username") || "Student"}</div>
              <div className="role-tag">Student Portal</div>
            </div>
          </div>
          <nav className="nav">
            {NAV_ITEMS.map(item => (
              <Link key={item.path} to={item.path} className={`nav-link ${location.pathname.startsWith(item.path) ? "active" : ""}`}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button className="logout-btn" onClick={handleLogout}>
              <span>🚪</span>
              <span className="logout-text">Logout</span>
            </button>
          </div>
        </div>

        <div className={`main ${collapsed ? "collapsed" : ""}`}>
          <div className="topbar">
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#2e1a1a" }}>
              {activeLabel}
            </div>
            <div className="topbar-right">
              <div className="topbar-time">{time.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" })}</div>
              <div className="topbar-avatar">👨‍🎓</div>
            </div>
          </div>
          <div className="page-content"><Outlet /></div>
        </div>
      </div>
    </>
  );
};

export default StudentLayout;