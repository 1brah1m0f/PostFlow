import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <h1 className="text-5xl font-bold text-purple-700 mb-4">PostFlow</h1>
      <p className="text-lg text-gray-600 mb-8">Schedule Instagram posts. Automatically.</p>
      <div className="flex gap-4">
        <Link href="/login" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          Get Started
        </Link>
        <Link href="/login" className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50">
          Sign In
        </Link>
      </div>
    </main>
  );
}
