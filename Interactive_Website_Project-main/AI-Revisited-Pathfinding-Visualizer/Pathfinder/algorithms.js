/* =========================================================
   Search algorithms
   Each one returns { visitedOrder, path, cost }
   - visitedOrder: cells in the order they were explored (for animation)
   - path: cells from start to end ([] if no path)
   Cells are numbers: index = row * cols + col
   ========================================================= */

// Small binary heap so Dijkstra / A* stay fast on big grids
class MinHeap {
    constructor() { this.items = []; }
    get size() { return this.items.length; }
    push(item, priority) {
        this.items.push({ item, priority });
        let i = this.items.length - 1;
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.items[parent].priority <= this.items[i].priority) break;
            [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
            i = parent;
        }
    }
    pop() {
        const top = this.items[0];
        const last = this.items.pop();
        if (this.items.length) {
            this.items[0] = last;
            let i = 0;
            for (;;) {
                const l = i * 2 + 1, r = l + 1;
                let smallest = i;
                if (l < this.items.length && this.items[l].priority < this.items[smallest].priority) smallest = l;
                if (r < this.items.length && this.items[r].priority < this.items[smallest].priority) smallest = r;
                if (smallest === i) break;
                [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
                i = smallest;
            }
        }
        return top.item;
    }
}

function neighbours(cell, grid) {
    const { rows, cols, walls } = grid;
    const r = Math.floor(cell / cols);
    const c = cell % cols;
    const out = [];
    if (r > 0) out.push(cell - cols);
    if (c < cols - 1) out.push(cell + 1);
    if (r < rows - 1) out.push(cell + cols);
    if (c > 0) out.push(cell - 1);
    return out.filter((n) => !walls[n]);
}

function manhattan(a, b, cols) {
    return Math.abs(Math.floor(a / cols) - Math.floor(b / cols)) + Math.abs((a % cols) - (b % cols));
}

function buildPath(cameFrom, end, grid) {
    if (!cameFrom.has(end)) return { path: [], cost: 0 };
    const path = [];
    let cost = 0;
    for (let cur = end; cur !== undefined && cur !== null; cur = cameFrom.get(cur)) {
        path.push(cur);
        if (cameFrom.get(cur) !== null) cost += grid.weights[cur];
    }
    return { path: path.reverse(), cost };
}

// Breadth-first search: explores in rings. Shortest path only when all costs are equal.
function bfs(grid) {
    const { start, end } = grid;
    const cameFrom = new Map([[start, null]]);
    const queue = [start];
    const visitedOrder = [];
    let head = 0;
    while (head < queue.length) {
        const cur = queue[head++];
        visitedOrder.push(cur);
        if (cur === end) break;
        for (const n of neighbours(cur, grid)) {
            if (!cameFrom.has(n)) {
                cameFrom.set(n, cur);
                queue.push(n);
            }
        }
    }
    return { visitedOrder, ...buildPath(cameFrom, end, grid) };
}

// Depth-first search: dives deep down one route. Fast to write, NOT shortest.
function dfs(grid) {
    const { start, end } = grid;
    const cameFrom = new Map([[start, null]]);
    const stack = [start];
    const seen = new Set();
    const visitedOrder = [];
    while (stack.length) {
        const cur = stack.pop();
        if (seen.has(cur)) continue;
        seen.add(cur);
        visitedOrder.push(cur);
        if (cur === end) break;
        for (const n of neighbours(cur, grid).reverse()) {
            if (!seen.has(n)) {
                cameFrom.set(n, cur);
                stack.push(n);
            }
        }
    }
    return { visitedOrder, ...buildPath(cameFrom, end, grid) };
}

// Shared engine for Dijkstra, A* and Greedy – they only differ in the priority they use.
function prioritySearch(grid, mode) {
    const { start, end, cols } = grid;
    const cameFrom = new Map([[start, null]]);
    const costSoFar = new Map([[start, 0]]);
    const closed = new Set();
    const heap = new MinHeap();
    const visitedOrder = [];
    heap.push(start, 0);

    while (heap.size) {
        const cur = heap.pop();
        if (closed.has(cur)) continue;
        closed.add(cur);
        visitedOrder.push(cur);
        if (cur === end) break;

        for (const n of neighbours(cur, grid)) {
            const newCost = costSoFar.get(cur) + grid.weights[n];
            if (mode === "greedy") {
                if (!cameFrom.has(n)) {
                    cameFrom.set(n, cur);
                    costSoFar.set(n, newCost);
                    heap.push(n, manhattan(n, end, cols));
                }
            } else if (!costSoFar.has(n) || newCost < costSoFar.get(n)) {
                costSoFar.set(n, newCost);
                cameFrom.set(n, cur);
                const h = mode === "astar" ? manhattan(n, end, cols) : 0;
                heap.push(n, newCost + h);
            }
        }
    }
    return { visitedOrder, ...buildPath(cameFrom, end, grid) };
}

const ALGORITHMS = {
    astar: {
        name: "A* search",
        run: (g) => prioritySearch(g, "astar"),
        about: "A* = Dijkstra + a smart guess (distance to the finish). It is guaranteed to find the cheapest path, and usually explores far fewer cells.",
    },
    dijkstra: {
        name: "Dijkstra",
        run: (g) => prioritySearch(g, "dijkstra"),
        about: "Dijkstra always expands the cheapest cell so far, so it handles potholes (extra cost) and is guaranteed to find the cheapest path.",
    },
    bfs: {
        name: "Breadth-first search",
        run: bfs,
        about: "BFS spreads out in rings. It finds the path with the fewest steps but ignores pothole costs.",
    },
    greedy: {
        name: "Greedy best-first",
        run: (g) => prioritySearch(g, "greedy"),
        about: "Greedy only looks at how close each cell is to the finish. Very fast, but it can be fooled and is NOT guaranteed to be shortest.",
    },
    dfs: {
        name: "Depth-first search",
        run: dfs,
        about: "DFS follows one route as deep as it can before backtracking. It finds *a* path, but usually a long, winding one.",
    },
};
