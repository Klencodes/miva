// pages/auth/CreateNewPassword.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowLeft, Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '../../components/common';
import AuthService from '../../core/services/auth';
import { usePageTitle } from '../../core/hooks/usePageTitle';

interface LocationState {
  email?: string;
  otp?: string;
}

const CreateNewPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [new_password, setNewPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    color: string;
  } | null>(null);

  const email = state?.email || '';
  const otp = state?.otp || '';
  usePageTitle("Create Password")
  const checkPasswordStrength = useCallback((password: string) => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengthMap = [
      { score: 0, label: 'Very Weak', color: 'text-rose-500' },
      { score: 1, label: 'Weak', color: 'text-rose-400' },
      { score: 2, label: 'Fair', color: 'text-amber-400' },
      { score: 3, label: 'Good', color: 'text-emerald-400' },
      { score: 4, label: 'Strong', color: 'text-emerald-500' },
      { score: 5, label: 'Very Strong', color: 'text-emerald-600' },
    ];

    const result = strengthMap.find((s) => s.score === score) || strengthMap[0];
    return result;
  }, []);

  useEffect(() => {
    if (new_password) {
      setPasswordStrength(checkPasswordStrength(new_password));
    } else {
      setPasswordStrength(null);
    }
  }, [new_password, checkPasswordStrength]);

  const validatePassword = useCallback(() => {
    if (new_password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (new_password !== confirm_password) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  }, [new_password, confirm_password]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp) {
      setError('Missing verification code. Please go back and try again.');
      toast.error('Error', { 
        description: 'Missing verification code. Please try again.' 
      });
      return;
    }

    if (!email) {
      setError('Missing email address. Please go back and try again.');
      toast.error('Error', { 
        description: 'Missing email address. Please try again.' 
      });
      return;
    }

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const response = await AuthService.resetPassword({
        otp,
        email,
        new_password,
        confirm_password,
      });

      if (response.success) {
        setSuccess(true);
        toast.success('Success', { 
          description: 'Password has been reset successfully!' 
        });

        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Password reset successfully! Please login with your new password.' }
          });
        }, 2500);
      } else {
        setError(response.message || 'Failed to reset password. Please try again.');
        toast.error('Error', { 
          description: response.message || 'Failed to reset password' 
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      toast.error('Error', { 
        description: err.message || 'Failed to reset password' 
      });
    } finally {
      setLoading(false);
    }
  }, [new_password, confirm_password, validatePassword, otp, email, navigate]);

  const handleBack = useCallback(() => {
    navigate('/verify', { 
      state: { email, type: 'password_reset' }
    });
  }, [navigate, email]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
      <div className="w-full max-w-[500px] mx-auto">
        <div
          className={[
            "relative overflow-hidden",
            "bg-card border border-border",
            "px-6 py-8",
            "min-h-[500px]", // Add minimum height to prevent shrinking
          ].join(" ")}
        >
          {/* Top gradient bar - matching Login UI */}
          <div
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{
              background:
                "linear-gradient(90deg, var(--primary-color) 0%, #818CF8 100%)",
            }}
            aria-hidden="true"
          />

          {/* Header - matching Login UI */}
          <div className="flex flex-col items-center gap-2.5 mb-6">
            <img src="/logo.png" width={200} height={72} alt="Logo" />
          </div>

          {/* Title section */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold text-text">Create New Password</h1>
            </div>
            <p className="text-sm text-text-light">
              Enter your new password below
            </p>
            {email && (
              <p className="text-xs text-text-light mt-1">
                For: <span className="font-medium text-text">{email}</span>
              </p>
            )}
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold text-text">Password Reset Complete!</h2>
              <p className="text-sm text-text-light mt-2">
                Your password has been successfully updated.
              </p>
              <p className="text-xs text-text-light mt-1">
                Redirecting to login...
              </p>
              <div className="mt-4">
                <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Verification Code - Readonly */}

              {/* New Password */}
              <div className="mb-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="New Password"
                    placeholder="Min. 8 characters"
                    value={new_password}
                    onChange={(value: string) => {
                      setNewPassword(value);
                      if (error) setError(null);
                    }}
                    disabled={loading}
                    required
                    prefixIcon={<Lock size={16} />}
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-3 top-[38px] text-text-light hover:text-text transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password strength indicator */}
                {passwordStrength && new_password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength.score <= 1
                              ? 'bg-rose-500'
                              : passwordStrength.score <= 2
                              ? 'bg-amber-500'
                              : passwordStrength.score <= 3
                              ? 'bg-emerald-400'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength.color} whitespace-nowrap`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-5">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    placeholder="Confirm your new password"
                    value={confirm_password}
                    onChange={(value: string) => {
                      setConfirmPassword(value);
                      if (error) setError(null);
                    }}
                    disabled={loading}
                    required
                    prefixIcon={<Lock size={16} />}
                  />
                </div>
                {confirm_password && new_password !== confirm_password && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Password requirements - matching Login UI style */}
              <div className="text-xs text-text-light space-y-1 mb-5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="font-medium text-text">Password must contain:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li className={new_password.length >= 8 ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                    At least 8 characters {new_password.length >= 8 && '✓'}
                  </li>
                  <li className={/[a-z]/.test(new_password) ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                    Lowercase letter {/[a-z]/.test(new_password) && '✓'}
                  </li>
                  <li className={/[A-Z]/.test(new_password) ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                    Uppercase letter {/[A-Z]/.test(new_password) && '✓'}
                  </li>
                  <li className={/[0-9]/.test(new_password) ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                    Number {/[0-9]/.test(new_password) && '✓'}
                  </li>
                </ul>
              </div>

              {/* Error message - matching Login UI */}
              {error && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 mb-4
                    bg-rose-500/10 border border-rose-500/20 text-[13px] text-rose-500"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button - matching Login UI */}
              <Button
                type="submit"
                disabled={loading || !new_password || !confirm_password || !otp}
                className={[
                  loading || !new_password || !confirm_password || !otp
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:opacity-90",
                ].join(" ")}
                fullWidth
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting Password…
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              {/* Back button - matching Login UI style */}
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 mx-auto mt-4 text-sm text-text-light hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </form>
          )}
        </div>

        {/* Footer - matching Login UI */}
        <p className="mt-5 text-center text-[11.5px] text-text-light leading-relaxed">
          MIVA Prestige Ent - Hydraulic Management System
        </p>
      </div>
  );
};

export default CreateNewPassword;