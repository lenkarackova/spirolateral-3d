/**
 * Spirolateral Model Generator with Chaikin Corner Rounding and Segment Bulging (Curvature)
 */
class Spirolateral {
  constructor(segmentNr = 6, angle = 98) {
    this.segmentLength = 10;
    this.initX = 0;
    this.initY = 0;
    this.maxCycles = 1000;
    this.maxUnclosedCycles = 7;

    this.segmentNr = segmentNr;
    this.inputAngle = angle;
    this.angle = 180 - angle;
    this.closed = false;
    this.rawPolygon = [];
    this.polygon = [];
    this.reverseTurns = [];

    this.cornerRounding = 0.0;
    this.segmentCurving = 0.0;

    this.generate();
  }

  getPolygon() {
    return this.polygon;
  }

  isClosed() {
    return this.closed;
  }

  setAngle(angle) {
    this.inputAngle = angle;
    this.angle = 180 - angle;
    this.generate();
  }

  setSegmentNumber(segmentNr) {
    this.segmentNr = segmentNr;
    this.reverseTurns = this.reverseTurns.filter(t => t > 0 && t <= this.segmentNr);
    this.generate();
  }

  setReverseTurns(strOrArray) {
    this.reverseTurns = [];
    let list = [];
    if (Array.isArray(strOrArray)) {
      list = strOrArray;
    } else if (typeof strOrArray === 'string') {
      list = strOrArray.split(/[\s,;]+/).map(s => parseInt(s.trim(), 10));
    }

    for (const turnNr of list) {
      if (!isNaN(turnNr) && turnNr > 0 && turnNr <= this.segmentNr) {
        if (!this.reverseTurns.includes(turnNr)) {
          this.reverseTurns.push(turnNr);
        }
      }
    }
    this.generate();
  }

  setRoundingAndCurving(rounding, curving) {
    this.cornerRounding = Math.max(0.0, Math.min(1.0, rounding));
    this.segmentCurving = Math.max(-1.0, Math.min(1.0, curving));
    this.applyCurvature();
  }

  generate() {
    this.rawPolygon = [];
    this.closed = false;

    let x = this.initX;
    let y = this.initY;

    let distance = 0;
    let cycleNr = 0;
    let angleMultiplier = 0;
    let angleDeg = 0;
    let angleRad = 0;

    this.rawPolygon.push({ x: this.initX, y: this.initY });

    for (; cycleNr < this.maxCycles; cycleNr++) {
      distance = this.segmentLength;

      for (let i = 0; i < this.segmentNr; i++) {
        if (this.reverseTurns.includes(i + 1)) {
          angleMultiplier--;
        } else {
          angleMultiplier++;
        }

        angleDeg = (angleMultiplier * this.angle) % 360;
        angleRad = angleDeg * (Math.PI / 180.0);

        x += distance * Math.cos(angleRad);
        y += distance * Math.sin(angleRad);

        distance += this.segmentLength;

        this.rawPolygon.push({ x, y });
      }

      const roundedX = Math.floor(100 * x + 0.5) / 100;
      const roundedY = Math.floor(100 * y + 0.5) / 100;
      if (roundedX === this.initX && roundedY === this.initY) {
        this.closed = true;
        break;
      }
    }

    if (!this.closed) {
      const maxPts = this.maxUnclosedCycles * this.segmentNr + 1;
      if (this.rawPolygon.length > maxPts) {
        this.rawPolygon.length = maxPts;
      }
    }

    this.applyCurvature();
  }

  applyCurvature() {
    let pts = this.rawPolygon.map(p => ({ x: p.x, y: p.y }));

    if (Math.abs(this.segmentCurving) > 0.01 && pts.length > 1) {
      const curved = [];
      const segSteps = 8;
      const n = pts.length - 1;
      for (let i = 0; i < n; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 1e-4) {
          curved.push(p1);
          continue;
        }

        const nx = -dy / dist;
        const ny = dx / dist;
        const sagitta = this.segmentCurving * (dist * 0.35);

        for (let k = 0; k < segSteps; k++) {
          const u = k / segSteps;
          const bx = (1 - u) * p1.x + u * p2.x + 4 * sagitta * u * (1 - u) * nx;
          const by = (1 - u) * p1.y + u * p2.y + 4 * sagitta * u * (1 - u) * ny;
          curved.push({ x: bx, y: by });
        }
      }
      curved.push(pts[pts.length - 1]);
      pts = curved;
    }

    if (this.cornerRounding > 0.01 && pts.length >= 3) {
      const isLoop = (pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y);
      let ring = isLoop ? pts.slice(0, -1) : pts.slice();
      const t = 0.05 + 0.20 * this.cornerRounding;
      const iterations = this.cornerRounding > 0.5 ? 2 : 1;

      for (let iter = 0; iter < iterations; iter++) {
        const nextRing = [];
        const count = ring.length;
        for (let i = 0; i < count; i++) {
          const p0 = ring[i];
          const p1 = ring[(i + 1) % count];
          const q = {
            x: (1 - t) * p0.x + t * p1.x,
            y: (1 - t) * p0.y + t * p1.y
          };
          const r = {
            x: t * p0.x + (1 - t) * p1.x,
            y: t * p0.y + (1 - t) * p1.y
          };
          nextRing.push(q);
          nextRing.push(r);
        }
        ring = nextRing;
      }

      if (isLoop) {
        ring.push({ x: ring[0].x, y: ring[0].y });
      }
      pts = ring;
    }

    this.polygon = pts;
    this.normalize();
  }

  getBoundingRect() {
    if (this.polygon.length === 0) {
      return { x: 0, y: 0, width: 1, height: 1 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const pt of this.polygon) {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }
    return {
      x: minX,
      y: minY,
      width: Math.max(1e-5, maxX - minX),
      height: Math.max(1e-5, maxY - minY)
    };
  }

  normalize() {
    const rect = this.getBoundingRect();
    for (const pt of this.polygon) {
      pt.x -= rect.x;
      pt.y -= rect.y;
    }
  }
}

window.Spirolateral = Spirolateral;