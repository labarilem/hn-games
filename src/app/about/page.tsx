import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-center">About</h1>
      <p className="mb-4 text-gray-300">
        HN Games is a manually curated collection of games made by the HN
        community.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">Mission</h2>
        <p className="mb-4 text-gray-300">
          There are lots of small gems out there made by creative developers and
          artists, and we want to showcase them.
          <br></br>Our goal is to provide a platform where you can discover such
          games and enjoy them.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">
          Game Selection Criteria
        </h2>
        <p className="mb-4 text-gray-300">
          We carefully evaluate games based on the following criteria:
        </p>

        <h3 className="text-l font-semibold mt-6 mb-3 text-white">
          ✅ What We Accept
        </h3>
        <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-300">
          <li>Games posted on HN, made by HN users</li>
          <li>Free or paid games</li>
          <li>Games for any platform (eg. web, mobile, console)</li>
        </ul>

        <h3 className="text-l font-semibold mt-6 mb-3 text-white">
          ❌ What We Don't Accept
        </h3>
        <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-300">
          <li>Bug-ridden or unplayable games</li>
          <li>Unfinished, early-stage prototypes</li>
          <li>Games that need to be built from source</li>
          <li>
            Games binaries hosted on platforms that don't scan for malware
          </li>
          <li>NSFW games</li>
        </ul>

        <p className="mb-4 text-gray-300">
          Ultimately the decision depends solely on the maintainers of this
          project in order to ease things up and keep the project fun to
          maintain.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-white">Contributing</h2>
        <p className="mb-4 text-gray-300">
          We welcome game submissions from the community. If you know a game
          that meets our criteria, please{" "}
          <Link
            href="/submit"
            className="text-[#646cff] hover:text-[#747bff] transition-colors"
          >
            submit it
          </Link>
          . Similarly, if you notice a game in our catalog that doesn't meet
          these standards, let us know and we'll review it.
        </p>
        <p className="mb-4 text-gray-300">
          To encourage all kinds of contributions and give back to the HN
          community, this project is open source and it always will be. The
          source code is available on{" "}
          <Link
            href="https://github.com/labarilem/hn-games"
            className="text-[#646cff] hover:text-[#747bff] transition-colors
            "
          >
            GitHub
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
