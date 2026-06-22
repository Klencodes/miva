import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "../../components/common";
import { Mail, Lock, User, Phone, MapPin } from "lucide-react";
import AuthService from "../../core/services/auth";
import { useStore } from "../../core/contexts/StoreProvider";
import { setStoredItem, USER_KEY } from "../../core/hooks/useStore";
import { UserPermissions, UserRole } from "../../core/types";

interface CreateAdminForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirm_password: string;
}

interface CreateAdminErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  confirm_password?: string;
}

function validate(form: CreateAdminForm): CreateAdminErrors {
  const errors: CreateAdminErrors = {};

  if (!form.first_name) {
    errors.first_name = "First name is required.";
  }
  if (!form.last_name) {
    errors.last_name = "Last name is required.";
  }
  if (!form.email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (form.phone && !/^\+?[\d\s-]{8,}$/.test(form.phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
    errors.password = "Password must contain uppercase, lowercase, and number.";
  }

  if (!form.confirm_password) {
    errors.confirm_password = "Please confirm your password.";
  } else if (form.confirm_password !== form.password) {
    errors.confirm_password = "Passwords do not match.";
  }

  return errors;
}

const CreateAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { checkAdminExists, setUser } = useStore();

  const [form, setForm] = useState<CreateAdminForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState<CreateAdminErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (field: keyof CreateAdminForm) => (value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
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
      const response = await AuthService.createAdmin({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
        confirm_password: form.confirm_password,
      });

      if (response.success) {
        const userData = response.results;
        const user = {
          ...userData,
          role: userData.role as UserRole,
          last_login: userData?.last_login || "",
          permissions: userData?.permissions as UserPermissions,
          name: `${userData?.first_name} ${userData?.last_name}`
        };

        // ✅ Step 1: Persist to localStorage
        setStoredItem(USER_KEY, user);

        // ✅ Step 2: Update the shared store state — this is what was missing.
        //    ProtectedRoute reads from the same context instance, so it will
        //    now see isAuthenticatedRef = true before we navigate.
        setUser(user);

        // ✅ Step 3: Refresh admin status (force = true, skips stale cache)
        await checkAdminExists(true);

        // ✅ Step 4: Navigate — ProtectedRoute will now pass the auth check
        navigate("/account/verify", { replace: true });
      } else {
        setSubmitError("Invalid email or password.");
      }
      
    } catch (err: any) {
      console.error("Error creating admin:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to create admin account. Please try again.";
      setSubmitError(errorMessage);
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
          <img src="/logo.png" width={250} height={90} alt="Logo" />
          <p className="text-sm text-text-light text-center">
            Create the first admin account for your system
          </p>
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
          {/* Name Field */}
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <Input
                type="text"
                label="First Name"
                placeholder="John"
                value={form.first_name}
                onChange={handleChange("first_name")}
                error={errors.first_name}
                prefixIcon={<User size={16} />}
                required
                name="first_name"
              />
            </div>
            <div className="mb-4">
              <Input
                type="text"
                label="Last Name"
                placeholder="Doe"
                value={form.last_name}
                onChange={handleChange("last_name")}
                error={errors.last_name}
                prefixIcon={<User size={16} />}
                required
                name="last_name"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="admin@company.com"
              value={form.email}
              onChange={handleChange("email")}
              error={errors.email}
              prefixIcon={<Mail size={16} />}
              required
              name="email"
            />
          </div>

          {/* Phone Field */}
          <div className="mb-4">
            <Input
              type="tel"
              label="Phone Number (Optional)"
              placeholder="+1234567890"
              value={form.phone}
              onChange={handleChange("phone")}
              error={errors.phone}
              prefixIcon={<Phone size={16} />}
              name="phone"
            />
          </div>

          {/* Address Field */}
          <div className="mb-4">
            <Input
              type="text"
              label="Address (Optional)"
              placeholder="123 Main St, City, Country"
              value={form.address}
              onChange={handleChange("address")}
              error={errors.address}
              prefixIcon={<MapPin size={16} />}
              name="address"
            />
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <Input
              type="password"
              label="Password"
              placeholder="Min. 8 characters with uppercase, lowercase & number"
              value={form.password}
              onChange={handleChange("password")}
              error={errors.password}
              prefixIcon={<Lock size={16} />}
              required
              name="password"
            />
          </div>

          {/* Confirm Password Field */}
          <div className="mb-8">
            <Input
              type="password"
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={form.confirm_password}
              onChange={handleChange("confirm_password")}
              error={errors.confirm_password}
              prefixIcon={<Lock size={16} />}
              required
              name="confirm_password"
            />
          </div>

          {/* Submit Button */}
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
                Creating account...
              </>
            ) : (
              "Create Admin Account"
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

export default CreateAdmin;
