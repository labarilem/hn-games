import Link from "next/link";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-width footer-inner">
        <div>
          <Link href="/" className="footer-brand">
            HN / GAMES<span aria-hidden="true">■</span>
          </Link>
          <p>Independent games. A shared curiosity.</p>
        </div>
        <nav aria-label="Footer navigation" className="footer-nav">
          <Link href="/about">About the catalog</Link>
          <Link href="/submit">Submit a game</Link>
          <Link href="/stats">Statistics</Link>
          <Link href="/contacts">Contact</Link>
          <a
            href="https://github.com/labarilem/hn-games"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub ↗
          </a>
        </nav>
        <a
          className="footer-credit"
          href="https://marcolabarile.me"
          target="_blank"
          rel="noopener noreferrer"
        >
          An independent project
          <br />
          by Marco Labarile ↗
        </a>
      </div>
    </footer>
  );
}
