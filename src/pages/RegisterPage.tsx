import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RegisterPage.css";

interface RegisterResponse {
  success: boolean;
  value: {
    user: {
      _id: string;
      email: string;
      role: string;
    };
    token: string;
  };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:4000/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Registration failed: ${response.statusText}`
        );
      }

      const data: RegisterResponse = await response.json();

      if (data.success && data.value.token) {
        // Store token in localStorage
        localStorage.setItem("authToken", data.value.token);
        localStorage.setItem("user", JSON.stringify(data.value.user));

        setSuccess(true);
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        // Redirect to home page or dashboard after 1.5 seconds
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Create Account</h1>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            Registration successful! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 6 characters)"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="login-link">
          Already have an account?{" "}
          <a href="/login" onClick={(e) => {
            e.preventDefault();
            navigate("/login");
          }}>
            Login here
          </a>
        </div>
      </div>
    </div>
  );
}
