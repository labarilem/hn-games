import { SubmitGameForm } from "@/components/SubmitGameForm";

export default function Submit() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">Submit a Game</h1>
      <p className="text-gray-400 mb-8">
        Have you found or created a game that was featured on Hacker News?
        <br></br>
        Help us grow the catalog by submitting it!
      </p>
      <div className="bg-[#242424] rounded-lg p-6">
        <SubmitGameForm />
        <p className="mt-6 text-gray-400 text-sm">
          We'll review your submission and add it to the catalog if it meets our{" "}
          <a href="/about" className="text-blue-400 hover:text-blue-300">criteria</a>.
        </p>
      </div>
    </div>
  );
}
