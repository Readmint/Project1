"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, EyeOff, Mail, CheckCircle } from "lucide-react";
import Image from "next/image";
import { postJSON } from "@/lib/api";
import { signInWithGoogle } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      setError("");
      const payload = { name, email, password, role: role || "reader" };
      const res = await postJSON("/auth/register", payload);
      
      if (res.data.requiresVerification) {
        setVerificationStep(true);
        setSuccess("Verification email sent! Check your inbox.");
        startResendCooldown();
      } else {
        // If no verification required (fallback)
        const token = res.data.token;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        router.push("/");
      }
    } catch (err: any) {
      const msg = err?.data?.message || "Sign up failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      setError("");
      const res = await postJSON("/auth/verify-email", { email, otp });
      
      setSuccess("Email verified successfully! You can now login.");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      
    } catch (err: any) {
      const msg = err?.data?.message || "Verification failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    try {
      setError("");
      await postJSON("/auth/send-verification", { email });
      setSuccess("Verification email resent!");
      startResendCooldown();
    } catch (err: any) {
      const msg = err?.data?.message || "Failed to resend OTP";
      setError(msg);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Simple Firebase OAuth for signup - Always uses 'reader' role
  const handleGoogle = async () => {
    setOauthLoading('google');
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      
      console.log('Google sign-up successful:', user.email);
      
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        role: 'reader'
      };
      
      localStorage.setItem("user", JSON.stringify(userData));
      
      try {
        const idToken = await user.getIdToken();
        const res = await postJSON("/auth/sync-user", { 
          idToken,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          role: 'reader'
        });
        
        if (res.data?.token) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
      } catch (syncError) {
        console.log('Backend sync failed, using Firebase auth only');
      }
      
      router.push("/");
    } catch (err: any) {
      console.error("Google sign-up failed", err);
      const message = err.message || "Google sign-up failed";
      setError(message);
    } finally {
      setOauthLoading(null);
    }
  };

  // OTP Verification Step
  if (verificationStep) {
    return (
      <div className="bubble-bg min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Link href="/">
            <Button variant="ghost" className="mb-2 text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft size={18} />
              Back to Home
            </Button>
          </Link>

          {/* Verification Card */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="text-xl sm:text-2xl text-center text-slate-900 dark:text-white mb-2">
                Verify Your Email
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            {/* OTP Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-3">
                Enter verification code
              </label>
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  setError("");
                }}
                className="w-full h-12 text-center text-xl font-semibold tracking-widest bg-white/70 dark:bg-slate-900/70 border-slate-300 dark:border-slate-600"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                6-digit code sent to your email
              </p>
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerifyEmail}
              disabled={isLoading || otp.length !== 6}
              className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 text-white font-medium mb-4"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>

            {/* Resend OTP */}
            <div className="text-center">
              <button
                onClick={handleResendOTP}
                disabled={resendCooldown > 0}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 
                  ? `Resend code in ${resendCooldown}s` 
                  : "Didn't receive the code? Resend"
                }
              </button>
            </div>

            {/* Back to signup */}
            <div className="text-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setVerificationStep(false)}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ← Back to sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Original Signup Form
  return (
    <div className="bubble-bg min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-2 text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft size={18} />
            Back to Home
          </Button>
        </Link>

        {/* Signup Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-5 sm:p-6">
          {/* Logo + Header */}
          <div className="mb-3 flex flex-col items-center">
            <Image 
              src="/icons/icon.png"
              alt="E-Magazine Logo"
              width={44}
              height={44}
              className="mb-1.5"
            />
            <h4 className="text-lg sm:text-xl text-center text-slate-900 dark:text-white mb-0.5">
              Create Account
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
              Join E-Magazine and start your reading journey
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-2.5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-200 mb-1">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Jane Doe"
                required
                className="w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 border-slate-300 dark:border-slate-600"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-200 mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                required
                className="w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 border-slate-300 dark:border-slate-600"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            {/* Role Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-200 mb-1">
                I want to join as
              </label>
              <select 
                required 
                className="w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select role</option>
                <option value="reader">Reader</option>
                <option value="author">Author</option>
                <option value="editor">Editor</option>
                <option value="reviewer">Reviewer</option>
              </select>
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-200 mb-1">
                Password
              </label>
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                minLength={6} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 border-slate-300 dark:border-slate-600 pr-10 ${error ? "border-red-500" : ""}`} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-[1.75rem] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-200 mb-1">
                Confirm Password
              </label>
              <Input 
                type={showConfirm ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                minLength={6} 
                value={confirm} 
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 border-slate-300 dark:border-slate-600 pr-10 ${error ? "border-red-500" : ""}`} 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)} 
                className="absolute right-3 top-[1.75rem] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error Message */}
            {error && <p className="text-xs text-red-600 font-medium -mt-1">{error}</p>}

            {/* Terms */}
            <div className="flex items-start pt-1">
              <input type="checkbox" required className="mr-2 mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 flex-shrink-0" />
              <span className="text-xs text-slate-900 dark:text-slate-300 leading-tight">
                I agree to the{" "}
                <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms & Conditions</Link>
              </span>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-9 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-shadow mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-300 dark:border-slate-700"></span>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white/80 dark:bg-slate-800/80 px-2 text-slate-500 dark:text-slate-400">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-2.5 mt-2">
            {/* Google */}
            <button 
              type="button" 
              onClick={handleGoogle}
              disabled={oauthLoading !== null}
              className="w-full h-10 flex items-center justify-center gap-2 
                         bg-white/40 dark:bg-slate-900/40 
                         backdrop-blur-xl border border-slate-300/40 dark:border-slate-700/40 
                         rounded-lg shadow-md hover:shadow-xl transition-all duration-300 
                         hover:bg-white/60 dark:hover:bg-slate-900/60
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image src="/icons/google.png" width={18} height={18} alt="Google" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {oauthLoading === 'google' ? "Signing up..." : "Sign up with Google"}
              </span>
            </button>

            {/* Facebook */}
            <button 
              type="button" 
              disabled={oauthLoading !== null}
              className="w-full h-10 flex items-center justify-center gap-2 
                         bg-white/40 dark:bg-slate-900/40 
                         backdrop-blur-xl border border-slate-300/40 dark:border-slate-700/40 
                         rounded-lg shadow-md hover:shadow-xl transition-all duration-300 
                         hover:bg-white/60 dark:hover:bg-slate-900/60
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image src="/icons/facebook.png" width={18} height={18} alt="Facebook" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Sign up with Facebook
              </span>
            </button>

            {/* Apple */}
            <button 
              type="button" 
              disabled={oauthLoading !== null}
              className="w-full h-10 flex items-center justify-center gap-2 
                         bg-white/40 dark:bg-slate-900/40 
                         backdrop-blur-xl border border-slate-300/40 dark:border-slate-700/40 
                         rounded-lg shadow-md hover:shadow-xl transition-all duration-300 
                         hover:bg-white/60 dark:hover:bg-slate-900/60
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image src="/icons/apple.png" width={18} height={18} alt="Apple" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Sign up with Apple
              </span>
            </button>
          </div>

          <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-3">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}