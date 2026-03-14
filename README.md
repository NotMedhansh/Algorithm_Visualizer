# Algorithm Visualizer

![Live Demo](https://img.shields.io/badge/Live-Demo-green?style=for-the-badge\&logo=vercel)

**Interactive visualization tool for learning algorithms through animations.**

This project helps students and developers understand how algorithms work internally by visualizing them step-by-step. Instead of just reading pseudocode, users can see algorithms executing in real time.

## Live Demo

https://algovisualizer-alpha.vercel.app

---

# Features

* Interactive algorithm animations
* Visual comparison of sorting techniques
* Graph traversal visualizations
* Backtracking algorithm demonstration
* Prime number generation visualization
* Clean UI designed for learning

---

# Algorithms Implemented

## Sorting Algorithms

* Bubble Sort
* Merge Sort
* Quick Sort
* Heap Sort

## Graph / Pathfinding Algorithms

* Breadth First Search (BFS)
* Depth First Search (DFS)
* Dijkstra's Algorithm
* A* Search Algorithm

## Searching

* Binary Search

## Backtracking

* N-Queens Problem

## Geometry

* Convex Hull

  * Graham Scan
  * Jarvis March

## Number Theory

* Sieve of Eratosthenes (Prime Numbers)

---

# Time Complexity Overview

| Algorithm     | Best       | Average    | Worst      |
| ------------- | ---------- | ---------- | ---------- |
| Bubble Sort   | O(n)       | O(n²)      | O(n²)      |
| Merge Sort    | O(n log n) | O(n log n) | O(n log n) |
| Quick Sort    | O(n log n) | O(n log n) | O(n²)      |
| Heap Sort     | O(n log n) | O(n log n) | O(n log n) |
| Binary Search | O(log n)   | O(log n)   | O(log n)   |
| BFS / DFS     | O(V + E)   | O(V + E)   | O(V + E)   |

---

# Tech Stack

* **React**
* **Vite**
* **JavaScript**
* **HTML**
* **CSS**

---

# Project Structure

```
Algorithm_Visualizer
│
├── public/        # Static assets
├── src/           # React source code
│   ├── components
│   ├── algorithms
│   ├── pages
│   └── styles
│
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

# Installation

Clone the repository

```
git clone https://github.com/NotMedhansh/Algorithm_Visualizer.git
```

Go to project folder

```
cd Algorithm_Visualizer
```

Install dependencies

```
npm install
```

Run the development server

```
npm run dev
```

---

# Deployment

The project is deployed using **Vercel**.

Every commit pushed to the GitHub repository automatically triggers a new deployment.

---

# Future Improvements

* Add more graph algorithms
* Add animation speed control
* Add algorithm explanations
* Add complexity comparison charts
* Add dark/light theme toggle

---

# Author

**Medhansh Khurana**

B.Tech CSE Student interested in algorithms, problem solving and software development.

GitHub:
https://github.com/NotMedhansh
