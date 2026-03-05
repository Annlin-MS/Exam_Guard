import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", path: "/staff/dashboard" },
  { icon: "📝", label: "My Exams", path: "/staff/exams" },
  { icon: "❓", label: "Questions", path: "/staff/questions" },
  { icon: "🔒", label: "Lock Paper", path: "/staff/lock" },
  { icon: "📊", label: "Results", path: "/staff/results" },
  { icon: "👤", label: "Profile", path: "/staff/profile" },
];

const StaffLayout = () => {
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
          --bg: #f0faf8;
          --surface: #ffffff;
          --surface2: #f5fffe;
          --border: rgba(0,201,167,0.15);
          --accent: #00C9A7;
          --accent2: #FFD166;
          --text: #1a2e2a;
          --muted: rgba(26,46,42,0.45);
          --sidebar-w: 240px;
          --sidebar-collapsed: 72px;
        }
        .staff-root { display:flex; min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--text); }
        .sidebar { width:var(--sidebar-w); min-height:100vh; background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; transition:width 0.3s cubic-bezier(.4,0,.2,1); position:fixed; left:0; top:0; z-index:100; overflow:hidden; }
        .sidebar.collapsed { width:var(--sidebar-collapsed); }
        .sidebar-top { padding:24px 16px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:12px; min-height:72px; }
        .logo-icon { width:40px; height:40px; background:linear-gradient(135deg, var(--accent), #00a187); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; box-shadow:0 0 20px rgba(0,201,167,0.3); }
        .logo-text { font-family:'Syne',sans-serif; font-weight:800; font-size:18px; color:#1a2e2a; white-space:nowrap; opacity:1; transition:opacity 0.2s; }
        .collapsed .logo-text { opacity:0; }
        .collapse-btn { margin-left:auto; background:none; border:none; color:var(--muted); cursor:pointer; font-size:16px; padding:4px; border-radius:6px; transition:color 0.2s; flex-shrink:0; }
        .collapse-btn:hover { color:var(--accent); }
        .role-badge { margin:16px; padding:10px 12px; background:rgba(0,201,167,0.08); border:1px solid rgba(0,201,167,0.2); border-radius:10px; display:flex; align-items:center; gap:10px; overflow:hidden; }
        .role-avatar { width:32px; height:32px; background:linear-gradient(135deg, var(--accent), #00a187); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
        .role-name { font-size:13px; font-weight:600; white-space:nowrap; color:#1a2e2a; }
        .role-tag { font-size:10px; color:var(--accent); font-weight:700; letter-spacing:0.08em; text-transform:uppercase; }
        .nav { flex:1; padding:8px 10px; overflow-y:auto; }
        .nav-link { display:flex; align-items:center; gap:12px; padding:10px; border-radius:10px; text-decoration:none; color:var(--muted); font-size:14px; font-weight:500; transition:all 0.18s; margin-bottom:2px; white-space:nowrap; position:relative; overflow:hidden; }
        .nav-link:hover { background:rgba(0,201,167,0.08); color:var(--text); }
        .nav-link.active { background:rgba(0,201,167,0.12); color:#00C9A7; }
        .nav-link.active::before { content:''; position:absolute; left:0; top:20%; bottom:20%; width:3px; background:var(--accent); border-radius:0 3px 3px 0; }
        .nav-icon { font-size:17px; flex-shrink:0; width:22px; text-align:center; }
        .nav-label { transition:opacity 0.2s; }
        .collapsed .nav-label { opacity:0; }
        .sidebar-bottom { padding:16px; border-top:1px solid var(--border); }
        .logout-btn { width:100%; padding:10px 12px; background:rgba(255,107,107,0.08); border:1px solid rgba(255,107,107,0.2); border-radius:10px; color:#FF6B6B; cursor:pointer; font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; transition:all 0.18s; white-space:nowrap; overflow:hidden; font-family:'DM Sans',sans-serif; }
        .logout-btn:hover { background:rgba(255,107,107,0.15); }
        .collapsed .nav-label, .collapsed .logout-text { opacity:0; }
        .main { margin-left:var(--sidebar-w); flex:1; display:flex; flex-direction:column; transition:margin-left 0.3s cubic-bezier(.4,0,.2,1); min-height:100vh; }
        .main.collapsed { margin-left:var(--sidebar-collapsed); }
        .topbar { height:64px; background:var(--surface); border-bottom:1px solid var(--border); display:flex; align-items:center; padding:0 28px; gap:16px; position:sticky; top:0; z-index:50; }
        .topbar-breadcrumb { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--muted); }
        .topbar-breadcrumb .current { color:var(--text); font-weight:600; font-family:'Syne',sans-serif; }
        .topbar-right { margin-left:auto; display:flex; align-items:center; gap:16px; }
        .topbar-time { font-size:12px; color:var(--muted); background:var(--surface2); padding:6px 12px; border-radius:8px; border:1px solid var(--border); font-variant-numeric:tabular-nums; }
        .notif-btn { width:36px; height:36px; background:var(--surface2); border:1px solid var(--border); border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; position:relative; }
        .notif-dot { position:absolute; top:6px; right:6px; width:8px; height:8px; background:#FF6584; border-radius:50%; border:2px solid var(--surface); }
        .topbar-avatar { width:36px; height:36px; background:linear-gradient(135deg, var(--accent), #00a187); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:14px; cursor:pointer; border:2px solid rgba(0,201,167,0.3); }
        .page-content { flex:1; padding:28px; background:var(--bg); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(0,201,167,0.3); border-radius:2px; }
      `}</style>

      <div className="staff-root">
        <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="sidebar-top">
            <div className="logo-icon">⛓️</div>
            <span className="logo-text">ExamChain</span>
            <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? "›" : "‹"}
            </button>
          </div>
          <div className="role-badge">
            <div className="role-avatar">👨‍🏫</div>
            <div>
              <div className="role-name">{localStorage.getItem("username") || "Staff"}</div>
              <div className="role-tag">Staff Portal</div>
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
            <div className="topbar-breadcrumb">
              <span>Staff</span><span>›</span>
              <span className="current">{activeLabel}</span>
            </div>
            <div className="topbar-right">
              <div className="topbar-time">{time.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" })}</div>
              <div className="notif-btn">🔔<div className="notif-dot" /></div>
              <div className="topbar-avatar">👨‍🏫</div>
            </div>
          </div>
          <div className="page-content"><Outlet /></div>
        </div>
      </div>
    </>
  );
};

export default StaffLayout;