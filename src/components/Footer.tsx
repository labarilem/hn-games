export default function Footer() {
  return (
    <footer className="bg-[#242424] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center flex-wrap justify-center gap-x-3 text-gray-400">
            <a href="/about" className="hover:text-[#646cff] transition-colors">
              About
            </a>
            <span className="select-none">·</span>
            <a
              href="/submit"
              className="hover:text-[#646cff] transition-colors"
            >
              Submit
            </a>
            <span className="select-none">·</span>
            <a
              href="/random"
              className="hover:text-[#646cff] transition-colors"
            >
              Random
            </a>
            <span className="select-none">·</span>
            <a href="/rip" className="hover:text-[#646cff] transition-colors">
              RIP
            </a>
            <span className="select-none">·</span>
            <a href="/stats" className="hover:text-[#646cff] transition-colors">
              Stats
            </a>
            <span className="select-none">·</span>
            <a
              href="https://github.com/labarilem/hn-games"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#646cff] transition-colors"
            >
              Source Code
            </a>
            <span className="select-none">·</span>
            <a
              href="/contacts"
              className="hover:text-[#646cff] transition-colors"
            >
              Contacts
            </a>
            <span className="select-none">·</span>
            <a
              href="/newsletter"
              className="hover:text-[#646cff] transition-colors"
            >
              Newsletter
            </a>
          </div>
          <div className="hover:text-[#646cff] transition-colors">
            <a
              href="https://marcolabarile.me"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              Made by Marco Labarile with
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 mt-0.5"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
