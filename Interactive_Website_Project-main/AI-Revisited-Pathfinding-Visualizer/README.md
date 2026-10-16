# Pathfinding Visualizer :world_map:

> 🤖 **AI Revisited project**

<p align="center">
  <img src="preview.png" alt="Pathfinding Visualizer preview" width="800">
</p>

Draw walls and potholes, then watch five classic search algorithms race to find a route from start to finish. It's a hands-on way to understand the algorithms behind GPS navigation and game AI.

## Features
- **5 algorithms:** A*, Dijkstra, Breadth-first search, Greedy best-first and Depth-first search.
- **Draw on the grid** with mouse or finger: walls, **potholes** (cost 5 to drive through) and an eraser.
- Drag the start ▶ and finish ★ anywhere.
- **Maze generator** (randomised recursive backtracker), with extra openings and potholes so there's more than one route.
- Animated exploration with 4 speeds, and a **Stop** button mid-run.
- Live stats: cells explored, path length, path cost and run time.
- **"Compare algorithms" table:** runs all five on the same board and shows which found the cheapest path.

## What you'll learn
- Why **BFS** finds the fewest *steps* but not the cheapest route when some cells cost more.
- How **Dijkstra** handles weighted cells, and how **A\*** adds a heuristic (Manhattan distance) to explore far fewer cells.
- Why **Greedy** and **DFS** are fast but not guaranteed to be shortest.
- How a **binary heap** (priority queue) keeps Dijkstra and A* fast.

## Code structure
- `algorithms.js`: the five algorithms and a small `MinHeap`. They don't touch the page, so they're easy to read and test.
- `script.js`: the grid, drawing with pointer events, maze generation and animation.
- `style.css`: the board, animations and layout.

## How to Use
1. Clone the repository: `git clone https://github.com/MasegoLeRoux/Interactive_Website_Project.git`
2. Open `AI-Revisited-Pathfinding-Visualizer/Pathfinder/index.html` in your browser.
3. Click **Generate maze**, pick an algorithm and press **▶ Find path**.

## License
This project is licensed under the [MIT License](../LICENSE).
