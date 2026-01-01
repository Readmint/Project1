"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { postJSON } from "@/lib/api";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");

  /* import { postJSON } from "@/lib/api"; */ // Ensure this import is added at top

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data: any = await postJSON("/auth/forgot-password", { email });
      setStep(2);
      setMessage(data.message || "OTP sent to your email. Please check your inbox.");
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data: any = await postJSON("/auth/verify-reset-otp", { email, otp });
      setResetToken(data.data.resetToken);
      setStep(3);
      setMessage("");
    } catch (err: any) {
      setError(err?.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await postJSON("/auth/reset-password", {
        resetToken,
        email,
        newPassword
      });

      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bubble-bg min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/login">
          <Button variant="ghost" className="mb-2 text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft size={18} />
            Back to Login
          </Button>
        </Link>

        {/* Forgot Password Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-5 sm:p-6">
          {/* Logo + Title */}
          <div className="mb-4 flex flex-col items-center">
            <Image
              src="/icons/icon.png"
              alt="E-Magazine Logo"
              width={48}
              height={48}
              className="mb-1.5"
            />
            <h4 className="text-xl sm:text-2xl text-center text-slate-900 dark:text-white mb-0.5">
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Verify OTP"}
              {step === 3 && "Reset Password"}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center px-2">
              {step === 1 && "Enter your email address and we'll send you an OTP."}
              {step === 2 && "Enter the 6-digit OTP sent to your email."}
              {step === 3 && "Enter your new password."}
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Step 1: Email Form */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-9 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">
                  6-digit OTP
                </label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-center tracking-widest"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  OTP sent to: {email}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setError("");
                  }}
                  className="flex-1 h-9"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 h-9 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 h-9"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-9 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-3">
            Remembered your password?{" "}
            <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}