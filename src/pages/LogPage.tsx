import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LogPage.css";

type LogPageProps = {
  onLogout: () => void;
};

type TransactionLog = {
  id: string;
  user_email: string | null;
  original_url: string | null;
  debrid_url: string | null;
  download_url: string | null;
  parse_time: string | null;
  data_used_mb: number;
  debrid_id: string | null;
  debrid_host: string | null;
  created_at: string | null;
};

type TransactionLogsPayload = {
  success?: boolean;
  value?: {
    items?: TransactionLog[];
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
    };
  };
  error?: string;
};

type DeletePayload = {
  success?: boolean;
  value?: {
    deleted_id?: string;
    deleted_count?: number;
  };
  error?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const AUTHORIZED_ADMIN_EMAIL =
  import.meta.env.VITE_AUTHORIZED_ADMIN_EMAIL?.trim().toLowerCase() || "";
const EXTRA_ALLOWED_EMAIL = "panjunweide@gmail.com";

const getErrorMessage = (fallback: string, payload: unknown) => {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }
  return fallback;
};

export function LogPage({ onLogout }: LogPageProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAccessChecking, setAccessChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterEmail, setFilterEmail] = useState("");
  const [filterParseTimeFrom, setFilterParseTimeFrom] = useState("");
  const [filterParseTimeTo, setFilterParseTimeTo] = useState("");
  const [filterCreatedAtFrom, setFilterCreatedAtFrom] = useState("");
  const [filterCreatedAtTo, setFilterCreatedAtTo] = useState("");
  const [filterDataUsedMin, setFilterDataUsedMin] = useState("");
  const [filterDataUsedMax, setFilterDataUsedMax] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Bulk delete confirm state
  const [isBulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const totalPages = useMemo(() => {
    if (total <= 0) return 1;
    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      onLogout();
      navigate("/login", { replace: true });
      return null;
    }
    return token;
  }, [navigate, onLogout]);

  const buildQueryParams = useCallback(
    (overridePage?: number) => {
      const params = new URLSearchParams();
      params.set("page", String(overridePage ?? page));
      params.set("limit", String(limit));
      params.set("sort_by", sortBy);
      params.set("sort_order", sortOrder);

      if (isAdmin && filterEmail.trim()) {
        params.set("user_email", filterEmail.trim());
      }
      if (filterParseTimeFrom.trim()) {
        params.set("parse_time_from", filterParseTimeFrom.trim());
      }
      if (filterParseTimeTo.trim()) {
        params.set("parse_time_to", filterParseTimeTo.trim());
      }
      if (filterCreatedAtFrom.trim()) {
        params.set("created_at_from", filterCreatedAtFrom.trim());
      }
      if (filterCreatedAtTo.trim()) {
        params.set("created_at_to", filterCreatedAtTo.trim());
      }
      if (filterDataUsedMin.trim()) {
        params.set("data_used_mb_min", filterDataUsedMin.trim());
      }
      if (filterDataUsedMax.trim()) {
        params.set("data_used_mb_max", filterDataUsedMax.trim());
      }
      return params.toString();
    },
    [
      filterCreatedAtFrom,
      filterCreatedAtTo,
      filterDataUsedMax,
      filterDataUsedMin,
      filterEmail,
      filterParseTimeFrom,
      filterParseTimeTo,
      isAdmin,
      limit,
      page,
      sortBy,
      sortOrder,
    ],
  );

  const fetchLogs = useCallback(
    async (resetPage = false) => {
      if (!hasAccess) return;

      const token = getAuthToken();
      if (!token) return;

      const targetPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      setLoading(true);
      setError(null);

      try {
        const params = buildQueryParams(targetPage);
        const response = await fetch(`${API_BASE}/transactionLog?${params}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response.json()) as TransactionLogsPayload;

        if (!response.ok || !payload?.success) {
          if (response.status === 401) {
            localStorage.removeItem("authToken");
            onLogout();
            navigate("/login", { replace: true });
            return;
          }
          throw new Error(getErrorMessage("加载日志失败", payload));
        }

        const items = Array.isArray(payload.value?.items)
          ? payload.value.items
          : [];
        const pagination = payload.value?.pagination;

        setLogs(items);
        setTotal(typeof pagination?.total === "number" ? pagination.total : 0);
        setNotice(`已加载 ${items.length} 条日志记录`);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error ? fetchError.message : "加载日志失败",
        );
      } finally {
        setLoading(false);
      }
    },
    [hasAccess, getAuthToken, page, buildQueryParams, onLogout, navigate],
  );

  const verifyAccess = useCallback(async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      onLogout();
      navigate("/login", { replace: true });
      return;
    }

    setAccessChecking(true);

    try {
      const response = await fetch(`${API_BASE}/users/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("UNAUTHORIZED");

      const payload = (await response.json()) as {
        success?: boolean;
        value?: { user?: { email?: string; role?: string } };
      };

      const currentUser = payload?.value?.user;
      const normalizedEmail = currentUser?.email?.trim().toLowerCase() ?? "";
      const normalizedRole = currentUser?.role?.trim().toLowerCase() ?? "";
      const adminAccess =
        payload?.success === true &&
        normalizedRole === "admin" &&
        normalizedEmail === AUTHORIZED_ADMIN_EMAIL;
      const extraAccess =
        payload?.success === true &&
        normalizedEmail === EXTRA_ALLOWED_EMAIL.toLowerCase();
      const canAccess = adminAccess || extraAccess;

      if (!canAccess) {
        setHasAccess(false);
        navigate("/", { replace: true });
        return;
      }

      setHasAccess(true);
      setIsAdmin(normalizedRole === "admin");
    } catch {
      setHasAccess(false);
      navigate("/", { replace: true });
    } finally {
      setAccessChecking(false);
    }
  }, [navigate, onLogout]);

  useEffect(() => {
    if (!localStorage.getItem("authToken")) {
      onLogout();
      navigate("/login", { replace: true });
    }
  }, [navigate, onLogout]);

  useEffect(() => {
    void verifyAccess();
  }, [verifyAccess]);

  useEffect(() => {
    const body = document.body;
    if (isSidebarOpen) {
      body.classList.add("no-scroll");
    } else {
      body.classList.remove("no-scroll");
    }
    return () => body.classList.remove("no-scroll");
  }, [isSidebarOpen]);

  useEffect(() => {
    if (hasAccess) {
      void fetchLogs();
    }
  }, [fetchLogs, hasAccess]);

  const handleLogout = () => {
    setSidebarOpen(false);
    localStorage.removeItem("authToken");
    onLogout();
    navigate("/login", { replace: true });
  };

  const handleApplyFilters = () => {
    void fetchLogs(true);
  };

  const handleClearFilters = () => {
    setFilterEmail("");
    setFilterParseTimeFrom("");
    setFilterParseTimeTo("");
    setFilterCreatedAtFrom("");
    setFilterCreatedAtTo("");
    setFilterDataUsedMin("");
    setFilterDataUsedMax("");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  const handleDeleteLog = async (log: TransactionLog) => {
    const token = getAuthToken();
    if (!token) return;

    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/transactionLog/${log.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as DeletePayload;

      if (!response.ok || !payload?.success) {
        throw new Error(getErrorMessage("删除日志失败", payload));
      }

      setNotice(`已删除日志 ${log.id}`);
      await fetchLogs();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "删除日志失败",
      );
    }
  };

  const handleBulkDelete = async () => {
    const token = getAuthToken();
    if (!token) return;

    setBulkDeleting(true);
    setError(null);
    setNotice(null);

    try {
      const params = new URLSearchParams();

      if (isAdmin && filterEmail.trim()) {
        params.set("user_email", filterEmail.trim());
      }
      if (filterParseTimeFrom.trim()) {
        params.set("parse_time_from", filterParseTimeFrom.trim());
      }
      if (filterParseTimeTo.trim()) {
        params.set("parse_time_to", filterParseTimeTo.trim());
      }
      if (filterCreatedAtFrom.trim()) {
        params.set("created_at_from", filterCreatedAtFrom.trim());
      }
      if (filterCreatedAtTo.trim()) {
        params.set("created_at_to", filterCreatedAtTo.trim());
      }
      if (filterDataUsedMin.trim()) {
        params.set("data_used_mb_min", filterDataUsedMin.trim());
      }
      if (filterDataUsedMax.trim()) {
        params.set("data_used_mb_max", filterDataUsedMax.trim());
      }

      const hasFilters = params.toString().length > 0;
      if (!hasFilters) {
        params.set("all", "true");
      }

      const response = await fetch(
        `${API_BASE}/transactionLog?${params.toString()}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = (await response.json()) as DeletePayload;

      if (!response.ok || !payload?.success) {
        throw new Error(getErrorMessage("批量删除失败", payload));
      }

      setNotice(`已批量删除 ${payload.value?.deleted_count ?? 0} 条日志`);
      setConfirmBulkDelete(false);
      await fetchLogs(true);
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : "批量删除失败");
    } finally {
      setBulkDeleting(false);
    }
  };

  if (isAccessChecking) {
    return <div className="login-shell">正在校验访问权限...</div>;
  }

  if (!hasAccess) {
    return null;
  }

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
          {isAdmin && (
            <button
              type="button"
              className="nav-item"
              onClick={() => navigate("/admin")}
            >
              <span className="icon">🛠</span>
              用户管理
            </button>
          )}
          <button
            type="button"
            className="nav-item active"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="icon">📋</span>
            交易日志
          </button>
          <button type="button" className="nav-item" onClick={handleLogout}>
            <span className="icon">🚪</span>
            退出登录
          </button>
        </nav>
        <div className="sidebar-footer">
          <p className="foot-label">客服 QQ</p>
          <img className="foot-qq-image" src="/QQ.jpg" alt="客服QQ二维码" />
          <p className="foot-note">扫码添加客服 QQ</p>
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
            <p className="eyebrow">Log</p>
            <h1>交易日志管理</h1>
            <p className="subhead">
              通过 /transactionLog 接口查询、筛选与删除日志。
            </p>
          </div>
        </header>

        <section className="admin-grid">
          {/* Filter card */}
          <article className="admin-card">
            <div className="admin-card-head">
              <h2>筛选条件</h2>
              <div className="admin-inline-controls">
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleApplyFilters}
                  disabled={isLoading}
                >
                  应用筛选
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleClearFilters}
                  disabled={isLoading}
                >
                  清除
                </button>
              </div>
            </div>

            <div className="admin-form-grid admin-form-grid-two">
              {isAdmin && (
                <label className="admin-field">
                  <span>User Email</span>
                  <input
                    type="text"
                    value={filterEmail}
                    onChange={(e) => setFilterEmail(e.target.value)}
                    placeholder="支持模糊搜索"
                  />
                </label>
              )}

              <label className="admin-field">
                <span>Parse Time From</span>
                <input
                  type="datetime-local"
                  value={filterParseTimeFrom}
                  onChange={(e) => setFilterParseTimeFrom(e.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>Parse Time To</span>
                <input
                  type="datetime-local"
                  value={filterParseTimeTo}
                  onChange={(e) => setFilterParseTimeTo(e.target.value)}
                />
              </label>

              <label className="admin-field">
                <span>Created At From</span>
                <input
                  type="datetime-local"
                  value={filterCreatedAtFrom}
                  onChange={(e) => setFilterCreatedAtFrom(e.target.value)}
                />
              </label>
              <label className="admin-field">
                <span>Created At To</span>
                <input
                  type="datetime-local"
                  value={filterCreatedAtTo}
                  onChange={(e) => setFilterCreatedAtTo(e.target.value)}
                />
              </label>

              <label className="admin-field">
                <span>Data Used (MB) Min</span>
                <input
                  type="number"
                  min={0}
                  value={filterDataUsedMin}
                  onChange={(e) => setFilterDataUsedMin(e.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="admin-field">
                <span>Data Used (MB) Max</span>
                <input
                  type="number"
                  min={0}
                  value={filterDataUsedMax}
                  onChange={(e) => setFilterDataUsedMax(e.target.value)}
                  placeholder="不限"
                />
              </label>

              <label className="admin-field">
                <span>Sort By</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="created_at">Created At</option>
                  <option value="parse_time">Parse Time</option>
                  <option value="data_used_mb">Data Used (MB)</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Sort Order</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">降序 (新→旧)</option>
                  <option value="asc">升序 (旧→新)</option>
                </select>
              </label>
            </div>
          </article>

          {/* Log list card */}
          <article className="admin-card">
            <div className="admin-card-head admin-list-header">
              <h2>日志列表</h2>
              <div className="admin-inline-controls">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => void fetchLogs()}
                  disabled={isLoading}
                >
                  {isLoading ? "刷新中..." : "刷新"}
                </button>
                {confirmBulkDelete ? (
                  <>
                    <span className="log-confirm-text">确认批量删除？</span>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => void handleBulkDelete()}
                      disabled={isBulkDeleting}
                    >
                      {isBulkDeleting ? "删除中..." : "确认"}
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => setConfirmBulkDelete(false)}
                      disabled={isBulkDeleting}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => setConfirmBulkDelete(true)}
                    disabled={isLoading}
                  >
                    批量删除
                  </button>
                )}
              </div>
            </div>

            {error && <p className="admin-feedback error">{error}</p>}
            {notice && <p className="admin-feedback success">{notice}</p>}

            <div className="admin-table-wrap" role="region" aria-live="polite">
              <table className="admin-table log-table">
                <thead>
                  <tr>
                    {isAdmin && <th>User Email</th>}
                    <th>Original URL</th>
                    <th>Parse Time</th>
                    <th>Data Used (MB)</th>
                    <th>Debrid Host</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 7 : 6}
                        className="admin-empty-cell"
                      >
                        {isLoading ? "加载中..." : "暂无数据"}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        {isAdmin && (
                          <td className="log-email-cell">
                            {log.user_email ?? "-"}
                          </td>
                        )}
                        <td className="log-url-cell">
                          {log.original_url ? (
                            <a
                              href={log.original_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="log-link"
                              title={log.original_url}
                            >
                              {log.original_url.length > 40
                                ? `${log.original_url.slice(0, 40)}…`
                                : log.original_url}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{log.parse_time ?? "-"}</td>
                        <td>{log.data_used_mb ?? 0}</td>
                        <td>{log.debrid_host ?? "-"}</td>
                        <td>{log.created_at ?? "-"}</td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() => void handleDeleteLog(log)}
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
              >
                上一页
              </button>
              <p>
                第 {page} / {totalPages} 页 (共 {total} 条)
              </p>
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setPage((p) => (p >= totalPages ? totalPages : p + 1))
                }
                disabled={page >= totalPages || isLoading}
              >
                下一页
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
