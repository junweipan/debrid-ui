import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export function ToolsRecommendationPage() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const body = document.body;
    if (isSidebarOpen) {
      body.classList.add("no-scroll");
    } else {
      body.classList.remove("no-scroll");
    }
    return () => body.classList.remove("no-scroll");
  }, [isSidebarOpen]);

  return (
    <div className="app-shell">
      <aside
        id="primary-sidebar"
        className={`sidebar ${isSidebarOpen ? "open" : ""}`}
      >
        <button
          type="button"
          className="sidebar-close"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        >
          ×
        </button>
        <div className="brand">
          <span className="brand-pill">DL</span>
          <div>
            <p className="brand-eyebrow">derbrid</p>
            <p className="brand-title">Downloader</p>
          </div>
        </div>
        <nav className="nav-stack">
          <button
            type="button"
            className="nav-item"
            onClick={() => navigate("/")}
          >
            <span className="icon">↓</span>
            Downloader
          </button>
          <button
            type="button"
            className="nav-item"
            onClick={() => navigate("/hosts")}
          >
            <span className="icon">☁</span>
            检查主机列表
          </button>
          <button
            type="button"
            className="nav-item active"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="icon">📦</span>
            下载工具推荐
          </button>
        </nav>
        <div className="sidebar-footer">
          <p className="foot-label">Network health</p>
          <div className="foot-meter">
            <span className="signal-fill" />
          </div>
          <p className="foot-note">5 mirrors · 12 peers</p>
        </div>
      </aside>

      <div
        className={`mobile-overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="main-panel">
        <header className="top-bar">
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label="Open navigation"
            aria-controls="primary-sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div>
            <p className="eyebrow">Download Tools</p>
            <h1>下载工具推荐</h1>
            <p className="subhead">推荐的下载器工具，适用于各种操作系统</p>
          </div>
        </header>

        <div style={{ padding: "2rem" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "800px",
            }}
          >
            <div style={{ marginBottom: "2rem" }}>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                下载器分享
              </h3>
              <p
                style={{
                  marginBottom: "0.5rem",
                  color: "rgba(255,255,255,0.8)",
                }}
              >
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                以下为官方地址：
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: "1.5rem",
                marginTop: "2rem",
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  Windows 系统
                </h4>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <li
                    style={{
                      padding: "0.75rem 1rem",
                      background: "rgba(99,102,241,0.1)",
                      borderRadius: "6px",
                      borderLeft: "3px solid #6366f1",
                      cursor: "pointer",
                    }}
                  >
                    <a href="https://www.internetdownloadmanager.com/" target="_blank" rel="noopener noreferrer"><strong style={{ color: "#6366f1" }}>IDM</strong></a>
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.9rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      (Internet Download Manager)
                    </span>
                  </li>
                  <li
                    style={{
                      padding: "0.75rem 1rem",
                      background: "rgba(99,102,241,0.1)",
                      borderRadius: "6px",
                      borderLeft: "3px solid #6366f1",
                    }}
                  >
                    <a href="https://www.freedownloadmanager.org/" target="_blank" rel="noopener noreferrer"><strong style={{ color: "#6366f1" }}>FDM</strong></a>
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.9rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      (Free Download Manager)
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  MacOS 苹果系统、Android 安卓系统
                </h4>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                  }}
                >
                  <li
                    style={{
                      padding: "0.75rem 1rem",
                      background: "rgba(99,102,241,0.1)",
                      borderRadius: "6px",
                      borderLeft: "3px solid #6366f1",
                    }}
                  >
                    <a href="https://www.freedownloadmanager.org/" target="_blank" rel="noopener noreferrer"><strong style={{ color: "#6366f1" }}>FDM</strong></a>
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.9rem",
                        color: "rgba(255,255,255,0.6)",
                      }}
                    >
                      (Free Download Manager)
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  IOS 系统（苹果手机）
                </h4>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                  }}
                >
                  <li
                    style={{
                      padding: "0.75rem 1rem",
                      background: "rgba(99,102,241,0.1)",
                      borderRadius: "6px",
                      borderLeft: "3px solid #6366f1",
                    }}
                  >
                    <a href="https://apps.apple.com/us/app/fget-file-manager-browser/id1582654012" target="_blank" rel="noopener noreferrer"><strong style={{ color: "#6366f1" }}>fGet-File Manager & Browser</strong></a>
                  </li>
                </ul>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    marginBottom: "0.75rem",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  Linux 系统
                </h4>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                  }}
                >
                  <li
                    style={{
                      padding: "0.75rem 1rem",
                      background: "rgba(99,102,241,0.1)",
                      borderRadius: "6px",
                      borderLeft: "3px solid #6366f1",
                    }}
                  >
                     <a href="https://aria2.github.io/" target="_blank" rel="noopener noreferrer"> <strong style={{ color: "#6366f1" }}>aria2c</strong></a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
