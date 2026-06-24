import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../../core/services/auth";
import { Button, Input } from "../../components/common";
import { Lock, Mail } from "lucide-react";
import { useStore } from "../../core/contexts/StoreProvider";
import { ENTITY_KEY, setStoredItem, USER_KEY } from "../../core/hooks/useStore";
import { UserRole } from "../../core/types";
import { usePageTitle } from "../../core/hooks/usePageTitle";

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

function validate(form: LoginForm): LoginErrors {
  const errors: LoginErrors = {};
  if (!form.email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

const Login: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  usePageTitle("Login");
  const navigate = useNavigate();

  // ✅ Single useStore call — reads from the shared singleton context
  const { setUser, setEntity, adminExists, checkAdminExists } = useStore();

  // If no admin exists, redirect to admin creation
  React.useEffect(() => {
    if (adminExists === false) {
      navigate("/create-admin", { replace: true });
    }
  }, [adminExists, navigate]);

  const handleChange = (field: keyof LoginForm) => (value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof LoginErrors])
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setSubmitError("");

    try {
      const response = await AuthService.login(form.email, form.password);

      if (response.success) {
        const userData = response.results;
        const user = {
          ...userData,
          role: userData.role as UserRole,
          last_login: userData?.last_login || "",
          permissions: userData?.permissions as any,
        };

        // ✅ Step 1: Persist to localStorage
        setStoredItem(USER_KEY, user);

        // ✅ Step 2: Update the shared store state
        setUser(user);

        // ✅ Step 3: Refresh admin status (force = true, skips stale cache)
        await checkAdminExists(true);

        // ✅ Step 4: Check user role and entity status
        const userRole = user.role;
        const hasEntities = user.entities && user.entities.length > 0;
        let redirectPath = "/dashboard"; // Default path

        // Check if user is super_admin
        if (userRole === "super_admin") {
          // Super admin goes to dashboard regardless of entities
          redirectPath = "/dashboard";
        }
        // Check if user is admin
        else if (userRole === "admin" || userRole === "super_admin") {
          if (hasEntities) {
            // Admin with entities goes to dashboard
            setEntity(user.entities[0])
            // setStoredItem(ENTITY_KEY, user.entities[0]);
            redirectPath = "/dashboard";
          } else {
            // Admin without entities goes to create organisation
            // ✅ FIX: Use navigate instead of window.location.href
            redirectPath = "/account/create-organisation";
          }
        }
        // User is regular user (not super_admin or admin)
        else {
          if (hasEntities) {
            // Regular user with entities goes to dashboard
            redirectPath = "/dashboard";
            setEntity(user.entities[0])

          } else {
            // Regular user without entities goes to contact admin page
            redirectPath = "/access-denied";
          }
        }

        // ✅ Step 5: Navigate to the appropriate page
        navigate(redirectPath, { replace: true });
      } else {
        setSubmitError("Invalid email or password.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setSubmitError(
        err.response?.data?.message || "Invalid email or password",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div
        className={[
          "relative overflow-hidden",
          "bg-card border border-border",
          "px-5 py-9",
        ].join(" ")}
      >
        {/* Top gradient bar */}
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background:
              "linear-gradient(90deg, var(--primary-color) 0%, #818CF8 100%)",
          }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex flex-col items-center gap-2.5 mb-7">
          <img src="/logo.png" width={250} height={90} alt="" />
        </div>

        {/* Server error */}
        {submitError && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 mb-4
              bg-rose-500/10 border border-rose-500/20 text-[13px] text-rose-400"
            role="alert"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-6">
            <Input
              type="email"
              label="Email address"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange("email")}
              error={errors.email}
              prefixIcon={<Mail size={16} />}
              required
              name="email"
            />
          </div>

          <div className="mb-6">
            <Input
              type="password"
              label="Password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange("password")}
              error={errors.password}
              prefixIcon={<Lock size={16} />}
              required
              name="password"
            />
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between -mt-2 mb-5">
            <Input
              type="checkbox"
              label="Keep me signed in"
              value={form.remember}
              onChange={handleChange("remember")}
              labelType="default"
              size="sm"
              radius="sm"
            />
            <a
              href="/account/forgot-password"
              className="text-[12.5px] font-medium text-primary hover:opacity-75 transition-opacity"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className={[
              isLoading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90",
            ].join(" ")}
            fullWidth
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3 3 3h-4a8 8 0 01-8-8z"
                  />
                </svg>
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-[11.5px] text-text-light leading-relaxed">
          MIVA Prestige Ent - Hydraulic Management System
        </p>
      </div>
    </div>
  );
};

export default Login;
