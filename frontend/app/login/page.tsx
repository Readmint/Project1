// src/app/(your-path)/login/page.tsx  (use your original path; file contents below)
"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { postJSON } from "@/lib/api";
import { signInWithGoogle } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

/**
 * Helper: robust token extractor from various backend shapes
 */
function extractToken(resp: any): string | undefined {
  return (
    resp?.data?.token ||
    resp?.data?.accessToken ||
    resp?.token ||
    resp?.accessToken ||
    resp?.data?.idToken ||
    undefined
  );
}

/**
 * Helper: decode JWT payload (unsafe client-side decode only for UI use)
 */
function decodeJwt(token?: string) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const validateForm = () => {
    const newErrors: any = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const redirectByRole = (user: any) => {
    // Normalize role check and redirect accordingly
    const role = user?.role || user?.roles || user?.roleName;
    if (role === "author") {
      router.push("/author-dashboard");
    } else if (role === "reader") {
      router.push("/reader-dashboard");
    } else if (role === "editor") {
      router.push("/editor-dashboard");
    } else {
      // fallback for other roles (reviewer, content_manager, admin, etc.)
      router.push("/");
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Send only email/password (do not include idToken: undefined)
      const res = await postJSON("/auth/login", { email, password });

      // Try to extract token from many possible shapes
      const token = extractToken(res);

      // Save token to localStorage under ACCESS_TOKEN (consistent)
      if (token) {
        try {
          localStorage.setItem("ACCESS_TOKEN", token);
        } catch (err) {
          console.warn("Could not write token to localStorage", err);
        }
      }

      // Server might return a user object too
      let user = res?.data?.user || res?.user || null;

      // If server didn't return user, derive basic user object from token payload
      if (!user && token) {
        const payload = decodeJwt(token);
        user = {
          id: payload?.sub || payload?.uid || payload?.userId,
          email: payload?.email,
          role: payload?.role || payload?.roles || payload?.roleName,
        };
      }

      if (user) {
        try {
          localStorage.setItem("user", JSON.stringify(user));
        } catch (err) {
          console.warn("Could not write user to localStorage", err);
        }
      }

      // Redirect using user info if available, else to homepage
      if (user) redirectByRole(user);
      else router.push("/");
    } catch (err: any) {
      console.error("Login error:", err);
      const message =
        (err && err.data && err.data.message) ||
        err?.message ||
        "Login failed";
      setErrors((prev) => ({ ...prev, password: message }));
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Firebase OAuth - No backend endpoint needed
  const handleGoogle = async () => {
    setOauthLoading("google");
    try {
      // Firebase handles everything on frontend
      const result = await signInWithGoogle();
      const user = result.user;

      console.log("Google sign-in successful:", user.email);

      // Get user data from Firebase
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      };

      // Store Firebase-only user data in localStorage (temporary)
      try {
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        console.warn("localStorage write failed", err);
      }

      // Try to read role from Firebase ID token claims (custom claims)
      try {
        const idTokenResult: any = await user.getIdTokenResult();
        const claims = idTokenResult?.claims || {};
        const claimRole = claims.role || claims.roles || claims.roleName;

        if (claimRole) {
          // If role available in claims, create a richer user object and redirect
          const finalUser = { ...userData, role: claimRole };
          try {
            localStorage.setItem("user", JSON.stringify(finalUser));
          } catch (err) {
            console.warn("could not persist finalUser", err);
          }

          // Optionally store idToken as app token (if you want)
          const idToken = idTokenResult?.token;
          if (idToken) {
            try {
              localStorage.setItem("ACCESS_TOKEN", idToken);
            } catch (err) {
              console.warn("Could not write idToken to localStorage", err);
            }
          }

          redirectByRole(finalUser);
          return;
        }
      } catch (claimErr) {
        console.log("Could not read ID token claims:", claimErr);
        // Continue; we'll try backend sync next
      }

      // Optional: Sync with backend to get app token and role
      try {
        const idToken = await user.getIdToken();
        const res = await postJSON("/auth/sync-user", {
          idToken,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
        });

        // Store app token if backend returns one
        const token = extractToken(res);
        if (token) {
          try {
            localStorage.setItem("ACCESS_TOKEN", token);
          } catch (err) {
            console.warn("Could not persist ACCESS_TOKEN", err);
          }
        }

        const backendUser = res?.data?.user || res?.user;
        if (backendUser) {
          try {
            localStorage.setItem("user", JSON.stringify(backendUser));
          } catch (err) {
            console.warn("Could not persist backendUser", err);
          }
          redirectByRole(backendUser);
          return; // we already redirected
        }
      } catch (syncError) {
        console.log("Backend sync optional - using Firebase auth only", syncError);
        // Continue with Firebase-only flow
      }

      // If no backend sync and no claims role, default to generic redirect (home)
      router.push("/");
    } catch (err: any) {
      console.error("Google sign-in failed", err);
      const message = err.message || "Google sign-in failed";
      setErrors((prev) => ({ ...prev, email: message }));
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="bubble-bg min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-2 text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Button>
        </Link>

        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-5 sm:p-6">
          {/* Logo */}
          <div className="mb-4 flex flex-col items-center">
            <Image src="/icons/icon.png" alt="E-Magazine Logo" width={48} height={48} className="mb-1.5" />
            <h4 className="text-xl sm:text-2xl text-center text-slate-900 dark:text-white mb-0.5">Welcome Back</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center">
              Sign in to your E-Magazine account
            </p>
          </div>

          {/* FORM */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* EMAIL FIELD */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                className={`w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border ${
                  errors.email ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                } text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">Password</label>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full h-9 text-sm pr-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border ${
                    errors.password ? "border-red-500" : "border-slate-300 dark:border-slate-600"
                  } text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                />

                {/* SHOW / HIDE BUTTON */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <label className="flex items-center text-xs sm:text-sm text-slate-900 dark:text-slate-300">
                <input type="checkbox" className="mr-2 w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" />
                Remember me
              </label>

              <Link href="/forgot-password" className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* 🔥 Social Login Buttons */}
          <div className="mt-5 space-y-3">
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
                {oauthLoading === "google" ? "Connecting..." : "Continue with Google"}
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
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Continue with Facebook</span>
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
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Continue with Apple</span>
            </button>

            <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-4">
              Don't have an account?{" "}
              <Link href="/signup" className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
