import Link from "next/link";
export default function NotFound() {
  return (
    <div className="editorial-page">
      <p className="eyebrow">NOT IN THIS COLLECTION</p>
      <div className="not-found-number" aria-hidden="true">
        404
      </div>
      <h1>This one got away.</h1>
      <p>
        The page may have moved, or the game may no longer be in the catalog.
      </p>
      <Link href="/" className="hn-btn-primary mt-6">
        Back to discovering games ↗
      </Link>
    </div>
  );
}
