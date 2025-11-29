"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { postJSON, postOAuth } from "@/lib/api";
import { signInWithGoogle, signInWithMicrosoft } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

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
      // receive JWT token and user
      const token = res.data.token;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/");
    } catch (err: any) {
      const msg = err?.data?.message || "Sign up failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase OAuth flows for signup
  const handleGoogle = async () => {
    setOauthLoading('google');
    try {
      const result = await signInWithGoogle();
      const idToken = await result.user.getIdToken();
      const res = await postOAuth(idToken, 'google');
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/");
    } catch (err: any) {
      console.error("Google OAuth failed", err);
      const message = err?.data?.message || "Google sign-up failed";
      setError(message);
    } finally {
      setOauthLoading(null);
    }
  };

  const handleMicrosoft = async () => {
    setOauthLoading('microsoft');
    try {
      const result = await signInWithMicrosoft();
      const idToken = await result.user.getIdToken();
      const res = await postOAuth(idToken, 'microsoft');
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/");
    } catch (err: any) {
      console.error("Microsoft OAuth failed", err);
      const message = err?.data?.message || "Microsoft sign-up failed";
      setError(message);
    } finally {
      setOauthLoading(null);
    }
  };

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
                {oauthLoading === 'facebook' ? "Signing up..." : "Sign up with Facebook"}
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
                {oauthLoading === 'apple' ? "Signing up..." : "Sign up with Apple"}
              </span>
            </button>

            {/* Microsoft */}
            <button 
              type="button" 
              onClick={handleMicrosoft}
              disabled={oauthLoading !== null}
              className="w-full h-10 flex items-center justify-center gap-2 
                         bg-white/40 dark:bg-slate-900/40 
                         backdrop-blur-xl border border-slate-300/40 dark:border-slate-700/40 
                         rounded-lg shadow-md hover:shadow-xl transition-all duration-300 
                         hover:bg-white/60 dark:hover:bg-slate-900/60
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image src="/icons/microsoft.png" width={18} height={18} alt="Microsoft" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {oauthLoading === 'microsoft' ? "Signing up..." : "Sign up with Microsoft"}
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