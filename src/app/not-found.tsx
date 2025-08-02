import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold text-white mb-4">404 - Page Not Found</h1>
      <p className="text-gray-400 text-lg mb-8">
        Oops! Looks like this page got lost in an infinite game loop...
      </p>
      <div className="text-gray-400 text-md mb-8">
        <p>Have you tried:</p>
        <ul className="mt-2">
          <li>↑ ↑ ↓ ↓ ← → ← → B A Start?</li>
          <li>Blowing on the cartridge?</li>
          <li>Buying the DLC?</li>
        </ul>
      </div>
      <Link
        href="/"
        className="bg-[#646cff] text-white px-4 py-2 rounded hover:bg-[#747bff] transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}
