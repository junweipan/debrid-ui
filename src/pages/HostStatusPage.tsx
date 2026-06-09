import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom } from "../atoms/userAtoms";

const HOST_STATUS_ENDPOINT = "https://debrid-link.com/api/v2/downloader/hosts";
const HOST_STATUS_TOKEN =
  "if_1BfqjEJeAr8UPujFL9Ji3nzgJIsJSW76GGYyQSwjcVk3_GevHH7kOCCTEd0No";

type HostDescriptor = {
  name: string;
  type: "host" | "stream";
  status: number;
  isFree: boolean;
  domains: string[];
  regexs: string[];
};

type HostsResponse = {
  success: boolean;
  value: HostDescriptor[];
};

type RequestState = "idle" | "loading" | "success" | "error";

type HostStatusState = {
  items: HostDescriptor[];
  status: RequestState;
  message: string;
  lastUpdated?: string;
};

type SortField = "name" | "domain" | "status";
type SortDirection = "asc" | "desc";

type SortState = {
  field: SortField | null;
  direction: SortDirection;
};

const summarizeDomains = (domains: string[]) => {
  if (!domains?.length) return "暂无域名信息";
  const preview = domains.slice(0, 3);
  const remainder = domains.length - preview.length;
  const baseLine = preview.join(" · ");
  return remainder > 0 ? `${baseLine} +${remainder}` : baseLine;
};

type HostStatusPageProps = {
  onLogout: () => void;
};

export function HostStatusPage({ onLogout }: HostStatusPageProps) {
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);
  const [hostStatus, setHostStatus] = useState<HostStatusState>({
    items: [],
    status: "idle",
    message: "点击刷新以同步主机数据。",
  });
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: "asc",
  });
  const [filterText, setFilterText] = useState<string>("");
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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

  const fetchHostStatuses = useCallback(async () => {
    setHostStatus((prev) => ({
      ...prev,
      status: "loading",
      message: "正在同步可用主机...",
    }));

    try {
      const response = await fetch(HOST_STATUS_ENDPOINT, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${HOST_STATUS_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const payload: HostsResponse = await response.json();

      if (!payload.success || !Array.isArray(payload.value)) {
        throw new Error("Malformed host catalog");
      }

      const orderedHosts = [...payload.value].sort(
        (a, b) => b.status - a.status,
      );
      const activeCount = orderedHosts.filter(
        (host) => host.status === 1,
      ).length;

      setHostStatus({
        items: orderedHosts,
        status: "success",
        message: orderedHosts.length
          ? `Live catalog · ${activeCount} active / ${
              orderedHosts.length - activeCount
            } offline`
          : "No hosts reported",
        lastUpdated: new Date().toISOString(),
      });
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "无法加载主机目录";
      setHostStatus({
        items: [],
        status: "error",
        message,
      });
    }
  }, []);

  useEffect(() => {
    void fetchHostStatuses();
  }, [fetchHostStatuses]);

  const handleSort = (field: SortField) => {
    setSortState((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedItems = [...hostStatus.items].sort((a, b) => {
    if (!sortState.field) return 0;

    let compareA: string | number;
    let compareB: string | number;

    switch (sortState.field) {
      case "name":
        compareA = a.name.toLowerCase();
        compareB = b.name.toLowerCase();
        break;
      case "domain":
        compareA = (a.domains[0] ?? "").toLowerCase();
        compareB = (b.domains[0] ?? "").toLowerCase();
        break;
      case "status":
        compareA = a.status;
        compareB = b.status;
        break;
      default:
        return 0;
    }

    if (compareA < compareB) return sortState.direction === "asc" ? -1 : 1;
    if (compareA > compareB) return sortState.direction === "asc" ? 1 : -1;
    return 0;
  });

  const filteredItems = sortedItems.filter((host) => {
    if (!filterText.trim()) return true;
    const searchText = filterText.toLowerCase();
    const hostName = host.name.toLowerCase();
    const primaryDomain = (host.domains[0] ?? "").toLowerCase();
    return hostName.includes(searchText) || primaryDomain.includes(searchText);
  });

  const lastUpdatedCopy = hostStatus.lastUpdated
    ? new Date(hostStatus.lastUpdated).toLocaleTimeString()
    : null;

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
          aria-label="关闭导航"
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
            className="nav-item active"
            onClick={() => setSidebarOpen(false)}
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
          {user?.role === "admin" && (
            <button
              type="button"
              className="nav-item"
              onClick={() => navigate("/admin")}
            >
              <span className="icon">🛠</span>
              Admin 用户管理
            </button>
          )}
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
            aria-label="打开导航"
            aria-controls="primary-sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div>
            <p className="eyebrow">状态中心</p>
            <h1>主机可用状态</h1>
            <p className="subhead">数据来自 Debrid-Link 的实时可用性接口。</p>
          </div>
        </header>

        <section className="host-status-section" aria-live="polite">
          <div className="host-status-header">
            <div>
              <p className="eyebrow">Live availability</p>
              <h2>Network availability monitor</h2>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={() => void fetchHostStatuses()}
              disabled={hostStatus.status === "loading"}
            >
              {hostStatus.status === "loading" ? "刷新中..." : "刷新"}
            </button>
          </div>
          <div
            className={`host-status-panel state-${hostStatus.status}`}
            aria-live="polite"
          >
            <div className="host-status-pill">
              <span className="status-dot" />
              <p>{hostStatus.message}</p>
            </div>
            {lastUpdatedCopy && (
              <p className="host-status-timestamp">
                更新时间 {lastUpdatedCopy}
              </p>
            )}
          </div>

          <div className="host-filter-wrapper">
            <input
              type="text"
              className="host-filter-input"
              placeholder="按主机名或主域名筛选..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              aria-label="按主机名或域名筛选"
            />
          </div>

          {hostStatus.status === "error" ? (
            <p className="host-status-error">
              无法连接 Debrid-Link。请重试同步以查看实时主机数据。
            </p>
          ) : (
            <div
              className="host-status-table-wrapper"
              role="region"
              aria-live="polite"
            >
              <table className="host-status-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() => handleSort("name")}
                      >
                        Host
                        {sortState.field === "name" && (
                          <span className="sort-indicator">
                            {sortState.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th scope="col">Level</th>
                    <th scope="col">
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() => handleSort("domain")}
                      >
                        Domain
                        {sortState.field === "domain" && (
                          <span className="sort-indicator">
                            {sortState.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th scope="col">Domain Coverage</th>
                    <th scope="col">
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() => handleSort("status")}
                      >
                        状态
                        {sortState.field === "status" && (
                          <span className="sort-indicator">
                            {sortState.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hostStatus.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="host-status-empty-cell">
                        暂无主机数据。
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="host-status-empty-cell">
                        没有符合筛选条件的主机。
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((host) => (
                      <tr key={host.name}>
                        <td>
                          <div className="host-name-cell">
                            <span className="host-type-pill">
                              {host.type === "stream" ? "Streaming" : "Host"}
                            </span>
                            <span className="host-name">{host.name}</span>
                          </div>
                        </td>
                        <td>{host.isFree ? "Free" : "Premium"}</td>
                        <td>{host.domains[0] ?? "No reported domain"}</td>
                        <td>{summarizeDomains(host.domains)}</td>
                        <td>
                          <span
                            className={`status-chip ${
                              host.status === 1 ? "online" : "offline"
                            }`}
                          >
                            <span
                              className={`status-dot ${
                                host.status === 1 ? "online" : "offline"
                              }`}
                            />
                            {host.status === 1 ? "Online" : "Offline"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default HostStatusPage;
