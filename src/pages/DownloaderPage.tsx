import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom } from "../atoms/userAtoms";
import "../styles/TopUpModal.css";

type DownloaderPageProps = {
  onLogout: () => void;
};

export function DownloaderPage({ onLogout }: DownloaderPageProps) {
  const navigate = useNavigate();
  const [user, setUser] = useAtom(userAtom);

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isTopUpModalOpen, setTopUpModalOpen] = useState(false);
  const [giftCardInput, setGiftCardInput] = useState("");
  const [topUpStatus, setTopUpStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [topUpMessage, setTopUpMessage] = useState("");
  const [isTopUpResultOpen, setTopUpResultOpen] = useState(false);
  const [isResetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [tempPasswordInput, setTempPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("");
  const [resetPasswordStatus, setResetPasswordStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [resetPasswordMessage, setResetPasswordMessage] = useState("");
  const [isResetPasswordResultOpen, setResetPasswordResultOpen] =
    useState(false);
  const [textareaContent, setTextareaContent] = useState("");
  const [parseResults, setParseResults] = useState<any[]>([]);
  const [parseStatus, setParseStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [parseMessage, setParseMessage] = useState("");
  const [copiedDownloadUrl, setCopiedDownloadUrl] = useState<string | null>(
    null,
  );
  const [isDeleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const historyOriginalUrls = user?.original_urls ?? [];
  const historyParsedUrls = user?.parsed_urls ?? [];
  const [selectedHistoryKeys, setSelectedHistoryKeys] = useState<string[]>([]);
  const RAPIDGATOR_URL_PATTERN = /^https?:\/\/(?:www\.)?rapidgator\.net\/.+/i;

  const historyRows = historyOriginalUrls.map((originalItem, index) => {
    const parsedItem = historyParsedUrls[index];
    return {
      key: `${index}-${originalItem.url}`,
      originalItem,
      parsedItem,
      parsedUrl: parsedItem?.url,
    };
  });

  const selectableHistoryKeys = historyRows
    .filter((row) => Boolean(row.parsedUrl))
    .map((row) => row.key);
  const isAllHistorySelected =
    selectableHistoryKeys.length > 0 &&
    selectableHistoryKeys.every((key) => selectedHistoryKeys.includes(key));

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

  const refreshUserProfile = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/me`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        onLogout();
        navigate("/login", { replace: true });
        return;
      }

      const payload = await response.json();
      const latestUser = payload?.value?.user;

      if (payload?.success && latestUser) {
        setUser(latestUser);
      }
    } catch {
      onLogout();
      navigate("/login", { replace: true });
    }
  }, [setUser, onLogout, navigate]);

  useEffect(() => {
    void refreshUserProfile();
  }, [refreshUserProfile]);

  const handleTopUpConfirm = async () => {
    if (!giftCardInput.trim()) return;
    setTopUpStatus("loading");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/gift-cards/redeem`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card_number: giftCardInput.trim(),
            email: user?.email,
          }),
        },
      );
      const data = await response.json();
      if (data.success) {
        setTopUpStatus("success");
        setTopUpMessage(`成功充值${data.value.redeemed_value}`);
      } else {
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

  const handleBeginParse = async () => {
    const url = textareaContent.trim();

    if (!url) {
      setParseStatus("error");
      setParseMessage("请输入至少一个URL");
      return;
    }

    if (/[,\s]/.test(url)) {
      setParseStatus("error");
      setParseMessage(
        "仅支持输入一个 Rapidgator 链接。请移除空格、换行或逗号。",
      );
      return;
    }

    if (!RAPIDGATOR_URL_PATTERN.test(url)) {
      setParseStatus("error");
      setParseMessage(
        "仅支持 Rapidgator 链接（例如：https://rapidgator.net/file/...）。",
      );
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setParseStatus("error");
      setParseMessage("登录已过期，请重新登录后再试。");
      return;
    }

    setParseStatus("loading");
    setParseMessage("");
    setParseResults([]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/transactions/parse-urls`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ urls: [url] }),
        },
      );

      const data = await response.json();
      if (!response.ok || !data?.success) {
        const errorMessage = data?.error ?? "解析失败，请重试";
        throw new Error(errorMessage);
      }

      setParseStatus("success");
      setParseResults(data?.value?.results ?? []);
      setParseMessage(
        `成功解析 ${data?.value?.valid_urls_processed ?? 0} 个URL`,
      );
      if (user && data?.value?.balance_left !== undefined) {
        setUser({
          ...user,
          balance_left: data.value.balance_left,
        });
      }
      await refreshUserProfile();
    } catch (error) {
      setParseStatus("error");
      setParseMessage(
        error instanceof Error ? error.message : "解析失败，请稍后重试",
      );
      setParseResults([]);
    }
  };

  const handleCopyDownloadUrl = async (downloadUrl: string) => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopiedDownloadUrl(downloadUrl);
      setTimeout(() => {
        setCopiedDownloadUrl((current) =>
          current === downloadUrl ? null : current,
        );
      }, 1500);
    } catch {
      setParseStatus("error");
      setParseMessage("复制失败，请手动复制链接。");
    }
  };

  const handleToggleHistorySelection = (key: string) => {
    setSelectedHistoryKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  };

  const handleSelectAllHistory = () => {
    setSelectedHistoryKeys(isAllHistorySelected ? [] : selectableHistoryKeys);
  };

  const handleDeleteSelectedHistory = () => {
    const selectedRows = historyRows.filter(
      (row) => row.parsedUrl && selectedHistoryKeys.includes(row.key),
    );

    if (selectedRows.length === 0) {
      setParseStatus("error");
      setParseMessage("请先选择要删除的链接。");
      return;
    }

    setDeleteConfirmModalOpen(true);
  };

  const handleConfirmDeleteSelectedHistory = async () => {
    const selectedRows = historyRows.filter(
      (row) => row.parsedUrl && selectedHistoryKeys.includes(row.key),
    );

    if (selectedRows.length === 0) {
      setParseStatus("error");
      setParseMessage("请先选择要删除的链接。");
      return;
    }

    const originalUrls = selectedRows.map((row) => row.originalItem.url);
    const parsedUrls = selectedRows
      .map((row) => row.parsedUrl)
      .filter((url): url is string => Boolean(url));

    const token = localStorage.getItem("authToken");
    if (!token) {
      setParseStatus("error");
      setParseMessage("登录已过期，请重新登录后再试。");
      return;
    }

    setParseStatus("loading");
    setParseMessage("正在删除已选历史记录...");
    setDeleteConfirmModalOpen(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/transactions/remove-urls`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            original_urls: originalUrls,
            parsed_urls: parsedUrls,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok || !data?.success) {
        const errorMessage = data?.error ?? "删除失败，请稍后重试";
        throw new Error(errorMessage);
      }

      if (user) {
        setUser({
          ...user,
          original_urls: (user.original_urls ?? []).filter(
            (item) => !originalUrls.includes(item.url),
          ),
          parsed_urls: (user.parsed_urls ?? []).filter(
            (item) => !parsedUrls.includes(item.url),
          ),
        });
      }

      setSelectedHistoryKeys([]);
      setParseStatus("success");
      setParseMessage(
        `删除成功：原始链接 ${data?.value?.removed_original_urls ?? 0} 条，解析链接 ${data?.value?.removed_parsed_urls ?? 0} 条。`,
      );
    } catch (error) {
      setParseStatus("error");
      setParseMessage(
        error instanceof Error ? error.message : "删除失败，请稍后重试",
      );
    }
  };

  const handleExportSelectedHistory = async () => {
    const selectedUrls = historyRows
      .filter((row) => row.parsedUrl && selectedHistoryKeys.includes(row.key))
      .map((row) => row.parsedUrl as string);

    if (selectedUrls.length === 0) {
      setParseStatus("error");
      setParseMessage("请先选择要导出的链接。");
      return;
    }

    const fileContent = selectedUrls.join("\n");

    try {
      const windowWithPicker = window as Window & {
        showSaveFilePicker?: (options?: {
          suggestedName?: string;
          types?: Array<{
            description?: string;
            accept: Record<string, string[]>;
          }>;
        }) => Promise<{
          createWritable: () => Promise<{
            write: (content: string) => Promise<void>;
            close: () => Promise<void>;
          }>;
        }>;
      };

      if (windowWithPicker.showSaveFilePicker) {
        const fileHandle = await windowWithPicker.showSaveFilePicker({
          suggestedName: "parsed-urls.txt",
          types: [
            {
              description: "Text file",
              accept: { "text/plain": [".txt"] },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(fileContent);
        await writable.close();
      } else {
        const blob = new Blob([fileContent], {
          type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "parsed-urls.txt";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      }

      setParseStatus("success");
      setParseMessage(`已导出 ${selectedUrls.length} 条链接。`);
    } catch {
      setParseStatus("error");
      setParseMessage("导出失败，请重试。");
    }
  };

  const handleOpenResetPasswordModal = () => {
    setSidebarOpen(false);
    setTempPasswordInput("");
    setNewPasswordInput("");
    setConfirmNewPasswordInput("");
    setResetPasswordStatus("idle");
    setResetPasswordMessage("");
    setResetPasswordModalOpen(true);
  };

  const handleResetPassword = async () => {
    const tempPassword = tempPasswordInput.trim();
    const newPassword = newPasswordInput.trim();
    const confirmPassword = confirmNewPasswordInput.trim();

    if (!tempPassword || !newPassword || !confirmPassword) {
      setResetPasswordStatus("error");
      setResetPasswordMessage("请完整填写临时密码、新密码和确认密码。");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetPasswordStatus("error");
      setResetPasswordMessage("两次输入的新密码不一致，请重新确认。");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      setResetPasswordStatus("error");
      setResetPasswordMessage("登录已过期，请重新登录后再试。");
      return;
    }

    setResetPasswordStatus("loading");
    setResetPasswordMessage("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            temp_password: tempPassword,
            new_password: newPassword,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok || !data?.success) {
        const errorMessage =
          data?.error ??
          data?.value?.message ??
          `重置失败（HTTP ${response.status}）`;
        throw new Error(errorMessage);
      }

      setResetPasswordStatus("success");
      setResetPasswordMessage(
        data?.value?.message ?? "密码重置成功，请使用新密码登录。",
      );
      setTempPasswordInput("");
      setNewPasswordInput("");
      setConfirmNewPasswordInput("");
    } catch (error) {
      setResetPasswordStatus("error");
      setResetPasswordMessage(
        error instanceof Error ? error.message : "重置密码失败，请稍后重试。",
      );
    } finally {
      setResetPasswordModalOpen(false);
      setResetPasswordResultOpen(true);
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
          <button
            type="button"
            className="nav-item"
            onClick={handleOpenResetPasswordModal}
          >
            <span className="icon">🔒</span>
            重置密码
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
            aria-label="打开导航"
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
              <p className="eyebrow">新任务</p>
              <h2>请输入一个 Rapidgator 链接（仅支持单条）</h2>
            </div>
          </div>
          <div className="composer-body">
            <textarea
              className="composer-input"
              placeholder="仅支持一个 Rapidgator 链接，例如：https://rapidgator.net/file/.../JUR-748.mp4.html"
              rows={2}
              value={textareaContent}
              onChange={(e) => {
                const nextValue = e.target.value;
                const firstToken = nextValue
                  .split(/[\n\s,]+/)
                  .find((token) => token.length > 0);

                setTextareaContent(firstToken ?? "");
              }}
            />
            <div className="composer-actions">
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: "15px",
                  marginRight: "10px",
                }}
              >
                提示：解析失败不扣次数
              </span>
              <button
                type="button"
                className="primary-button"
                disabled={parseStatus === "loading"}
                onClick={handleBeginParse}
              >
                {parseStatus === "loading" ? "解析中…" : "开始解析"}
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

        {parseMessage && (
          <div className={`api-panel status-${parseStatus}`} aria-live="polite">
            <div className="api-panel-head">
              <span className="status-dot" />
              <p>
                {parseStatus === "loading"
                  ? "正在解析..."
                  : parseStatus === "success"
                    ? "解析成功"
                    : "解析失败"}
              </p>
            </div>
            <p style={{ margin: 0, color: "inherit" }}>{parseMessage}</p>
          </div>
        )}

        {parseResults.length > 0 && (
          <section className="download-board">
            <div className="board-header">
              <h2 style={{ margin: "0 0 16px" }}>解析结果</h2>
            </div>
            <div className="download-list">
              {parseResults.map((result, index) => (
                <article
                  key={index}
                  className={`download-card status-${result.status}`}
                >
                  <header>
                    <div>
                      <p className="download-id">{result.debrid_data?.name}</p>
                      <h3>{result.original_url}</h3>
                    </div>
                  </header>
                  <div className="meta-row">
                    <span>{result.parsed_size?.raw}</span>
                    <span>{result.debrid_data?.host}</span>
                  </div>
                  <div
                    style={{
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid #444",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#aaa",
                        margin: "0 0 6px",
                      }}
                    >
                      下载链接:
                    </p>
                    <a
                      href={result.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#4ade80",
                        wordBreak: "break-all",
                        fontSize: "12px",
                      }}
                    >
                      {result.download_url}
                    </a>
                    <button
                      type="button"
                      aria-label="复制下载链接"
                      onClick={() => handleCopyDownloadUrl(result.download_url)}
                      style={{
                        marginLeft: "8px",
                        border: "1px solid #4b5563",
                        background: "transparent",
                        color: "#cbd5e1",
                        borderRadius: "6px",
                        cursor: "pointer",
                        padding: "4px 8px",
                        fontSize: "12px",
                        verticalAlign: "middle",
                      }}
                    >
                      {copiedDownloadUrl === result.download_url
                        ? "已复制"
                        : "📋"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {historyOriginalUrls.length > 0 && (
          <section className="download-board">
            <div className="board-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                <h2 style={{ margin: 0 }}>历史记录</h2>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="topup-cancel-button"
                    onClick={handleSelectAllHistory}
                    disabled={selectableHistoryKeys.length === 0}
                  >
                    全选
                  </button>
                  <button
                    type="button"
                    className="topup-cancel-button"
                    onClick={handleDeleteSelectedHistory}
                    disabled={selectedHistoryKeys.length === 0}
                    style={{ minWidth: "98px", whiteSpace: "nowrap" }}
                  >
                    删除已选
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleExportSelectedHistory}
                    disabled={selectedHistoryKeys.length === 0}
                  >
                    导出已选到记事本
                  </button>
                </div>
              </div>
            </div>
            <div className="download-list">
              {historyRows.map((row) => {
                const { originalItem, parsedItem, parsedUrl, key } = row;
                const isSelected = selectedHistoryKeys.includes(key);

                return (
                  <article key={key} className="download-card status-completed">
                    <header>
                      <div>
                        <p className="download-id">
                          {parsedItem?.created_at ?? originalItem.created_at}
                        </p>
                        <h3>{originalItem.url}</h3>
                      </div>
                    </header>
                    <div className="meta-row">
                      <span>来源: 历史解析</span>
                      <span>{parsedUrl ? "已解析" : "未解析"}</span>
                    </div>
                    <div
                      style={{
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid #444",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#aaa",
                          margin: "0 0 6px",
                        }}
                      >
                        下载链接:
                      </p>
                      {parsedUrl ? (
                        <>
                          <label
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              marginRight: "10px",
                              fontSize: "12px",
                              color: "#cbd5e1",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleHistorySelection(key)}
                            />
                            选择
                          </label>
                          <a
                            href={parsedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#4ade80",
                              wordBreak: "break-all",
                              fontSize: "12px",
                            }}
                          >
                            {parsedUrl}
                          </a>
                          <button
                            type="button"
                            aria-label="复制历史下载链接"
                            onClick={() => handleCopyDownloadUrl(parsedUrl)}
                            style={{
                              marginLeft: "8px",
                              border: "1px solid #4b5563",
                              background: "transparent",
                              color: "#cbd5e1",
                              borderRadius: "6px",
                              cursor: "pointer",
                              padding: "4px 8px",
                              fontSize: "12px",
                              verticalAlign: "middle",
                            }}
                          >
                            {copiedDownloadUrl === parsedUrl ? "已复制" : "📋"}
                          </button>
                        </>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                          暂无解析后的下载链接
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
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

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && (
        <div
          className="topup-overlay"
          onClick={() => setResetPasswordModalOpen(false)}
        >
          <div className="topup-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: "16px" }}>重置密码</h3>
            <div className="topup-actions" style={{ marginTop: 0 }}>
              <input
                type="password"
                className="topup-input"
                value={tempPasswordInput}
                onChange={(e) => setTempPasswordInput(e.target.value)}
                placeholder="临时密码 / 当前密码"
              />
            </div>
            <div className="topup-actions" style={{ marginTop: "12px" }}>
              <input
                type="password"
                className="topup-input"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="新密码"
              />
            </div>
            <div className="topup-actions" style={{ marginTop: "12px" }}>
              <input
                type="password"
                className="topup-input"
                value={confirmNewPasswordInput}
                onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                placeholder="确认新密码"
              />
            </div>
            {resetPasswordMessage && (
              <p
                className={
                  resetPasswordStatus === "success"
                    ? "topup-success-text"
                    : "topup-error"
                }
              >
                {resetPasswordMessage}
              </p>
            )}
            <div className="topup-actions">
              <button
                type="button"
                className="primary-button"
                disabled={resetPasswordStatus === "loading"}
                onClick={handleResetPassword}
              >
                {resetPasswordStatus === "loading" ? "提交中…" : "提交"}
              </button>
              <button
                type="button"
                className="topup-cancel-button"
                onClick={() => setResetPasswordModalOpen(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Result Modal */}
      {isResetPasswordResultOpen && (
        <div
          className="topup-overlay"
          onClick={() => setResetPasswordResultOpen(false)}
        >
          <div
            className="topup-modal topup-result-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`topup-result-icon ${
                resetPasswordStatus === "success"
                  ? "topup-result-icon--success"
                  : "topup-result-icon--error"
              }`}
            >
              {resetPasswordStatus === "success" ? "✓" : "✕"}
            </div>
            <h3 className="topup-result-title">
              {resetPasswordStatus === "success" ? "重置成功" : "重置失败"}
            </h3>
            <p className="topup-result-message">{resetPasswordMessage}</p>
            <button
              type="button"
              className="primary-button topup-result-close"
              onClick={() => setResetPasswordResultOpen(false)}
            >
              确认
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {isDeleteConfirmModalOpen && (
        <div
          className="topup-overlay"
          onClick={() => setDeleteConfirmModalOpen(false)}
        >
          <div className="topup-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: "12px" }}>确认删除</h3>
            <p style={{ margin: 0, color: "#cbd5e1" }}>
              确认删除已选择的 {selectedHistoryKeys.length}{" "}
              条历史记录吗？删除后不可恢复。
            </p>
            <div className="topup-actions" style={{ marginTop: "16px" }}>
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirmDeleteSelectedHistory}
              >
                确认删除
              </button>
              <button
                type="button"
                className="topup-cancel-button"
                onClick={() => setDeleteConfirmModalOpen(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DownloaderPage;
