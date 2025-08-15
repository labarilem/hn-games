import axios from "axios";

export async function isValidGameUrl(
  url: string
): Promise<{ isValid: boolean; responseText: string }> {
  if (!url) return { isValid: true, responseText: "" }; // Consider empty URLs as valid (they'll become empty strings in the entity)

  try {
    // NOTE: cloudflare filter is hard to implement, so we'll just ignore it for now
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
      },
      timeout: 5000, // 5 seconds
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400, // Consider 2xx and 3xx as valid
    });

    if (!res.data) {
      console.log(`Invalid URL (empty response body): ${url}`);
      return { isValid: false, responseText: "" };
    }

    const responseText =
      typeof res.data === "string" ? res.data : JSON.stringify(res.data);

    const parkedDomainsBlacklist = ["Porkbun Marketplace"];
    if (parkedDomainsBlacklist.some((b) => responseText.includes(b))) {
      console.log(`Invalid URL (blacklisted content): ${url}`);
      return { isValid: false, responseText };
    }

    return { isValid: true, responseText };
  } catch (error) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? error.message
        : "Unknown error";
    console.log(`Invalid URL (${msg}): ${url}`);
    return { isValid: false, responseText: "" };
  }
}