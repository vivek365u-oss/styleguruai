import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-black">404</h1>
      <p className="text-gray-400">Page not found</p>
      <Link to="/" className="text-purple-400 hover:text-purple-300 transition">← Go Home</Link>
    </div>
  );
}
