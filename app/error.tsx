"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("Game error:", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-slate-400 mb-6">
            The game encountered an unexpected error. Don&apos;t worry — your
            progress is safe. Try refreshing or starting a new round.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/15 transition-colors"
            >
              Go Home
            </button>
          </div>
          {error.digest && (
            <p className="text-slate-600 text-xs mt-4 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
