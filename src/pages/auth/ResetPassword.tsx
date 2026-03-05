import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { authApi } from "../../api/authApi";

export function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ password: string; confirmPassword: string }>();

  const password = watch("password");

  const onSubmit = async (data: { password: string }) => {
    if (!token) return;
    setError("");
    try {
      await authApi.resetPassword(token, data.password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || "Reset failed");
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Password Reset</h1>
          <p>Your password has been reset successfully. Redirecting to login...</p>
          <Link to="/login">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Invalid Link</h1>
          <p>This reset link is invalid or has expired.</p>
          <Link to="/forgot-password">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <div className="error-msg">{error}</div>}
          <div>
            <input
              type="password"
              placeholder="New Password"
              {...registerField("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Min 6 characters" },
              })}
            />
            {errors.password && (
              <span className="field-error">{errors.password.message}</span>
            )}
          </div>
          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              {...registerField("confirmPassword", {
                required: "Please confirm password",
                validate: (v) =>
                  v === password || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <span className="field-error">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>
          <button type="submit">Reset Password</button>
        </form>
        <p>
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
