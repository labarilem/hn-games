export default function Submit() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">Submit a Game</h1>
      <p className="text-gray-400 mb-8">
        Have you found or created a game that was featured on Hacker News?
        <br></br>
        Help us grow the catalog by submitting it!
      </p>
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="mb-6">
          To submit a game, please fill out our{" "}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLScmUuZXeLRr5JqOHm7lm54TrvWncHN_4PGPdprr6oodKXyEFA/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            submission form
          </a>
          .
        </p>

        <p className="text-gray-400">
          We'll review your submission and add it to the catalog if it meets our
          criteria.
        </p>
      </div>
    </div>
  );
}
