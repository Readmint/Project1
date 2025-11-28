"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
          <form className="space-y-2.5">
            
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
              />
            </div>

            {/* Dropdown: Join As */}
            <div>
              <label className="block text-xs font-medium text-slate-900 dark:text-slate-200 mb-1">
                I want to join as
              </label>
              <select
                required
                className="w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 border-slate-300 dark:border-slate-600 pr-10"
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
                className="w-full h-9 text-sm bg-white/70 dark:bg-slate-900/70 border-slate-300 dark:border-slate-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-[1.75rem] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start pt-1">
              <input
                type="checkbox"
                required
                className="mr-2 mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 flex-shrink-0"
              />
              <span className="text-xs text-slate-900 dark:text-slate-300 leading-tight">
                I agree to the{" "}
                <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Terms & Conditions
                </Link>
              </span>
            </div>

            {/* Button */}
            <Button className="w-full h-9 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-shadow mt-3">
              Create Account
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-3">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}