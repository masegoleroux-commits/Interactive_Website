# Pixel Art Studio :art:

> 🤖 **AI Revisited project**

<p align="center">
  <img src="preview.png" alt="Pixel Art Studio preview" width="800">
</p>

A pixel art editor that runs in the browser. Draw retro sprites and icons, then download them as crisp PNG files.

## Features
- **Tools:** pencil, eraser, flood fill, colour picker, line and rectangle (with a live preview while you drag).
- **Mirror mode** for drawing symmetrical characters twice as fast.
- **Undo / redo** (up to 100 steps).
- Canvas sizes from 16×16 to 48×48.
- **Mzansi palette** (including the South African flag colours), any custom colour, and a "recent colours" row.
- **Export to PNG** at 1×, 8×, 16× or 32× with a transparent background.
- Live actual-size preview, and your artwork is saved automatically.
- Works with mouse, pen and touch. Keyboard shortcuts: <kbd>B</kbd> pencil, <kbd>E</kbd> eraser, <kbd>G</kbd> fill, <kbd>I</kbd> picker, <kbd>L</kbd> line, <kbd>R</kbd> box, <kbd>M</kbd> mirror, <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd>.

## How it works
- The drawing is stored as a plain **array of colours**, one per pixel. The canvas just draws that array, which makes undo/redo (saving copies of the array), saving and exporting simple.
- **Bresenham's line algorithm** fills in gaps when you move the pointer quickly, and draws the Line tool.
- **Flood fill** uses a stack instead of recursion, so filling a big area can't crash the browser.
- A second transparent `<canvas>` on top shows shape previews without touching the drawing.

## Technologies Used
- **Canvas API** with `image-rendering: pixelated` for sharp pixels.
- **Pointer Events** for one code path across mouse, pen and touch.
- **JavaScript**: algorithms, history stacks, `localStorage` and PNG export with `toDataURL`.

## How to Use
1. Clone the repository: `git clone https://github.com/MasegoLeRoux/Interactive_Website_Project.git`
2. Open `AI-Revisited-Pixel-Art-Studio/Pixel-Studio/index.html` in your browser.

## License
This project is licensed under the [MIT License](../LICENSE).
