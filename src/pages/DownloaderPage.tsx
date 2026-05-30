import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom } from "../atoms/userAtoms";
import "../styles/TopUpModal.css";

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

const filters = ["All", "Errored"] as const;

type Filter = (typeof filters)[number];
type ApiStatus = "idle" | "loading" | "success" | "error";

type AccountInfoState = {
  status: ApiStatus;
  message: string;
};

type DownloaderPageProps = {
  onLogout: () => void;
};

export function DownloaderPage({ onLogout }: DownloaderPageProps) {
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfoState>({
    status: "idle",
    message: "Tap Auto extract to fetch account info.",
  });
  const [isTopUpModalOpen, setTopUpModalOpen] = useState(false);
  const [giftCardInput, setGiftCardInput] = useState("");
  const [topUpStatus, setTopUpStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [topUpMessage, setTopUpMessage] = useState("");
  const [isTopUpResultOpen, setTopUpResultOpen] = useState(false);

  const stats: {
    label: string;
    value: string;
    delta: string;
    showTopUp?: boolean;
  }[] = [
    {
      label: "下载剩余次数",
      value: String(user?.balance_left ?? "—"),
      delta: "",
      showTopUp: true,
    },
    { label: "已使用流量", value: `${user?.data_used ?? "—"} GB`, delta: "" },
    { label: "成功转存", value: String(user?.parser_count ?? "—"), delta: "" },
  ];

  useEffect(() => {
    if (!localStorage.getItem("authToken")) {
      onLogout();
      navigate("/login", { replace: true });
    }
  }, [navigate, onLogout]);

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
        },
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

  const handleTopUpConfirm = async () => {
    if (!giftCardInput.trim()) return;
    setTopUpStatus("loading");
    try {
      const response = await fetch("http://localhost:4000/gift-cards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_number: giftCardInput.trim(),
          email: user?.email,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTopUpStatus("success");
        setTopUpMessage(`成功充值${data.value.redeemed_value}`);
      }else {
        setTopUpStatus("error");
        setTopUpMessage(
          `充值失败：${data.error ?? "未知错误"}。如有疑问请联系微信：panjunweide`,
        );
      }
      setTopUpModalOpen(false);
      setGiftCardInput("");
      setTopUpResultOpen(true);
    } catch (error) {
        setTopUpStatus("error");
        setTopUpMessage(
          `充值失败：${error instanceof Error ? error.message : "未知错误"}。如有疑问请联系微信：panjunweide`,
        );
      setTopUpModalOpen(false);
      setGiftCardInput("");
      setTopUpResultOpen(true);
    }
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    localStorage.removeItem("authToken");
    onLogout();
    navigate("/login", { replace: true });
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
          <button type="button" className="nav-item" onClick={handleLogout}>
            <span className="icon">🚪</span>
            退出登录
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
              <p className="user-label">{user?.email ?? "—"}</p>
              <p className="user-note">
                {user && user.balance_left > 0 ? "Premium" : "Standard"}
              </p>
            </div>
          </div>
        </header>

        <section className="composer">
          <div className="composer-header">
            <div>
              <p className="eyebrow">New resource</p>
              <h2>复制rapidgator链接，可多行同时粘贴，用回车换行符分隔</h2>
            </div>
          </div>
          <div className="composer-body">
            <textarea
              className="composer-input"
              placeholder="use rapidgator URL, e.g., https://rapidgator.net/file/.../JUR-748.mp4.html"
              rows={3}
            />
            <div className="composer-actions">
              <button type="button" className="primary-button">
                开始解析
              </button>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          {stats.map((item) => (
            <article key={item.label} className="stat-card">
              <p className="eyebrow">{item.label}</p>
              <div className="topup-stat-row">
                <p className="stat-value">{item.value}</p>
                {item.showTopUp && (
                  <button
                    type="button"
                    className="primary-button topup-stat-button"
                    onClick={() => {
                      setTopUpStatus("idle");
                      setTopUpMessage("");
                      setGiftCardInput("");
                      setTopUpModalOpen(true);
                    }}
                  >
                    充值
                  </button>
                )}
              </div>
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

      {/* Top Up Modal */}
      {isTopUpModalOpen && (
        <div className="topup-overlay" onClick={() => setTopUpModalOpen(false)}>
          <div className="topup-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: "16px" }}>请输入充值码</h3>
            <input
              type="text"
              className="topup-input"
              value={giftCardInput}
              onChange={(e) => setGiftCardInput(e.target.value)}
              placeholder="例如: JU8JM-UUA7J-WO6NF"
            />
            <div className="topup-actions">
              <button
                type="button"
                className="primary-button"
                disabled={topUpStatus === "loading"}
                onClick={handleTopUpConfirm}
              >
                {topUpStatus === "loading" ? "处理中…" : "确认"}
              </button>
              <button
                type="button"
                className="topup-cancel-button"
                onClick={() => setTopUpModalOpen(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Up Result Modal */}
      {isTopUpResultOpen && (
        <div
          className="topup-overlay"
          onClick={() => {
            setTopUpResultOpen(false);
            if (topUpStatus === "success") window.location.reload();
          }}
        >
          <div
            className="topup-modal topup-result-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`topup-result-icon ${
                topUpStatus === "success"
                  ? "topup-result-icon--success"
                  : "topup-result-icon--error"
              }`}
            >
              {topUpStatus === "success" ? "✓" : "✕"}
            </div>
            <h3 className="topup-result-title">
              {topUpStatus === "success" ? "充值成功" : "充值失败"}
            </h3>
            <p className="topup-result-message">{topUpMessage}</p>
            <button
              type="button"
              className="primary-button topup-result-close"
              onClick={() => {
                setTopUpResultOpen(false);
                if (topUpStatus === "success") window.location.reload();
              }}
            >
              确认
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DownloaderPage;
