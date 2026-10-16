# Marvel Characters :anatomical_heart:

<p align="center">
  <img src="Web%20capture_16-9-2023_204023_127.0.0.1.jpeg" alt="Marvel Characters app preview" width="800">
</p>

Search for any Marvel character and see their picture and description, using data from the official Marvel Comics API.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup: API keys](#setup-api-keys)
- [How to Use](#how-to-use)
- [Updates (2026)](#updates-2026)
- [License](#license)

## Features
- Live suggestions as you type (after 3 letters).
- Character card with image, name and description.
- Search with the button or by pressing Enter.
- Clear messages for empty searches, characters that aren't found, missing API keys and network errors.
- Responsive layout for phones.

## Technologies Used
- **HTML5** for the layout.
- **CSS3** for styling (custom neon font for the heading).
- **JavaScript** `fetch`, `async/await`, `URLSearchParams` and `AbortController` to talk to the Marvel API.

## Setup: API keys
The Marvel API needs three values, which go in `api-Keys.js`:

1. Create a free account at [developer.marvel.com](https://developer.marvel.com/) and copy your **public** and **private** keys.
2. Add `localhost` / `127.0.0.1` (and your GitHub Pages domain, if you use it) to your list of authorised referrers on the Marvel developer portal.
3. Pick a timestamp, for example `1`.
4. Create the hash: `md5(ts + privateKey + publicKey)`. For example, in a terminal:
   ```bash
   echo -n "1YOUR_PRIVATE_KEYYOUR_PUBLIC_KEY" | md5sum
   ```
5. Fill in `api-Keys.js`:
   ```javascript
   const ts = "1";
   const publicKey = "YOUR_PUBLIC_KEY";
   const hashVal = "THE_MD5_HASH";
   ```

> ⚠️ Never put your **private** key in the code. Anyone who can see `api-Keys.js` can use your public key and hash, so think twice before pushing real values to a public repository.

If the app says it can't reach the Marvel API, check your keys, your authorised referrers and that the Marvel developer service is online.

## How to Use
1. Open `index.html` in your browser (or run it with a local server such as VS Code Live Server).
2. Start typing a name, e.g. `spider`, and pick a suggestion, or type a full name and press **Submit**.
3. The character's picture and description appear below.

## Updates (2026)
Fixes and improvements in the 2026 update:
- **Fixed:** `style.css` had a second copy of the whole stylesheet pasted inside another rule, which broke the styling. It is now one clean stylesheet.
- **Fixed:** `index.html` was missing its opening `<head>` tag and `<meta charset>`.
- **Fixed:** suggestions only appeared on an exact name match (`name=`). They now use `nameStartsWith`, so they actually autocomplete.
- **Fixed:** suggestions were built with `onclick="displayWords('...')"` strings, which broke on names with apostrophes and was unsafe. They now use event listeners.
- **Fixed:** absolute font path, `http://` image links being blocked on `https` pages, and search text not being URL-encoded.
- **Added:** error handling, "not found" and missing-key messages instead of `alert()`, Enter-to-search, typing delay (fewer API calls), cancelling old requests, and a mobile layout.
- **Added:** this README.

## License
This project is licensed under the [MIT License](../LICENSE). Data provided by Marvel. © Marvel.
