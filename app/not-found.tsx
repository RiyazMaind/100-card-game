import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-5xl mb-4">🃏</div>
          <h2 className="text-6xl font-black text-indigo-400 mb-2">404</h2>
          <h3 className="text-xl font-bold text-white mb-2">
            Card Not Found
          </h3>
          <p className="text-slate-400 mb-6">
            Looks like this card doesn&apos;t exist in any deck. Let&apos;s get
            you back to the game!
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
          >
            Back to Game
          </Link>
        </div>
      </div>
    </div>
  );
}
