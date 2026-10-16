# Countdown Timer :pancakes:

<p align="center">
  <img src="Web capture_19-8-2023_155644_127.0.0.1.jpeg" alt="Countdown Timer preview" width="800">
</p>

A simple web page that counts down, live, to the next New Year's Day.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [How to Use](#how-to-use)
- [Countdown Logic](#countdown-logic)
- [Updates (2026)](#updates-2026)
- [Credits](#credits)
- [License](#license)

## Features
- Live countdown in days, hours, minutes and seconds, updated every second.
- Always targets the **next** 1 January, so it never goes out of date.
- Shows a "Happy New Year" message when the clock hits zero, then starts counting to the following year.
- Responsive text that scales down on phones.

## Technologies Used
- **HTML5** for the timer layout.
- **CSS3** for styling (Flexbox, `clamp()` for responsive font sizes).
- **JavaScript** for the countdown logic.

## How to Use
1. Clone or download this repository.
2. Open `CountDownTimer/index.html` in your browser.
3. Watch the countdown to New Year's Day.

## Countdown Logic
The logic lives in `CountDownTimer/script.js`:

1. `getNextNewYear()` works out the date of the next 1 January.
2. Every second, `countdown()` subtracts the current time from that date.
3. The difference in seconds is split into days, hours, minutes and seconds.
4. Single digits are padded with a leading zero (`05` instead of `5`).
5. When the difference reaches zero, the celebration message is shown.

```javascript
function getNextNewYear() {
  const now = new Date();
  return new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
}

const totalSeconds = Math.max(0, (newYearsDate - Date.now()) / 1000);
const days = Math.floor(totalSeconds / 3600 / 24);
const hours = Math.floor(totalSeconds / 3600) % 24;
const mins = Math.floor(totalSeconds / 60) % 60;
const seconds = Math.floor(totalSeconds) % 60;
```

## Updates (2026)
Fixes and improvements in the 2026 update:
- **Fixed:** the target date was hard-coded to `1 Jan 2024`, so the timer showed negative numbers after that. It now calculates the next New Year automatically.
- **Fixed:** the CSS, JavaScript and background image used absolute paths (`/CountDownTimer/...`), which broke the page when opened directly or on GitHub Pages. They are now relative.
- **Added:** a "Happy New Year" message at zero, responsive font sizes, a fallback background colour and a text shadow for readability.
- **Updated:** this README now describes what the app actually does (the old one mentioned input fields and a Start button that don't exist).

## Credits
Background photo by Anders Jildén on [Unsplash](https://unsplash.com/photos/AkUR27wtaxs).

## License
This project is licensed under the [MIT License](../LICENSE).
