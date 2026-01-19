import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

type ResetPasswordConfirmResponse = {
  success?: boolean;
  value?: {
    message?: string;
  };
};

type StatusVariant = "neutral" | "warning" | "success";

type ResetPasswordConfirmPageProps = {
  token?: string;
};

export function ResetPasswordConfirmPage({
  token,
}: ResetPasswordConfirmPageProps) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    variant: StatusVariant;
  } | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(
    null
  );

  const isTokenMissing = !token;

  useEffect(() => {
    if (isTokenMissing) {
      setStatus({
        variant: "warning",
        message: "链接无效或已失效，请重新请求重置邮件。",
      });
    }
  }, [isTokenMissing]);

  useEffect(() => {
    if (redirectCountdown === null) {
      return;
    }

    if (redirectCountdown <= 0) {
      setRedirectCountdown(null);
      navigate("/login", { replace: true });
      return;
    }

    const timer = window.setTimeout(() => {
      setRedirectCountdown((prev) =>
        prev === null ? null : Math.max(0, prev - 1)
      );
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [redirectCountdown, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || !token) {
      return;
    }

    const trimmedPassword = password.trim();

    if (!trimmedPassword) {
      setStatus({
        variant: "warning",
        message: "请输入新密码。",
      });
      return;
    }

    if (trimmedPassword.length < 8) {
      setStatus({
        variant: "warning",
        message: "密码至少需要 8 个字符。",
      });
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setStatus({
        variant: "warning",
        message: "两次输入的密码不一致。",
      });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setRedirectCountdown(null);

    try {
      const response = await fetch(
        "http://localhost:4000/users/reset-password/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password: trimmedPassword,
          }),
        }
      );

      let payload: ResetPasswordConfirmResponse | null = null;
      try {
        payload = (await response.json()) as ResetPasswordConfirmResponse;
      } catch {
        payload = null;
      }

      const derivedMessage =
        payload?.value?.message ??
        (response.ok
          ? "密码已成功重置，请使用新密码登录。"
          : "重置失败，请稍后再试。");

      if (!response.ok) {
        setStatus({ variant: "warning", message: derivedMessage });
        setRedirectCountdown(null);
        return;
      }

      const isSuccess = Boolean(payload?.success);
      setStatus({
        variant: isSuccess ? "success" : "warning",
        message: derivedMessage,
      });

      if (isSuccess) {
        setPassword("");
        setConfirmPassword("");
        setRedirectCountdown(1);
      }
    } catch {
      setStatus({
        variant: "warning",
        message: "重置失败，请稍后再试。",
      });
      setRedirectCountdown(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="login-eyebrow">derbrid secure</p>
        <p className="login-subhead">设置新的账户密码。</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="input-field">
            <span>新密码</span>
            <input
              type="password"
              name="password"
              placeholder="至少 8 个字符"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              disabled={isTokenMissing}
              required
            />
          </label>
          <label className="input-field">
            <span>确认新密码</span>
            <input
              type="password"
              name="confirm-password"
              placeholder="再次输入新密码"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              disabled={isTokenMissing}
              required
            />
          </label>
          {status && (
            <p className={`login-info login-info-${status.variant}`}>
              {status.message}
            </p>
          )}
          <button
            type="submit"
            className="primary-button login-button"
            disabled={isSubmitting || isTokenMissing}
          >
            {isSubmitting ? "提交中..." : "确认重置密码"}
          </button>
          {redirectCountdown !== null && (
            <p className="login-hint">
              {redirectCountdown} 秒后将跳转到登录页面...
            </p>
          )}
        </form>
        <div className="login-secondary">
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/login", { replace: true })}
            disabled={isSubmitting}
          >
            返回登录
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/reset-password")}
            disabled={isSubmitting}
          >
            重新获取链接
          </button>
        </div>
      </div>
    </div>
  );
}
