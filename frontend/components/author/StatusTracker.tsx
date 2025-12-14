"use client";

import { Check, Clock, FileText, AlertCircle, XCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Status =
    | "draft"
    | "submitted"
    | "under_review"
    | "changes_requested"
    | "approved"
    | "published"
    | "rejected";

interface StatusTrackerProps {
    status: Status | string;
    className?: string;
}

const STEPS = [
    { id: "draft", label: "Draft", icon: FileText },
    { id: "submitted", label: "Submitted", icon: Send },
    { id: "under_review", label: "In Review", icon: Clock },
    { id: "approved", label: "Approved", icon: Check },
    { id: "published", label: "Published", icon: Check },
];

export function StatusTracker({ status, className }: StatusTrackerProps) {
    const normStatus = (status || "draft").toLowerCase();

    // Determine current step index
    let currentIndex = 0;
    let isRejected = normStatus === "rejected";
    let isRevision = normStatus === "changes_requested" || normStatus === "revise";

    if (normStatus === "published") currentIndex = 4;
    else if (normStatus === "approved") currentIndex = 3;
    else if (normStatus === "under_review" || isRevision) currentIndex = 2; // Review stage
    else if (normStatus === "submitted") currentIndex = 1;
    else currentIndex = 0; // draft

    return (
        <div className={cn("w-full py-6 px-4 md:px-0", className)}>
            {/* Steps Container - Wider max-width for better spacing */}
            <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto">

                {/* Background Line */}
                <div className="absolute top-5 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full -z-0" />

                {/* Active Progress Line */}
                <div
                    className={cn(
                        "absolute top-5 left-0 h-1.5 transition-all duration-700 rounded-full z-0",
                        isRejected ? "bg-rose-500" : isRevision ? "bg-amber-500" : "bg-indigo-600"
                    )}
                    style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
                />

                {/* Steps */}
                {STEPS.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const Icon = step.icon;

                    // Color logic
                    let bgClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400";
                    let ringClass = "";

                    if (isCompleted) {
                        bgClass = "bg-indigo-600 border-indigo-600 text-white";
                    }

                    // Override for special current states
                    if (isCurrent) {
                        if (isRejected) {
                            bgClass = "bg-rose-500 border-rose-500 text-white";
                            ringClass = "ring-4 ring-rose-100 dark:ring-rose-900/30";
                        } else if (isRevision) {
                            bgClass = "bg-amber-500 border-amber-500 text-white";
                            ringClass = "ring-4 ring-amber-100 dark:ring-amber-900/30";
                        } else {
                            // Standard current
                            ringClass = "ring-4 ring-indigo-100 dark:ring-indigo-900/30 shadow-lg shadow-indigo-500/20";
                        }
                    }

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center group">
                            {/* Icon Circle */}
                            <div
                                className={cn(
                                    "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                    bgClass,
                                    ringClass
                                )}
                            >
                                {isCurrent && isRejected ? <XCircle size={20} /> :
                                    isCurrent && isRevision ? <AlertCircle size={20} /> :
                                        <Icon size={isCurrent ? 20 : 18} strokeWidth={isCurrent ? 2.5 : 2} />}
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "absolute top-14 text-[10px] md:text-xs font-bold tracking-wider uppercase text-center min-w-[80px] transition-all duration-300",
                                    isCurrent ? "text-slate-900 dark:text-white transform scale-110" : "text-slate-400 dark:text-slate-600"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Status Message Footer */}
            <div className="mt-12 text-center min-h-[24px]">
                <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm border",
                    isRejected ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400" :
                        isRevision ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400" :
                            normStatus === "approved" ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400" :
                                normStatus === "published" ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400" :
                                    "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                )}>
                    {isRejected && "This article was rejected."}
                    {isRevision && "Changes requested by editor."}
                    {normStatus === "approved" && "Approved! Ready for publication."}
                    {normStatus === "published" && "Published • Live on platform"}
                    {normStatus === "submitted" && "Submitted • Awaiting Review"}
                    {normStatus === "under_review" && "Currently under review by editors"}
                    {normStatus === "draft" && "Draft • Work in progress"}
                </div>
            </div>
        </div>
    );
}
