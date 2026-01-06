import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type DownloadSnapshot = {
  id: string;
  label: string;
  size: string;
  speed: string;
  eta: string;
  status: "Downloading" | "Queued" | "Completed" | "Errored";
  progress: number;
  checksum?: string;
};

const downloads: DownloadSnapshot[] = [
  {
    id: "MAG-8F1A",
    label: "The.Expanse.S06E01.2160p.WEBRip.DDP5.1",
    size: "24.6 GB",
    speed: "128 MB/s",
    eta: "02m 12s",
    status: "Downloading",
    progress: 76,
    checksum: "SHA256 · 6ca0d…f31a",
  },
  {
    id: "TOR-A92C",
    label: "Synthwave.vol.09.FLAC",
    size: "4.2 GB",
    speed: "—",
    eta: "Queued",
    status: "Queued",
    progress: 0,
  },
  {
    id: "MAG-11B0",
    label: "Blender.Asset.Library.2025.1",
    size: "12.1 GB",
    speed: "94 MB/s",
    eta: "56s",
    status: "Downloading",
    progress: 42,
    checksum: "CRC32 · 2F4E66A1",
  },
  {
    id: "DDL-55F1",
    label: "ArcJet.Documentation.Bundle.pdf",
    size: "980 MB",
    speed: "—",
    eta: "Ready",
    status: "Completed",
    progress: 100,
    checksum: "MD5 · d1c7…b09d",
  },
  {
    id: "MAG-2404",
    label: "Foundation.S02E04.1080p.WEBRip",
    size: "3.8 GB",
    speed: "—",
    eta: "Checksum failed",
    status: "Errored",
    progress: 12,
  },
];

const stats = [
  { label: "Active slots", value: "08", delta: "+2 vs last hour" },
  { label: "Decrypted today", value: "182 GB", delta: "96% success rate" },
  { label: "Parallel CDNs", value: "05", delta: "Auto load-balanced" },
];

const quickActions = [
  { label: "Auto extract", detail: "Unpack archives after download" },
  { label: "Share link", detail: "Create ephemeral share token" },
  { label: "Schedule", detail: "Defer to low-power window" },
];

const filters = [
  "All",
  "Downloading",
  "Queued",
  "Completed",
  "Errored",
] as const;

type Filter = (typeof filters)[number];
type ApiStatus = "idle" | "loading" | "success" | "error";

type AccountInfoState = {
  status: ApiStatus;
  message: string;
};

export function DownloaderPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfoState>({
    status: "idle",
    message: "Tap Auto extract to fetch account info.",
  });

  useEffect(() => {
    const body = document.body;
    if (isSidebarOpen) {
      body.classList.add("no-scroll");
    } else {
      body.classList.remove("no-scroll");
    }
    return () => body.classList.remove("no-scroll");
  }, [isSidebarOpen]);

  const visibleDownloads = downloads.filter((item) => {
    if (activeFilter === "All") return true;
    return item.status === activeFilter;
  });

  const handleAutoExtract = async () => {
    setAccountInfo({ status: "loading", message: "Fetching account info…" });
    try {
      const response = await fetch(
        "https://debrid-server.netlify.app/account/infos",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const payload = await response.json();
      setAccountInfo({
        status: "success",
        message: JSON.stringify(payload, null, 2),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to fetch account info";
      setAccountInfo({ status: "error", message });
    }
  };

  const handleQuickAction = (label: string) => {
    if (label === "Auto extract") {
      void handleAutoExtract();
    }
  };

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
            className="nav-item active"
            onClick={() => setSidebarOpen(false)}
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
            className="nav-item"
            onClick={() => navigate("/tools")}
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
            <p className="eyebrow">Secure aggregation</p>
            <h1>解析文档</h1>
            <p className="subhead">
              提取完文件信息后可查看预计要扣取的账号流量，部分类型因中转难度有差异而有倍率，如有可能请尽量使用正常倍率的类型。
            </p>
          </div>
          <div className="user-pill">
            <span className="status-dot" />
            <div>
              <p className="user-label">Session: orbital@stack</p>
              <p className="user-note">Premium · exp 12 Feb</p>
            </div>
          </div>
        </header>

        <section className="composer">
          <div className="composer-header">
            <div>
              <p className="eyebrow">New resource</p>
              <h2>Drop a magnet link or hoster URL</h2>
            </div>
            <button type="button" className="ghost-button">
              Import from clipboard
            </button>
          </div>
          <div className="composer-body">
            <textarea
              className="composer-input"
              placeholder="magnet:?xt=urn:btih:… or https://hoster.com/file/abcd"
              rows={3}
            />
            <div className="chip-row">
              {["High priority", "Use dedicated IP", "Auto cleanup"].map(
                (chip) => (
                  <label key={chip} className="chip">
                    <input
                      type="checkbox"
                      defaultChecked={chip === "High priority"}
                    />
                    <span>{chip}</span>
                  </label>
                )
              )}
            </div>
            <div className="composer-actions">
              <div className="quick-grid">
                {quickActions.map((action) => (
                  <button
                    type="button"
                    key={action.label}
                    className="quick-action"
                    onClick={() => handleQuickAction(action.label)}
                  >
                    <p>{action.label}</p>
                    <span>{action.detail}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="primary-button">
                Add to downloader
              </button>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          {stats.map((item) => (
            <article key={item.label} className="stat-card">
              <p className="eyebrow">{item.label}</p>
              <p className="stat-value">{item.value}</p>
              <p className="stat-delta">{item.delta}</p>
            </article>
          ))}
        </section>

        <section className="download-board">
          <div className="board-header">
            <div className="tab-row">
              {filters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={`tab ${filter === activeFilter ? "active" : ""}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button type="button" className="ghost-button">
              New queue preset
            </button>
          </div>
          <div
            className={`api-panel status-${accountInfo.status}`}
            aria-live="polite"
          >
            <div className="api-panel-head">
              <span className="status-dot" />
              <p>
                {accountInfo.status === "loading"
                  ? "Loading account details"
                  : "Account info"}
              </p>
            </div>
            <pre>{accountInfo.message}</pre>
          </div>
          <div className="download-list">
            {visibleDownloads.map((item) => (
              <article
                key={item.id}
                className={`download-card status-${item.status.toLowerCase()}`}
              >
                <header>
                  <div>
                    <p className="download-id">{item.id}</p>
                    <h3>{item.label}</h3>
                  </div>
                  <button type="button" className="icon-button">
                    ⋯
                  </button>
                </header>
                <div className="meta-row">
                  <span>{item.size}</span>
                  <span>Speed {item.speed}</span>
                  <span>{item.eta}</span>
                  {item.checksum && <span>{item.checksum}</span>}
                </div>
                <div className="progress-track">
                  <span style={{ width: `${item.progress}%` }} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default DownloaderPage;
