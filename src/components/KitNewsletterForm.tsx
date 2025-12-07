"use client";

import { FormEvent, useState } from "react";

export default function KitNewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(
        "https://app.kit.com/forms/8838549/subscriptions",
        {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(e.target as HTMLFormElement),
        }
      );

      const data = await res.json();

      if (res.ok && data.status === "success") {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setErrorMsg(data?.message || "Something went wrong.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  return (
    <div className="w-full">
      {status === "success" ? (
        <p className="text-green-400 font-medium">
          Thanks! Check your inbox to confirm your subscription
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-4 w-full"
        >
          <input
            type="email"
            name="email_address"
            aria-label="Email Address"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none min-w-0"
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-[#646cff] text-white px-4 py-2 rounded hover:bg-[#747bff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            {status === "loading" ? (
              <>
                <span className="opacity-0">Subscribe</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </>
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-2 text-red-400 text-sm">{errorMsg}</p>
      )}
      <p className="mt-6 text-gray-400 text-sm">
        If you don't see our emails in your inbox, please check your spam
        folder.
      </p>

      <p className="text-gray-600 text-sm pt-5">
        <a
          href="https://kit.com/features/forms?utm_campaign=poweredby&amp;utm_content=form&amp;utm_medium=referral&amp;utm_source=dynamic"
          target="_blank"
          rel="nofollow"
        >
          Built with Kit
        </a>
      </p>
    </div>
  );
}
