# Amapiano Beat Maker :musical_keyboard:

> 🤖 **AI Revisited project**

<p align="center">
  <img src="preview.png" alt="Amapiano Beat Maker preview" width="800">
</p>

A 16-step drum machine for making amapiano grooves in the browser. **Every sound (log drum, kick, clap, shaker, hi-hat and jazzy keys) is synthesised live with the Web Audio API.** There are no audio files at all.

## Features
- 6 tracks × 16 steps, with a step highlight that moves in time with the music.
- **Pitched log drum:** click a log-drum step more than once to cycle low → mid → high → off.
- Tempo (90–130 BPM), **swing** and volume controls.
- 3 built-in patterns plus a "🎲 Surprise me" groove generator.
- **Share button:** your whole beat is encoded into the link, so a friend opening it hears exactly what you made.
- Your last beat is saved automatically.
- Click a track name to preview its sound. Press <kbd>Space</kbd> to play or stop.

## How it works
| Sound | How it's made |
|-------|---------------|
| Log drum | Sine + triangle oscillators with a fast pitch drop, soft distortion (`WaveShaper`) and a closing low-pass filter |
| Kick | Sine wave sweeping from 150 Hz down to 42 Hz |
| Clap | Three quick bursts of band-pass-filtered white noise |
| Shaker / Hi-hat | Very short high-pass-filtered noise |
| Keys | A five-note Am9 chord of slightly detuned triangle waves |

Timing uses a **look-ahead scheduler**: JavaScript wakes up every 25 ms and books the notes for the next 100 ms on the audio clock. This keeps the beat tight even when the page is busy, which a plain `setInterval` can't do.

## Technologies Used
- **Web Audio API**: oscillators, filters, gain envelopes, a compressor and a wave shaper.
- **JavaScript**: scheduler, pattern encoding for share links, `localStorage`, Clipboard API.
- **CSS3**: CSS Grid sequencer, custom properties per track and tempo-synced animations.

## How to Use
1. Clone the repository: `git clone https://github.com/MasegoLeRoux/Interactive_Website_Project.git`
2. Open `AI-Revisited-Amapiano-Beat-Maker/Beat-Maker/index.html` in your browser.
3. Press **▶ Play**, then click steps to change the beat.

## License
This project is licensed under the [MIT License](../LICENSE).
