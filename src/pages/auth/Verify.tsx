// pages/auth/Verify.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Input } from "../../components/common";
import {
  Mail,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useStore } from "../../core/contexts/StoreProvider";
import AuthService from "../../core/services/auth";
import {
  getStoredItem,
  setStoredItem,
  USER_KEY,
} from "../../core/hooks/useStore";
import { IUser } from "../../core/types";
import { usePageTitle } from "../../core/hooks/usePageTitle";

interface LocationState {
  email?: string;
  type?: 'verification' | 'password_reset';
}

const Verify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const user = getStoredItem<IUser | null>(USER_KEY, null);
  
  const [email, setEmail] = useState(
    state?.email || user?.email || ""
  );
  const verificationType: 'verification' | 'password_reset' = state?.type || 'verification';
  
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  usePageTitle(verificationType === 'password_reset' ? "Reset Password" : "Verify Account");
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setUser, checkAdminExists } = useStore();

  useEffect(() => {
    setTimer(60);
    setCanResend(false);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    const digit = value.slice(-1);
    newOtp[index] = digit;
    setOtp(newOtp);

    if (error) setError("");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digits.length > 0) {
      const newOtp = [...otp];
      digits.split("").forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);

      const nextEmptyIndex = newOtp.findIndex((d) => d === "");
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const prevOtp = [...otp];
        prevOtp[index - 1] = "";
        setOtp(prevOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");

    if (code.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }

    if (!email) {
      setError("Email is required");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // FIXED: Pass email and code as separate parameters
      const response = await AuthService.verifyOTP(email, code);

      if (response.success) {
        setSuccess(response.message);

        if (verificationType === 'password_reset') {
          setTimeout(() => {
            navigate('/create-new-password', {
              state: { 
                email: email, 
                otp: code
              }
            });
          }, 1500);
          return;
        }

        const userData = response.results;
        setStoredItem(USER_KEY, userData);
        setUser(userData);
        await checkAdminExists(true);

        const userRole = userData.role;
        const hasEntities = userData.entities && userData.entities.length > 0;
        const isVerified = userData.verified;

        if (!isVerified) {
          setError("Account not verified. Please contact support.");
          return;
        }

        if (!hasEntities) {
          if (userRole === "admin" || userRole === "super_admin") {
            window.location.href = "/account/create-organisation";
          } else {
            navigate("/contact-admin", { replace: true });
          }
          return;
        }

        navigate("/dashboard", { replace: true });
      } else {
        setError(response.message || "Invalid verification code. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    if (!email) {
      setError("Email is required");
      return;
    }

    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      // FIXED: Pass email as parameter
      const response = await AuthService.resendOTP(email);

      if (response.success) {
        setSuccess("New verification code sent to your email");
        setTimer(60);
        setCanResend(false);
        setOtp(Array(6).fill(""));
        inputRefs.current[0]?.focus();

        const interval = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.message || "Failed to resend code. Please try again.");
      }
    } catch (err: any) {
      console.error("Resend error:", err);
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError("");
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="relative overflow-hidden bg-card border border-border px-5 py-9">
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, var(--primary-color) 0%, #818CF8 100%)",
          }}
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-2.5 mb-7">
          <img src="/logo.png" width={250} height={90} alt="Logo" />
          <h2 className="text-xl font-semibold text-text-primary mt-2">
            {verificationType === 'password_reset' ? 'Reset Password' : 'Verify Your Account'}
          </h2>
          <p className="text-sm text-text-light text-center">
            {verificationType === 'password_reset' 
              ? `Enter the 6-digit code sent to ${email || 'your email'} to reset your password`
              : "We've sent a 6-digit verification code to your email"
            }
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 bg-rose-500/10 border border-rose-500/20 text-[13px] text-rose-400">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-[13px] text-emerald-400">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {!email && (
          <div className="mb-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="you@company.com"
              value={email}
              onChange={handleEmailChange}
              prefixIcon={<Mail size={16} />}
              disabled={isLoading}
              required
              name="email"
            />
          </div>
        )}

        

        <div className="mb-6">
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`
                  w-12 h-14 text-center text-xl font-semibold
                  bg-background border
                  focus:outline-none focus:ring-primary focus:border-transparent
                  transition-all duration-200
                  ${error ? "border-danger-50" : "border-border"}
                  ${digit ? "border-primary bg-primary-5" : ""}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                disabled={isLoading}
                aria-label={`Digit ${index + 1} of 6`}
              />
            ))}
          </div>
          <p className="text-xs text-text-light text-center mt-2">
            {verificationType === 'password_reset' 
              ? "Enter the 6-digit code sent to your email to reset your password"
              : "Enter the 6-digit code sent to your email"
            }
          </p>
        </div>

        <Button
          type="button"
          onClick={handleVerify}
          disabled={isLoading || otp.join("").length < 6}
          className={`
            ${isLoading || otp.join("").length < 6 ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}
          `}
          fullWidth
        >
          {isLoading ? (
            <>
              <Loader size={15} />
              Verifying...
            </>
          ) : (
            verificationType === 'password_reset' ? 'Verify & Reset Password' : 'Verify & Continue'
          )}
        </Button>

        <div className="mt-4 text-center">
          <p className="text-sm text-text-light">
            Didn't receive the code?{" "}
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isResending}
                className={`
                  text-primary font-medium hover:opacity-75 transition-opacity
                  ${isResending ? "opacity-50 cursor-not-allowed" : ""}
                  flex items-center gap-1 inline-flex
                `}
              >
                {isResending && (
                  <RefreshCw
                    size={14}
                    className={isResending ? "animate-spin" : ""}
                  />
                )}
                {isResending ? "Sending..." : "Resend Code"}
              </button>
            ) : (
              <span className="text-text-light">
                Resend available in{" "}
                <span className="font-medium text-primary">{timer}s</span>
              </span>
            )}
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={handleBackToLogin}
            className="text-[12.5px] font-medium text-text-light hover:text-primary transition-colors"
          >
            ← Back to Sign In
          </button>
        </div>

        <p className="mt-5 text-center text-[11.5px] text-text-light leading-relaxed">
          MIVA Prestige Ent - Hydraulic Management System
        </p>
      </div>
    </div>
  );
};

export default Verify;