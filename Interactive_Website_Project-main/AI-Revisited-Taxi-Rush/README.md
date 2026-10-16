# Taxi Rush :minibus:

> 🤖 **AI Revisited project**

<p align="center">
  <img src="preview.png" alt="Taxi Rush preview" width="800">
</p>

An arcade game with a Mzansi twist. Drive a minibus taxi, pick up passengers for fares and dodge potholes, cones and traffic. The road keeps getting faster.

## Features
- Three-lane endless driving game drawn entirely with the **Canvas API** (no images).
- Collect passengers 🙋🏾 for **R15** each; grab a ❤ to win back a life.
- Avoid potholes, cones and slower cars. You have 3 lives.
- Speed and traffic slowly increase the longer you survive.
- Screen shake, particles, floating "+R15" text and a short phone vibration on a crash.
- **Controls:** arrow keys / A-D on a computer, tap or swipe on a phone. <kbd>P</kbd> or <kbd>Esc</kbd> pauses.
- Pauses automatically when you switch tabs; best score is saved.

## How it works
- A `requestAnimationFrame` **game loop** with **delta time**, so the game runs at the same speed on 60 Hz and 120 Hz screens.
- Objects are spawned in rows that never block all three lanes at once, so there's always a way through.
- Simple **axis-aligned box collisions** with slightly smaller hit boxes, so near-misses feel fair.
- Short invincibility after a hit (the taxi blinks) so one pothole can't take all your lives.

## Technologies Used
- **Canvas 2D API** for all graphics and animation.
- **JavaScript**: game state machine (menu → playing → paused → over), pointer and keyboard input, Vibration API, `localStorage`.
- **CSS3** for the HUD and overlay screens.

## How to Use
1. Clone the repository: `git clone https://github.com/MasegoLeRoux/Interactive_Website_Project.git`
2. Open `AI-Revisited-Taxi-Rush/Taxi-Rush/index.html` in your browser.
3. Press **Start driving**.

## License
This project is licensed under the [MIT License](../LICENSE).
