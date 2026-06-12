import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminPage.css";

type AdminPageProps = {
  onLogout: () => void;
};

type AdminUser = {
  id: string;
  email: string;
  password: string;
  storage_all: number;
  storage_expired_at: string | number;
  balance_left: number;
  data_used: number;
  parser_count: number;
  deleted: boolean;
  role: string;
  created_at: string | null;
  updated_at: string | null;
};

type AdminUsersListPayload = {
  success?: boolean;
  value?: {
    items?: AdminUser[];
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
    };
  };
  error?: string;
};

type AdminUserPayload = {
  success?: boolean;
  value?: AdminUser;
  error?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const AUTHORIZED_ADMIN_EMAIL =
  import.meta.env.VITE_AUTHORIZED_ADMIN_EMAIL?.trim().toLowerCase() || "";

const toNumberOrZero = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

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

export function AdminPage({ onLogout }: AdminPageProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAccessChecking, setAccessChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("standard");
  const [isCreating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("standard");
  const [editBalanceLeft, setEditBalanceLeft] = useState("0");
  const [editStorageAll, setEditStorageAll] = useState("0");
  const [editDataUsed, setEditDataUsed] = useState("0");
  const [editParserCount, setEditParserCount] = useState("0");
  const [editStorageExpiredAt, setEditStorageExpiredAt] = useState("0");
  const [editDeleted, setEditDeleted] = useState(false);
  const [isUpdating, setUpdating] = useState(false);

  const totalPages = useMemo(() => {
    if (total <= 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(total / limit));
  }, [limit, total]);

  const getAuthToken = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      onLogout();
      navigate("/login", { replace: true });
      return null;
    }
    return token;
  };

  const fetchUsers = useCallback(async () => {
    if (!hasAccess) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/admin/users?page=${page}&limit=${limit}&includeDeleted=${includeDeleted}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const payload = (await response.json()) as AdminUsersListPayload;

      if (!response.ok || !payload?.success) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          onLogout();
          navigate("/login", { replace: true });
          return;
        }
        throw new Error(getErrorMessage("加载用户失败", payload));
      }

      const items = Array.isArray(payload.value?.items)
        ? payload.value.items
        : [];
      const pagination = payload.value?.pagination;

      setUsers(items);
      setTotal(typeof pagination?.total === "number" ? pagination.total : 0);
      setNotice(`已加载 ${items.length} 条用户记录`);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : "加载用户失败",
      );
    } finally {
      setLoading(false);
    }
  }, [hasAccess, includeDeleted, limit, navigate, onLogout, page]);

  const verifyAdminAccess = useCallback(async () => {
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

      if (!response.ok) {
        throw new Error("UNAUTHORIZED");
      }

      const payload = (await response.json()) as {
        success?: boolean;
        value?: {
          user?: {
            email?: string;
            role?: string;
          };
        };
      };

      const currentUser = payload?.value?.user;
      const normalizedEmail = currentUser?.email?.trim().toLowerCase();
      const normalizedRole = currentUser?.role?.trim().toLowerCase();
      const canAccess =
        payload?.success === true &&
        normalizedRole === "admin" &&
        normalizedEmail === AUTHORIZED_ADMIN_EMAIL;

      if (!canAccess) {
        setHasAccess(false);
        navigate("/", { replace: true });
        return;
      }

      setHasAccess(true);
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
    void verifyAdminAccess();
  }, [verifyAdminAccess]);

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
      void fetchUsers();
    }
  }, [fetchUsers, hasAccess]);

  const handleLogout = () => {
    setSidebarOpen(false);
    localStorage.removeItem("authToken");
    onLogout();
    navigate("/login", { replace: true });
  };

  const handleCreateUser = async () => {
    if (!hasAccess) {
      navigate("/", { replace: true });
      return;
    }

    if (!createEmail.trim() || createPassword.trim().length < 6) {
      setError("创建用户时，邮箱必填且密码至少 6 位");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      return;
    }

    setCreating(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: createEmail.trim(),
          password: createPassword,
          role: createRole,
        }),
      });

      const payload = (await response.json()) as AdminUserPayload;
      if (!response.ok || !payload?.success || !payload.value) {
        throw new Error(getErrorMessage("创建用户失败", payload));
      }

      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("standard");
      setNotice(`创建成功: ${payload.value.email}`);
      await fetchUsers();
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "创建用户失败",
      );
    } finally {
      setCreating(false);
    }
  };

  const beginEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setEditEmail(user.email);
    setEditPassword("");
    setEditRole(user.role || "standard");
    setEditBalanceLeft(String(user.balance_left ?? 0));
    setEditStorageAll(String(user.storage_all ?? 0));
    setEditDataUsed(String(user.data_used ?? 0));
    setEditParserCount(String(user.parser_count ?? 0));
    setEditStorageExpiredAt(
      user.storage_expired_at === 0
        ? "0"
        : String(user.storage_expired_at ?? 0),
    );
    setEditDeleted(Boolean(user.deleted));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditEmail("");
    setEditPassword("");
    setEditRole("standard");
    setEditBalanceLeft("0");
    setEditStorageAll("0");
    setEditDataUsed("0");
    setEditParserCount("0");
    setEditStorageExpiredAt("0");
    setEditDeleted(false);
  };

  const handleUpdateUser = async () => {
    if (!hasAccess) {
      navigate("/", { replace: true });
      return;
    }

    if (!editingId) {
      return;
    }

    if (!editEmail.trim()) {
      setError("更新用户时邮箱不能为空");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      return;
    }

    setUpdating(true);
    setError(null);
    setNotice(null);

    const body: Record<string, unknown> = {
      email: editEmail.trim(),
      role: editRole.trim() || "standard",
      balance_left: toNumberOrZero(editBalanceLeft),
      storage_all: toNumberOrZero(editStorageAll),
      data_used: toNumberOrZero(editDataUsed),
      parser_count: toNumberOrZero(editParserCount),
      storage_expired_at: editStorageExpiredAt.trim() || "0",
      deleted: editDeleted,
    };

    if (editPassword.trim()) {
      body.password = editPassword;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/users/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as AdminUserPayload;
      if (!response.ok || !payload?.success || !payload.value) {
        throw new Error(getErrorMessage("更新用户失败", payload));
      }

      setNotice(`更新成功: ${payload.value.email}`);
      cancelEdit();
      await fetchUsers();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "更新用户失败",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!hasAccess) {
      navigate("/", { replace: true });
      return;
    }

    const token = getAuthToken();
    if (!token) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as AdminUserPayload;
      if (!response.ok || !payload?.success || !payload.value) {
        throw new Error(getErrorMessage("删除用户失败", payload));
      }

      setNotice(`已标记删除: ${payload.value.email}`);
      if (editingId === user.id) {
        cancelEdit();
      }
      await fetchUsers();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "删除用户失败",
      );
    }
  };

  if (isAccessChecking) {
    return <div className="login-shell">正在校验管理员权限...</div>;
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
          <button
            type="button"
            className="nav-item active"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="icon">🛠</span>
            用户管理
          </button>
          <button
            type="button"
            className="nav-item"
            onClick={() => navigate("/logs")}
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
            <p className="eyebrow">Admin</p>
            <h1>用户集合管理</h1>
            <p className="subhead">通过 /admin/users 接口进行增删改查。</p>
          </div>
        </header>

        <section className="admin-grid">
          <article className="admin-card">
            <div className="admin-card-head">
              <h2>创建用户</h2>
            </div>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Email</span>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(event) => setCreateEmail(event.target.value)}
                  placeholder="user@example.com"
                />
              </label>
              <label className="admin-field">
                <span>Password</span>
                <input
                  type="text"
                  value={createPassword}
                  onChange={(event) => setCreatePassword(event.target.value)}
                  placeholder="at least 6 chars"
                />
              </label>
              <label className="admin-field">
                <span>Role</span>
                <select
                  value={createRole}
                  onChange={(event) => setCreateRole(event.target.value)}
                >
                  <option value="standard">standard</option>
                  <option value="admin">admin</option>
                </select>
              </label>
            </div>
            <div className="admin-actions">
              <button
                type="button"
                className="primary-button"
                disabled={isCreating}
                onClick={() => void handleCreateUser()}
              >
                {isCreating ? "创建中..." : "创建用户"}
              </button>
            </div>
          </article>

          <article className="admin-card">
            <div className="admin-card-head admin-list-header">
              <h2>用户列表</h2>
              <div className="admin-inline-controls">
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={includeDeleted}
                    onChange={(event) => {
                      setPage(1);
                      setIncludeDeleted(event.target.checked);
                    }}
                  />
                  <span>包含已删除</span>
                </label>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => void fetchUsers()}
                  disabled={isLoading}
                >
                  {isLoading ? "刷新中..." : "刷新"}
                </button>
              </div>
            </div>

            {error && <p className="admin-feedback error">{error}</p>}
            {notice && <p className="admin-feedback success">{notice}</p>}

            <div className="admin-table-wrap" role="region" aria-live="polite">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Balance</th>
                    <th>Deleted</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="admin-empty-cell">
                        {isLoading ? "加载中..." : "暂无数据"}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isEditing = editingId === user.id;
                      return (
                        <tr
                          key={user.id}
                          className={isEditing ? "is-editing" : ""}
                        >
                          <td>{user.email}</td>
                          <td>{user.role || "standard"}</td>
                          <td>{user.balance_left ?? 0}</td>
                          <td>{user.deleted ? "yes" : "no"}</td>
                          <td>{user.created_at || "-"}</td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                className="ghost-button"
                                onClick={() => beginEdit(user)}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                className="ghost-button"
                                onClick={() => void handleDeleteUser(user)}
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
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
                  setPage((current) =>
                    current >= totalPages ? totalPages : current + 1,
                  )
                }
                disabled={page >= totalPages || isLoading}
              >
                下一页
              </button>
            </div>
          </article>

          {editingId && (
            <article className="admin-card">
              <div className="admin-card-head">
                <h2>编辑用户</h2>
              </div>
              <div className="admin-form-grid admin-form-grid-two">
                <label className="admin-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(event) => setEditEmail(event.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span>New Password</span>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(event) => setEditPassword(event.target.value)}
                    placeholder="留空则不修改"
                  />
                </label>
                <label className="admin-field">
                  <span>Role</span>
                  <select
                    value={editRole}
                    onChange={(event) => setEditRole(event.target.value)}
                  >
                    <option value="standard">standard</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <label className="admin-field">
                  <span>Balance Left</span>
                  <input
                    type="number"
                    min={0}
                    value={editBalanceLeft}
                    onChange={(event) => setEditBalanceLeft(event.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span>Storage All</span>
                  <input
                    type="number"
                    min={0}
                    value={editStorageAll}
                    onChange={(event) => setEditStorageAll(event.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span>Data Used</span>
                  <input
                    type="number"
                    min={0}
                    value={editDataUsed}
                    onChange={(event) => setEditDataUsed(event.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span>Parser Count</span>
                  <input
                    type="number"
                    min={0}
                    value={editParserCount}
                    onChange={(event) => setEditParserCount(event.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span>Storage Expired At</span>
                  <input
                    type="text"
                    value={editStorageExpiredAt}
                    onChange={(event) =>
                      setEditStorageExpiredAt(event.target.value)
                    }
                    placeholder="0 或日期字符串"
                  />
                </label>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={editDeleted}
                    onChange={(event) => setEditDeleted(event.target.checked)}
                  />
                  <span>Deleted</span>
                </label>
              </div>
              <div className="admin-actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={isUpdating}
                  onClick={() => void handleUpdateUser()}
                >
                  {isUpdating ? "保存中..." : "保存修改"}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={cancelEdit}
                  disabled={isUpdating}
                >
                  取消
                </button>
              </div>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}
