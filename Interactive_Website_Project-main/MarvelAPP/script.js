const input = document.getElementById("input-box");
const form = document.getElementById("search-form");
const showContainer = document.getElementById("show-container");
const listContainer = document.querySelector(".list");
const messageEl = document.getElementById("message");

const [timestamp, apiKey, hashValue] = [ts, publicKey, hashVal];
const BASE_URL = "https://gateway.marvel.com/v1/public/characters";

const hasKeys = Boolean(timestamp && apiKey && hashValue);
let suggestController; // lets us cancel an old autocomplete request
let debounceTimer;

function showMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.classList.toggle("error", isError);
}

function buildUrl(params) {
  const query = new URLSearchParams({ ts: timestamp, apikey: apiKey, hash: hashValue, ...params });
  return `${BASE_URL}?${query}`;
}

async function fetchCharacters(params, signal) {
  const response = await fetch(buildUrl(params), { signal });
  if (!response.ok) {
    throw new Error(`Marvel API error (${response.status})`);
  }
  const jsonData = await response.json();
  return jsonData.data.results;
}

function displayWords(value) {
  input.value = value;
  removeElements();
}

function removeElements() {
  listContainer.innerHTML = "";
}

// ---------- Autocomplete ----------
input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  removeElements();
  const value = input.value.trim();
  if (value.length < 3 || !hasKeys) return;

  // wait until the user stops typing for 300ms (fewer API calls)
  debounceTimer = setTimeout(() => suggest(value), 300);
});

async function suggest(value) {
  if (suggestController) suggestController.abort();
  suggestController = new AbortController();

  try {
    // nameStartsWith gives real suggestions; "name=" only matched exact names
    const results = await fetchCharacters({ nameStartsWith: value, limit: 8 }, suggestController.signal);
    removeElements();
    results.forEach((result) => {
      const name = result.name;
      const div = document.createElement("div");
      div.classList.add("autocomplete-items");
      div.setAttribute("role", "option");

      // Build with DOM nodes instead of innerHTML/onclick strings,
      // which broke on names with apostrophes and were unsafe
      const p = document.createElement("p");
      p.className = "item";
      const bold = document.createElement("b");
      bold.textContent = name.substring(0, value.length);
      p.append(bold, name.substring(value.length));
      div.appendChild(p);

      div.addEventListener("click", () => {
        displayWords(name);
        search(name);
      });
      listContainer.appendChild(div);
    });
  } catch (err) {
    if (err.name !== "AbortError") removeElements();
  }
}

// close suggestions when clicking elsewhere
document.addEventListener("click", (e) => {
  if (!form.contains(e.target)) removeElements();
});

// ---------- Search ----------
form.addEventListener("submit", (e) => {
  e.preventDefault(); // pressing Enter now works too
  search(input.value);
});

async function search(rawValue) {
  const value = rawValue.trim();
  removeElements();

  if (value.length < 1) {
    showMessage("Please type a character name.", true); // replaces alert()
    return;
  }

  if (!hasKeys) {
    showMessage("Add your Marvel API keys to api-Keys.js to search (see the README).", true);
    return;
  }

  showContainer.innerHTML = "";
  showMessage("Searching…");

  try {
    const results = await fetchCharacters({ name: value });

    if (results.length === 0) {
      showMessage(`No character called "${value}" was found. Try picking one from the suggestions.`, true);
      return;
    }

    showMessage("");
    results.forEach((element) => {
      const cardContainer = document.createElement("div");
      cardContainer.className = "card-container";

      const characterImageContainer = document.createElement("div");
      characterImageContainer.className = "container-character-image";

      const image = document.createElement("img");
      // the API returns http:// links, which browsers block on https pages
      image.src = `${element.thumbnail.path.replace(/^http:/, "https:")}.${element.thumbnail.extension}`;
      image.alt = element.name;
      characterImageContainer.appendChild(image);

      const characterName = document.createElement("div");
      characterName.className = "character-name";
      characterName.textContent = element.name;

      const characterDescription = document.createElement("div");
      characterDescription.className = "character-description";
      characterDescription.textContent = element.description || "No description available for this character.";

      cardContainer.appendChild(characterImageContainer);
      cardContainer.appendChild(characterName);
      cardContainer.appendChild(characterDescription);

      showContainer.appendChild(cardContainer);
    });
  } catch (err) {
    showMessage("Couldn't reach the Marvel API. Check your keys and internet connection, then try again.", true);
    console.error(err);
  }
}

window.onload = () => {
  if (!hasKeys) {
    showMessage("Add your Marvel API keys to api-Keys.js to start searching (see the README).", true);
  }
};
