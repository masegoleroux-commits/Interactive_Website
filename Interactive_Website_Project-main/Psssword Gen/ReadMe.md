# Password Generator :lock:

<p align="center">
  <img src="Web capture_21-8-2023_135854_.jpeg" alt="Password Generator preview" width="800">
</p>

## Description

The Password Generator is a web tool that creates strong, random passwords right in your browser. Nothing is sent to a server.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Updates (2026)](#updates-2026)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository: `git clone https://github.com/MasegoLeRoux/Interactive_Website_Project.git`
2. Go to the project folder: `cd "Interactive_Website_Project/Psssword Gen/Password Genarator"`
3. Open `index.html` in your preferred web browser.

## Usage

1. Open the password generator in your browser. A password is generated straight away.
2. Choose a length (4–64) and tick the character types you want.
3. Click **Generate Password**.
4. Click **Copy** to copy it to your clipboard.

## Features

- Adjustable password length (4–64 characters).
- Options for uppercase letters, lowercase letters, numbers and symbols.
- Uses the browser's **cryptographically secure** random generator (`crypto.getRandomValues`).
- Guarantees at least one character from every type you ticked, in a random position.
- Strength meter showing the estimated entropy in bits.
- One-click copy with on-page confirmation.
- Works on phones as well as desktops.

## Updates (2026)
Fixes and improvements in the 2026 update:
- **Security fix:** passwords were generated with `Math.random()`, which is predictable. They now use `crypto.getRandomValues()`.
- **Security fix:** the guaranteed characters were always placed first in the same order (uppercase, lowercase, number, symbol). The password is now shuffled.
- **Fixed:** with no boxes ticked the button produced an empty password with no message. All boxes now start ticked, and you get a clear message if none are selected.
- **Fixed:** the length wasn't checked, so typing 1000 or a negative number misbehaved. It is now kept between 4 and 64.
- **Fixed:** the Generate button had dark-red text on a red background, the Copy button only appeared on mouse hover (so it was invisible on phones), and `min-width: 600px` made the page overflow on mobile.
- **Fixed:** invalid CSS (`size: 50vh`) and the Poppins font being used without being loaded.
- **Improved:** replaced the `alert()` pop-up and the deprecated `document.execCommand("copy")` with the modern Clipboard API (with a fallback), and added a strength meter.

> The folder and file names (`Psssword Gen`, `Password Genarator`, `stripts.js`) are kept as they were so existing links keep working.

## Contributing

Contributions are welcome! If you find a bug or want to add a feature, feel free to open a pull request.

## License

This project is licensed under the [MIT License](../LICENSE). The fonts in `Fonts/` belong to their creators; see `Fonts/font info.txt`.
