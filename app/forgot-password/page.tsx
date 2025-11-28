import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function ForgotPassword() {
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
              Forgot Password?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center px-2">
              Enter your email address and we’ll send you a password reset link.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                className="w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <Button className="w-full h-9 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-shadow">
              Send Reset Link
            </Button>
          </form>

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
