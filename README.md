# 3D Spirolateral Generator

An interactive web-based generator for parametric spirolateral curves, optimized for multi-color 3D printing and 2D vector export.

**Live Demo:** [Launch Application](https://lenkarackova.github.io/spirolateral-3d/)

## Overview

Spirolaterals are geometric figures formed by a sequence of steps of increasing length with a constant turn angle, optionally reversing turn directions at specific steps[cite: 2]. This tool converts mathematical spirolateral paths into clean, manifold 3D geometry ready for slicing, as well as crisp 2D vector graphics[cite: 2].

## Features

* **Parametric Curve Control:** Adjust segment count, turn angle, specific reversal steps, corner rounding, and wall curving in real time[cite: 2].
* **3D Print Optimization:** Line widths are constrained to multiples of a standard `0.4 mm` nozzle diameter (`0.4 mm` to `2.4 mm`) for clean perimeter slicing without unwanted gap fill[cite: 2].
* **Multi-Layer Architecture:** Supports 1-color (outline only), 2-color (outline + inner fill), and 3-color (outline + inner fill + solid base) configurations[cite: 2].
* **Real-Time 2D & 3D Preview:** Switch between a 2D vector view and an interactive 3D viewport with matte and silk filament shading[cite: 2].
* **Random Closed-Shape Generator:** Built-in randomizer that automatically validates and filters for closed, printable geometric loops[cite: 2].
* **Direct Export:**
  * **`.3MF`** – Multi-part 3D mesh with separate layer objects ready for multi-material slicers (Bambu Studio, PrusaSlicer, OrcaSlicer)[cite: 2].
  * **`.SVG`** – Clean 2D vector paths for plotting, laser cutting, or graphic design[cite: 2].

## Tech Stack

* Vanilla JavaScript (ES6+), HTML5 Canvas, CSS3[cite: 2]
* **Three.js** – 3D viewport, lighting, and mesh generation[cite: 2]
* **Clipper.js** – 2D polygon offsetting and boolean operations[cite: 2]
* **JSZip** – Client-side `.3mf` package assembly

## License

Released under the [MIT License](LICENSE).