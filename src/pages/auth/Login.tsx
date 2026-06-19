import React, { useState } from "react";
import { Button, Input } from "../../components/common";
import { Lock, Mail } from "lucide-react";

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

const LoginPage: React.FC = () => {
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (field: keyof LoginForm) => (value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof LoginErrors])
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsLoading(true);
    setSubmitError("");
    try {
      await new Promise((res) => setTimeout(res, 1400));
      // navigate("/dashboard");
    } catch {
      setSubmitError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div
        className={[
          "relative  overflow-hidden",
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
            className="flex items-center gap-2 px-3 py-2.5  mb-4
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

export default LoginPage;
