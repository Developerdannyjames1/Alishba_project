import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { register as registerUser } from "../../store/authSlice";
import type { RegisterData } from "../../api/authApi";

export function Register() {
  const [error, setError] = useState("");
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterData & { confirmPassword: string }>();

  const role = watch("role", "attendee");

  const onSubmit = async (data: RegisterData & { confirmPassword: string }) => {
    setError("");
    const { confirmPassword, ...payload } = data;
    const result = await dispatch(registerUser(payload));
    if (registerUser.rejected.match(result)) {
      setError(result.payload as string);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Register</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <div className="error-msg">{error}</div>}
          <div>
            <input
              type="text"
              placeholder="Name"
              {...registerField("name", { required: "Name is required" })}
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              {...registerField("email", { required: "Email is required" })}
            />
            {errors.email && (
              <span className="field-error">{errors.email.message}</span>
            )}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
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
                required: "Confirm password",
                validate: (val, form) =>
                  val === form.password || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && (
              <span className="field-error">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>
          <div>
            <select {...registerField("role")}>
              <option value="attendee">Attendee</option>
              <option value="exhibitor">Exhibitor</option>
              <option value="organizer">Organizer</option>
            </select>
          </div>
          {role === "exhibitor" && (
            <div>
              <input
                type="text"
                placeholder="Company"
                {...registerField("company")}
              />
            </div>
          )}
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
