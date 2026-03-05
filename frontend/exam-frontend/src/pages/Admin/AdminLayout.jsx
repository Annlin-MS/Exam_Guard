import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { icon: "⬡", label: "Dashboard", path: "/admin/dashboard" },
  { icon: "📋", label: "Exam Management", path: "/admin/exams" },
  { icon: "✅", label: "Approvals", path: "/admin/approvals" },
  { icon: "👨‍🏫", label: "Staff", path: "/admin/staff" },
  { icon: "👨‍🎓", label: "Students", path: "/admin/students" },
  { icon: "📢", label: "Publish Results", path: "/admin/publish-results" },
  { icon: "⛓️", label: "Blockchain", path: "/admin/blockchain" },
  { icon: "📊", label: "Reports", path: "/admin/reports" },
  { icon: "👤", label: "Profile", path: "/admin/profile" },
];

const AdminLayout = () => {
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

  const activeLabel =
    NAV_ITEMS.find((n) => location.pathname.startsWith(n.path))?.label ||
    "Dashboard";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --bg: #ffffff;
          --surface: #ffffff;
          --surface2: #F5F2FF;
          --border: #E6E0F8;
          --accent: #6C63FF;
          --accent2: #FF6584;
          --accent3: #00C9A7;
          --text: #4B2E83;
          --muted: #8F80C9;
          --sidebar-w: 240px;
          --sidebar-collapsed: 72px;
        }

        .admin-root {
          display: flex;
          min-height: 100vh;
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
        }

        /* Sidebar */

        .sidebar {
          width: var(--sidebar-w);
          min-height: 100vh;
          background: #F7F5FF;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: width 0.3s;
          position: fixed;
          left: 0;
          top: 0;
        }

        .sidebar.collapsed { width: var(--sidebar-collapsed); }

        .sidebar-top {
          padding: 24px 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #6C63FF, #9b5de5);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: #5A3EC8;
        }

        .collapse-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
        }

        .role-badge {
          margin: 16px;
          padding: 10px 12px;
          background: #EFE9FF;
          border: 1px solid #D8CFFF;
          border-radius: 10px;
          display: flex;
          gap: 10px;
        }

        .role-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6C63FF, #9b5de5);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .role-name {
          font-size: 13px;
          font-weight: 600;
          color: #4B2E83;
        }

        .role-tag {
          font-size: 10px;
          color: #6C63FF;
          font-weight: 700;
        }

        /* Navigation */

        .nav { flex: 1; padding: 8px 10px; }

        .nav-section-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--muted);
          padding: 12px 8px 6px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 10px;
          text-decoration: none;
          color: #6C63FF;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-link:hover {
          background: #EFE9FF;
        }

        .nav-link.active {
          background: #E6E0F8;
          color: #4B2E83;
        }

        .nav-icon {
          font-size: 17px;
        }

        /* Logout */

        .sidebar-bottom {
          padding: 16px;
          border-top: 1px solid var(--border);
        }

        .logout-btn {
          width: 100%;
          padding: 10px;
          background: #FFE9EF;
          border: 1px solid #FFC9D3;
          border-radius: 10px;
          color: #FF6584;
          cursor: pointer;
          font-weight: 600;
        }

        /* Main */

        .main {
          margin-left: var(--sidebar-w);
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .main.collapsed {
          margin-left: var(--sidebar-collapsed);
        }

        .topbar {
          height: 64px;
          background: #ffffff;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          padding: 0 28px;
        }

        .topbar-breadcrumb {
          font-size: 13px;
          color: var(--muted);
        }

        .current {
          color: #4B2E83;
          font-weight: 600;
          margin-left: 6px;
        }

        .topbar-right {
          margin-left: auto;
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .topbar-time {
          font-size: 12px;
          color: #6C63FF;
          background: #F5F2FF;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .notif-btn {
          width: 36px;
          height: 36px;
          background: #F5F2FF;
          border: 1px solid var(--border);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
        }

        .notif-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 8px;
          height: 8px;
          background: #FF6584;
          border-radius: 50%;
        }

        .topbar-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg,#6C63FF,#9b5de5);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .page-content {
          flex: 1;
          padding: 28px;
          background: var(--bg);
        }
      `}</style>

      <div className="admin-root">

        {/* Sidebar */}
        <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="sidebar-top">
            <div className="logo-icon">⛓️</div>
            <span className="logo-text">ExamGuard</span>

            <button
              className="collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? "›" : "‹"}
            </button>
          </div>

          <div className="role-badge">
            <div className="role-avatar">👑</div>
            <div>
              <div className="role-name">Admin</div>
              <div className="role-tag">Administrator</div>
            </div>
          </div>

          <nav className="nav">
            <div className="nav-section-label">Main Menu</div>

            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${
                  location.pathname.startsWith(item.path) ? "active" : ""
                }`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Main */}
        <div className={`main ${collapsed ? "collapsed" : ""}`}>
          <div className="topbar">
            <div className="topbar-breadcrumb">
              Admin › <span className="current">{activeLabel}</span>
            </div>

            <div className="topbar-right">
              <div className="topbar-time">
                {time.toLocaleTimeString()}
              </div>

              <div className="notif-btn">
                🔔
                <div className="notif-dot" />
              </div>

              <div className="topbar-avatar">👑</div>
            </div>
          </div>

          <div className="page-content">
            <Outlet />
          </div>
        </div>

      </div>
    </>
  );
};

export default AdminLayout;