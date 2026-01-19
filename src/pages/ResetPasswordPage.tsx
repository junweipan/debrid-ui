import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ResetPasswordConfirmPage } from "./ResetPasswordConfirmPage";

type ResetPasswordResponse = {
  success?: boolean;
  value?: {
    message?: string;
  };
};

type StatusVariant = "neutral" | "warning" | "success";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromQuery = searchParams.get("token")?.trim() ?? "";
  if (tokenFromQuery) {
    return <ResetPasswordConfirmPage token={tokenFromQuery} />;
  }
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    variant: StatusVariant;
  } | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [hasSuccessfulRequest, setHasSuccessfulRequest] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(
    null
  );

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setStatus({
        variant: "warning",
        message: "请输入有效的邮箱地址。",
      });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setHasSuccessfulRequest(false);
    setRedirectCountdown(null);

    try {
      const response = await fetch(
        "http://localhost:4000/users/reset-password/request",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail }),
        }
      );

      let payload: ResetPasswordResponse | null = null;
      try {
        payload = (await response.json()) as ResetPasswordResponse;
      } catch {
        payload = null;
      }

      const derivedMessage =
        payload?.value?.message ??
        (response.ok
          ? "Password reset instructions have been sent if the email exists."
          : "请求失败，请稍后再试。");

      if (!response.ok) {
        setStatus({ variant: "warning", message: derivedMessage });
        setHasSuccessfulRequest(false);
        setRedirectCountdown(null);
        return;
      }

      const isSuccess = Boolean(payload?.success);
      setStatus({
        variant: isSuccess ? "success" : "warning",
        message: derivedMessage,
      });

      if (isSuccess) {
        setHasSuccessfulRequest(true);
        setRedirectCountdown(5);
      } else {
        setHasSuccessfulRequest(false);
        setRedirectCountdown(null);
      }
    } catch {
      setStatus({
        variant: "warning",
        message: "请求失败，请稍后再试。",
      });
      setHasSuccessfulRequest(false);
      setRedirectCountdown(null);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (redirectCountdown === null) {
      return;
    }

    if (redirectCountdown <= 0) {
      setRedirectCountdown(null);
      navigate("/", { replace: true });
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

  return (
    <div className="login-shell">
      <div className="login-card">
        <p className="login-eyebrow">derbrid secure</p>
        <p className="login-subhead">请输入注册邮箱以接收密码重置链接。</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="input-field">
            <span>邮箱</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              required
            />
          </label>
          {status && (
            <p className={`login-info login-info-${status.variant}`}>
              {status.message}
            </p>
          )}
          {!hasSuccessfulRequest && (
            <button
              type="submit"
              className="primary-button login-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "发送中…" : "发送密码重置邮件"}
            </button>
          )}
          {redirectCountdown !== null && (
            <p className="login-hint">
              {redirectCountdown} 秒后将自动返回首页…
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
        </div>
      </div>
    </div>
  );
}
