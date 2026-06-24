// pages/auth/ForgotPassword.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '../../components/common';
import AuthService from '../../core/services/auth';
import { usePageTitle } from '../../core/hooks/usePageTitle';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  usePageTitle("Forget Password")
  // ─── Cleanup timers on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) {
        clearTimeout(navigateTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // ─── Handle countdown and navigation ──────────────────────────────────────
  const startCountdownAndNavigate = useCallback(() => {
    setCountdown(10);
    
    // Start countdown timer
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set timeout to navigate after 5 seconds
    navigateTimerRef.current = setTimeout(() => {
      navigate('/account/verify', {
        state: { 
          email: email,
          type: 'password_reset'
        }
      });
    }, 10000);
  }, [email, navigate]);

  // ─── Handle form submission ──────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // FIXED: Pass email as object
      const response = await AuthService.forgotPassword( email );
      
      if (response.success) {
        setSubmitted(true);
        toast.success('Success', { 
          description: 'Password reset code sent to your email' 
        });
        startCountdownAndNavigate();
      } else {
        setError(response.message || 'Failed to send reset code. Please try again.');
        toast.error('Error', { 
          description: response.message || 'Failed to send reset code' 
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      toast.error('Error', { 
        description: err.message || 'Failed to send reset code' 
      });
    } finally {
      setLoading(false);
    }
  }, [email, startCountdownAndNavigate]);

  const handleBackToLogin = useCallback(() => {
    if (navigateTimerRef.current) {
      clearTimeout(navigateTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    navigate('/login');
  }, [navigate]);

  const handleResendLink = useCallback(() => {
    setSubmitted(false);
    setEmail('');
    setCountdown(10);
    if (navigateTimerRef.current) {
      clearTimeout(navigateTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
  }, []);

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="relative overflow-hidden bg-card border border-border px-5 py-9">
        {/* Top gradient bar */}
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, var(--primary-color) 0%, #818CF8 100%)",
          }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex flex-col items-center gap-2.5 mb-7">
          <img src="/logo.png" width={250} height={90} alt="" />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text">Forgot Password</h1>
          <p className="text-text-light text-sm mt-2">
            Enter your email address and we'll send you a code to reset your password
          </p>
        </div>

        {/* Card */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-text">Check Your Email</h2>
              <p className="text-text-light mt-2">
                We've sent a verification code to <strong>{email}</strong>
              </p>
              <p className="text-sm text-text-light mt-1">
                Please check your inbox and enter the code to reset your password.
              </p>
              
              {/* Countdown Timer */}
              <div className="mt-4 p-3 bg-primary-10 rounded-lg">
                <p className="text-sm text-text">
                  Redirecting to verification in <strong className="text-primary">{countdown}</strong> seconds...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  onClick={handleResendLink}
                  variant="outline"
                  className="w-full"
                >
                  Resend Code
                </Button>
                <Button
                  onClick={handleBackToLogin}
                  variant="ghost"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(value: string) => {
                    setEmail(value);
                    if (error) setError(null);
                  }}
                  prefixIcon={<Mail className="w-4 h-4 text-text-light" />}
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </Button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex items-center gap-2 mx-auto text-sm text-text-light hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-[11.5px] text-text-light leading-relaxed">
          MIVA Prestige Ent - Hydraulic Management System
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;