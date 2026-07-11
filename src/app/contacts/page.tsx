import Link from "next/link";

export default function ContactsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-center">Contacts</h1>

      <p className="mb-4 text-gray-300">
        Currently the sole maintainer of this project is Marco Labarile.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">
          Where to Find Me
        </h2>
        <ul className="space-y-4 text-gray-300">
          <li>
            <span className="font-semibold">Website: </span>
            <Link
              href="https://marcolabarile.me/"
              className="hn-link underline underline-offset-2"
            >
              marcolabarile.me
            </Link>
          </li>
          <li>
            <span className="font-semibold">Email: </span>
            <span >hackernewsgames at Google&apos;s email provider dot com</span>
          </li>
          <li>
            <span className="font-semibold">GitHub Issues: </span>
            <Link
              href="https://github.com/labarilem/hn-games/issues"
              className="hn-link underline underline-offset-2"
            >
              github.com/labarilem/hn-games/issues
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
