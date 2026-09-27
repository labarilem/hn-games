import { SubmitGameForm } from "@/components/SubmitGameForm";

export default function Submit() {
  return (
    <div className="editorial-page">
      <h1 className="text-4xl font-bold mb-4">Submit a Game</h1>
      <p className="text-gray-400 mb-8">
        Have you found or created a game that was featured on Hacker News?
        <br></br>
        Help us grow the catalog by submitting it!
      </p>
      <div className="hn-surface p-6">
        <SubmitGameForm />
        <p className="mt-6 text-gray-400 text-sm">
          We&apos;ll review your submission and add it to the catalog if it
          meets our{" "}
          <a href="/about" className="hn-link underline underline-offset-2">
            criteria
          </a>
          .
        </p>
      </div>
    </div>
  );
}
