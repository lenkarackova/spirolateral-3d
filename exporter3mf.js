/**
 * Spirolateral 3D Geometry & Bambu Studio 3MF Exporter
 */
const CLIPPER_SCALE = 1000;

function scalePolysToClipper(polys, targetSizeMm) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pts of polys) {
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  const w = Math.max(1e-4, maxX - minX);
  const h = Math.max(1e-4, maxY - minY);
  const scale = targetSizeMm / Math.max(w, h);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return polys.map(pts => {
    const path = [];
    for (const p of pts) {
      const sx = (p.x - cx) * scale;
      const sy = -(p.y - cy) * scale;
      const X = Math.round(sx * CLIPPER_SCALE);
      const Y = Math.round(sy * CLIPPER_SCALE);
      if (path.length === 0 || path[path.length - 1].X !== X || path[path.length - 1].Y !== Y) {
        path.push({ X, Y });
      }
    }
    return path;
  });
}

function makeCircleClipperPath(cxMm, cyMm, radiusMm, segments = 36) {
  const path = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = cxMm + Math.cos(a) * radiusMm;
    const y = cyMm + Math.sin(a) * radiusMm;
    path.push({
      X: Math.round(x * CLIPPER_SCALE),
      Y: Math.round(y * CLIPPER_SCALE)
    });
  }
  return path;
}

function cleanClipperContour(contour) {
  const pts = [];
  if (!contour || contour.length < 3) return pts;

  for (let i = 0; i < contour.length; i++) {
    const prev = contour[(i - 1 + contour.length) % contour.length];
    const curr = contour[i];
    if (curr.X !== prev.X || curr.Y !== prev.Y) {
      pts.push(new THREE.Vector2(curr.X / CLIPPER_SCALE, curr.Y / CLIPPER_SCALE));
    }
  }

  while (pts.length > 2 && pts[pts.length - 1].equals(pts[0])) {
    pts.pop();
  }

  const seen = new Map();
  for (let i = 0; i < pts.length; i++) {
    const key = `${Math.round(pts[i].x * 1000)}_${Math.round(pts[i].y * 1000)}`;
    if (seen.has(key)) {
      const prev = pts[(i - 1 + pts.length) % pts.length];
      const next = pts[(i + 1) % pts.length];
      const dx = (prev.x + next.x) * 0.5 - pts[i].x;
      const dy = (prev.y + next.y) * 0.5 - pts[i].y;
      const len = Math.hypot(dx, dy) || 1;
      pts[i].x += (dx / len) * 0.003;
      pts[i].y += (dy / len) * 0.003;
    } else {
      seen.set(key, i);
    }
  }

  return pts;
}

function signedArea2D(pts) {
  let area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    area += (pts[j].x * pts[i].y) - (pts[i].x * pts[j].y);
  }
  return area * 0.5;
}

function extrudePolyTreeManifold(polyTree, zBottom, zTop) {
  const positions = [];
  const indices = [];
  let vertOffset = 0;

  function addPolygonWithHoles(outerRaw, holesRaw) {
    let outer = cleanClipperContour(outerRaw);
    if (outer.length < 3) return;
    if (signedArea2D(outer) < 0) outer.reverse();

    const holes = [];
    for (const hRaw of holesRaw) {
      let h = cleanClipperContour(hRaw);
      if (h.length >= 3) {
        if (signedArea2D(h) > 0) h.reverse();
        holes.push(h);
      }
    }

    const faces = THREE.ShapeUtils.triangulateShape(outer, holes);
    let allPts = outer.slice();
    for (let i = 0; i < holes.length; i++) {
      allPts = allPts.concat(holes[i]);
    }

    const n = allPts.length;
    if (n < 3 || faces.length === 0) return;

    for (let i = 0; i < n; i++) {
      positions.push(allPts[i].x, allPts[i].y, zBottom);
    }
    for (let i = 0; i < n; i++) {
      positions.push(allPts[i].x, allPts[i].y, zTop);
    }

    for (const f of faces) {
      const a = f[0], b = f[1], c = f[2];
      indices.push(vertOffset + n + a, vertOffset + n + b, vertOffset + n + c);
      indices.push(vertOffset + a, vertOffset + c, vertOffset + b);
    }

    function buildRingWalls(ringStartIdx, ringLen) {
      for (let i = 0; i < ringLen; i++) {
        const next = (i + 1) % ringLen;
        const b0 = vertOffset + ringStartIdx + i;
        const b1 = vertOffset + ringStartIdx + next;
        const t0 = b0 + n;
        const t1 = b1 + n;
        indices.push(b0, b1, t1);
        indices.push(b0, t1, t0);
      }
    }

    buildRingWalls(0, outer.length);
    let holeStart = outer.length;
    for (const h of holes) {
      buildRingWalls(holeStart, h.length);
      holeStart += h.length;
    }

    vertOffset += 2 * n;
  }

  function traverseNode(node) {
    if (!node.IsHole()) {
      const outerContour = node.Contour();
      const holeContours = [];
      const childs = node.Childs();
      for (let i = 0; i < childs.length; i++) {
        const holeNode = childs[i];
        holeContours.push(holeNode.Contour());
        const grandChilds = holeNode.Childs();
        for (let j = 0; j < grandChilds.length; j++) {
          traverseNode(grandChilds[j]);
        }
      }
      addPolygonWithHoles(outerContour, holeContours);
    }
  }

  const rootChilds = polyTree.Childs();
  for (let i = 0; i < rootChilds.length; i++) {
    traverseNode(rootChilds[i]);
  }

  if (positions.length === 0 || indices.length === 0) return null;

  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  return geo;
}

function buildOrnamentLayers(spiro, options) {
  const {
    targetSizeMm = 70,
    lineWidthMm = 0.40,
    colorMode = 3,
    addLoop = true
  } = options;

  const rawPolys = (typeof spiro.getPolygons === 'function')
    ? spiro.getPolygons()
    : [spiro.getPolygon()];
  const isClosed = spiro.isClosed();
  const clipperPaths = scalePolysToClipper(rawPolys, targetSizeMm);

  const strokePaths = clipperPaths
    .map(path => {
      const sp = path.slice();
      if (isClosed && sp.length > 2) {
        const first = sp[0];
        const last = sp[sp.length - 1];
        if (first.X === last.X && first.Y === last.Y) {
          sp.pop();
        }
      }
      return sp;
    })
    .filter(sp => sp.length >= 2);

  let topPt = { X: 0, Y: -Infinity };
  for (const sp of strokePaths) {
    for (const pt of sp) {
      if (pt.Y > topPt.Y) topPt = pt;
    }
  }
  const topXmm = topPt.X / CLIPPER_SCALE;
  const topYmm = topPt.Y / CLIPPER_SCALE;

  const loopCenterY = topYmm + 1.20;
  const loopOuterRadius = 2.00;
  const loopInnerRadius = 1.20;

  // 1. Line layer (offset all curves and unify)
  const coLine = new ClipperLib.ClipperOffset(30.0, 0.25 * CLIPPER_SCALE);
  const endType = isClosed ? ClipperLib.EndType.etClosedLine : ClipperLib.EndType.etOpenSquare;
  for (const sp of strokePaths) {
    coLine.AddPath(sp, ClipperLib.JoinType.jtMiter, endType);
  }

  const lineRawPaths = new ClipperLib.Paths();
  coLine.Execute(lineRawPaths, (lineWidthMm / 2) * CLIPPER_SCALE);

  let linePathsWithLoop = lineRawPaths;
  if (colorMode === 1 && addLoop) {
    const cLineLoop = new ClipperLib.Clipper();
    cLineLoop.StrictlySimple = true;
    cLineLoop.AddPaths(lineRawPaths, ClipperLib.PolyType.ptSubject, true);
    const outerLoop = makeCircleClipperPath(topXmm, loopCenterY, loopOuterRadius);
    cLineLoop.AddPath(outerLoop, ClipperLib.PolyType.ptSubject, true);
    const tempPaths = new ClipperLib.Paths();
    cLineLoop.Execute(ClipperLib.ClipType.ctUnion, tempPaths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

    const cLineHole = new ClipperLib.Clipper();
    cLineHole.StrictlySimple = true;
    cLineHole.AddPaths(tempPaths, ClipperLib.PolyType.ptSubject, true);
    const innerHole = makeCircleClipperPath(topXmm, loopCenterY, loopInnerRadius);
    cLineHole.AddPath(innerHole, ClipperLib.PolyType.ptClip, true);
    linePathsWithLoop = new ClipperLib.Paths();
    cLineHole.Execute(ClipperLib.ClipType.ctDifference, linePathsWithLoop, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
  }

  const linePolyTree = new ClipperLib.PolyTree();
  const cLine = new ClipperLib.Clipper();
  cLine.StrictlySimple = true;
  cLine.AddPaths(linePathsWithLoop, ClipperLib.PolyType.ptSubject, true);
  cLine.Execute(ClipperLib.ClipType.ctUnion, linePolyTree, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

  // 2. Fill layer (combined Even-Odd parity across all curves)
  const fillPolyTree = new ClipperLib.PolyTree();
  let fillPathsWithLoop = null;

  if (colorMode >= 2 && isClosed) {
    const evenOddPaths = new ClipperLib.Paths();
    const cEvenOdd = new ClipperLib.Clipper();
    cEvenOdd.StrictlySimple = true;
    for (const sp of strokePaths) {
      cEvenOdd.AddPath(sp, ClipperLib.PolyType.ptSubject, true);
    }
    cEvenOdd.Execute(ClipperLib.ClipType.ctUnion, evenOddPaths, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);

    const cFillUnion = new ClipperLib.Clipper();
    cFillUnion.StrictlySimple = true;
    cFillUnion.AddPaths(evenOddPaths, ClipperLib.PolyType.ptSubject, true);
    cFillUnion.AddPaths(lineRawPaths, ClipperLib.PolyType.ptClip, true);

    if (colorMode === 2 && addLoop) {
      const outerLoop = makeCircleClipperPath(topXmm, loopCenterY, loopOuterRadius);
      cFillUnion.AddPath(outerLoop, ClipperLib.PolyType.ptClip, true);
    }

    const tempFillPaths = new ClipperLib.Paths();
    cFillUnion.Execute(ClipperLib.ClipType.ctUnion, tempFillPaths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

    if (colorMode === 2 && addLoop) {
      const cFillHole = new ClipperLib.Clipper();
      cFillHole.StrictlySimple = true;
      cFillHole.AddPaths(tempFillPaths, ClipperLib.PolyType.ptSubject, true);
      const innerHole = makeCircleClipperPath(topXmm, loopCenterY, loopInnerRadius);
      cFillHole.AddPath(innerHole, ClipperLib.PolyType.ptClip, true);
      fillPathsWithLoop = new ClipperLib.Paths();
      cFillHole.Execute(ClipperLib.ClipType.ctDifference, fillPathsWithLoop, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

      const cFillFinal = new ClipperLib.Clipper();
      cFillFinal.StrictlySimple = true;
      cFillFinal.AddPaths(fillPathsWithLoop, ClipperLib.PolyType.ptSubject, true);
      cFillFinal.Execute(ClipperLib.ClipType.ctUnion, fillPolyTree, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
    } else {
      const cFillFinal = new ClipperLib.Clipper();
      cFillFinal.StrictlySimple = true;
      cFillFinal.AddPaths(tempFillPaths, ClipperLib.PolyType.ptSubject, true);
      cFillFinal.Execute(ClipperLib.ClipType.ctUnion, fillPolyTree, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
    }
  }

  // 3. Base layer (3-color mode only; resolve each curve silhouette separately to avoid winding cancellation)
  const baseFinalTree = new ClipperLib.PolyTree();
  if (colorMode === 3) {
    const baseOuterPaths = new ClipperLib.Paths();
    const cBase = new ClipperLib.Clipper();
    cBase.StrictlySimple = true;
    cBase.AddPaths(lineRawPaths, ClipperLib.PolyType.ptSubject, true);

    if (isClosed) {
      for (const sp of strokePaths) {
        const silhouettePaths = new ClipperLib.Paths();
        const cSil = new ClipperLib.Clipper();
        cSil.StrictlySimple = true;
        cSil.AddPath(sp, ClipperLib.PolyType.ptSubject, true);
        cSil.Execute(ClipperLib.ClipType.ctUnion, silhouettePaths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
        cBase.AddPaths(silhouettePaths, ClipperLib.PolyType.ptSubject, true);
      }
    }

    if (addLoop) {
      const outerLoop = makeCircleClipperPath(topXmm, loopCenterY, loopOuterRadius);
      cBase.AddPath(outerLoop, ClipperLib.PolyType.ptSubject, true);
    }

    cBase.Execute(ClipperLib.ClipType.ctUnion, baseOuterPaths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

    const cBaseHole = new ClipperLib.Clipper();
    cBaseHole.StrictlySimple = true;
    cBaseHole.AddPaths(baseOuterPaths, ClipperLib.PolyType.ptSubject, true);
    if (addLoop) {
      const innerHole = makeCircleClipperPath(topXmm, loopCenterY, loopInnerRadius);
      cBaseHole.AddPath(innerHole, ClipperLib.PolyType.ptClip, true);
    }
    cBaseHole.Execute(ClipperLib.ClipType.ctDifference, baseFinalTree, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
  }

  let baseGeo = null;
  let fillGeo = null;
  let lineGeo = null;

  // Extrude layers to 1.80 mm total height (0.60 mm = 3x 0.20 mm per color)
  if (colorMode === 3) {
    baseGeo = extrudePolyTreeManifold(baseFinalTree, 0.00, 0.60);
    fillGeo = isClosed ? extrudePolyTreeManifold(fillPolyTree, 0.60, 1.20) : null;
    lineGeo = extrudePolyTreeManifold(linePolyTree, 1.20, 1.80);
  } else if (colorMode === 2) {
    baseGeo = null;
    fillGeo = isClosed ? extrudePolyTreeManifold(fillPolyTree, 0.00, 1.20) : null;
    lineGeo = extrudePolyTreeManifold(linePolyTree, 1.20, 1.80);
  } else {
    baseGeo = null;
    fillGeo = null;
    lineGeo = extrudePolyTreeManifold(linePolyTree, 0.00, 1.80);
  }

  return { baseGeo, fillGeo, lineGeo };
}

function geometryToMeshXml(geometry, colorIndex = 0) {
  if (!geometry) return null;
  const posAttr = geometry.getAttribute('position');
  if (!posAttr || posAttr.count === 0) return null;

  const vertices = [];
  const triangles = [];
  const vertMap = new Map();

  const paintCodes = ['4', '8', '0C'];
  const paintCode = paintCodes[colorIndex] || '4';

  function getWeldedVertexIndex(x, y, z) {
    const qx = Math.round(x * 10000);
    const qy = Math.round(y * 10000);
    const qz = Math.round(z * 10000);
    const key = `${qx}_${qy}_${qz}`;
    let idx = vertMap.get(key);
    if (idx !== undefined) return idx;

    idx = vertices.length;
    const fx = (qx / 10000).toFixed(4);
    const fy = (qy / 10000).toFixed(4);
    const fz = (qz / 10000).toFixed(4);
    vertices.push(`<vertex x="${fx}" y="${fy}" z="${fz}" />`);
    vertMap.set(key, idx);
    return idx;
  }

  for (let i = 0; i < posAttr.count; i += 3) {
    const v1 = getWeldedVertexIndex(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    const v2 = getWeldedVertexIndex(posAttr.getX(i + 1), posAttr.getY(i + 1), posAttr.getZ(i + 1));
    const v3 = getWeldedVertexIndex(posAttr.getX(i + 2), posAttr.getY(i + 2), posAttr.getZ(i + 2));
    if (v1 !== v2 && v2 !== v3 && v1 !== v3) {
      triangles.push(
        `<triangle v1="${v1}" v2="${v2}" v3="${v3}" pid="1" p1="${colorIndex}" paint_color="${paintCode}" slic3rpe:mmu_segmentation="${paintCode}" />`
      );
    }
  }

  if (triangles.length === 0) return null;
  return `<mesh><vertices>${vertices.join('')}</vertices><triangles>${triangles.join('')}</triangles></mesh>`;
}

async function generate3MFBlob(ornamentsList, palette, colorMode = 3) {
  const zip = new JSZip();

  const pal = palette || {
    baseColor: '#F8F9FA',
    fillColor: '#89CFF0',
    lineColor: '#D4AF37'
  };

  const cLine = (pal.lineColor || '#D4AF37').toUpperCase() + 'FF';
  const cFill = (pal.fillColor || '#89CFF0').toUpperCase() + 'FF';
  const cBase = (pal.baseColor || '#F8F9FA').toUpperCase() + 'FF';

  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
  <Default Extension="config" ContentType="text/xml" />
</Types>`;
  zip.file('[Content_Types].xml', contentTypes);

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>`;
  zip.folder('_rels').file('.rels', rels);

  let objectsXml = '';
  let buildItemsXml = '';
  let modelSettingsXml = '';
  let nextObjId = 2;

  const gridCols = Math.ceil(Math.sqrt(ornamentsList.length));
  const spacingMm = 82;

  ornamentsList.forEach((item, index) => {
    const col = index % gridCols;
    const row = Math.floor(index / gridCols);
    const offsetX = 128 + (col - (gridCols - 1) / 2) * spacingMm;
    const offsetY = 128 + (row - (Math.ceil(ornamentsList.length / gridCols) - 1) / 2) * spacingMm;

    const { baseGeo, fillGeo, lineGeo } = item.geometries;
    const partIds = [];

    if (colorMode === 3) {
      if (baseGeo) {
        const id = nextObjId++;
        const xml = geometryToMeshXml(baseGeo, 0);
        if (xml) {
          objectsXml += `    <object id="${id}" name="${item.name}_1_Zakladna" type="model" pid="1" pindex="0">${xml}</object>\n`;
          partIds.push({ id, name: `${item.name}_1_Zakladna`, extruder: 1 });
        }
      }
      if (fillGeo) {
        const id = nextObjId++;
        const xml = geometryToMeshXml(fillGeo, 1);
        if (xml) {
          objectsXml += `    <object id="${id}" name="${item.name}_2_Vypln" type="model" pid="1" pindex="1">${xml}</object>\n`;
          partIds.push({ id, name: `${item.name}_2_Vypln`, extruder: 2 });
        }
      }
      if (lineGeo) {
        const id = nextObjId++;
        const xml = geometryToMeshXml(lineGeo, 2);
        if (xml) {
          objectsXml += `    <object id="${id}" name="${item.name}_3_Linka" type="model" pid="1" pindex="2">${xml}</object>\n`;
          partIds.push({ id, name: `${item.name}_3_Linka`, extruder: 3 });
        }
      }
    } else if (colorMode === 2) {
      if (fillGeo) {
        const id = nextObjId++;
        const xml = geometryToMeshXml(fillGeo, 0);
        if (xml) {
          objectsXml += `    <object id="${id}" name="${item.name}_1_Vypln" type="model" pid="1" pindex="0">${xml}</object>\n`;
          partIds.push({ id, name: `${item.name}_1_Vypln`, extruder: 1 });
        }
      }
      if (lineGeo) {
        const id = nextObjId++;
        const xml = geometryToMeshXml(lineGeo, 1);
        if (xml) {
          objectsXml += `    <object id="${id}" name="${item.name}_2_Linka" type="model" pid="1" pindex="1">${xml}</object>\n`;
          partIds.push({ id, name: `${item.name}_2_Linka`, extruder: 2 });
        }
      }
    } else {
      if (lineGeo) {
        const id = nextObjId++;
        const xml = geometryToMeshXml(lineGeo, 0);
        if (xml) {
          objectsXml += `    <object id="${id}" name="${item.name}_Linka" type="model" pid="1" pindex="0">${xml}</object>\n`;
          partIds.push({ id, name: `${item.name}_Linka`, extruder: 1 });
        }
      }
    }

    const parentId = nextObjId++;
    const componentsXml = partIds.map(p => `<component objectid="${p.id}" />`).join('');
    objectsXml += `    <object id="${parentId}" name="Model_${item.name}" type="model"><components>${componentsXml}</components></object>\n`;
    buildItemsXml += `    <item objectid="${parentId}" transform="1 0 0 0 1 0 0 0 1 ${offsetX.toFixed(2)} ${offsetY.toFixed(2)} 0" />\n`;

    const partsConfigXml = partIds.map(p => `      <part id="${p.id}" subtype="normal_part">
        <metadata key="name" value="${p.name}"/>
        <metadata key="extruder" value="${p.extruder}"/>
      </part>`).join('\n');

    modelSettingsXml += `    <object id="${parentId}">
      <metadata key="name" value="Model_${item.name}"/>
      <metadata key="extruder" value="1"/>
      <metadata key="wall_generator" value="arachne"/>
      <metadata key="outer_wall_line_width" value="0.4"/>
      <metadata key="outer_wall_speed" value="40"/>
      <metadata key="top_surface_speed" value="30"/>
${partsConfigXml}
    </object>\n`;
  });

  let colorElements = '';
  if (colorMode === 3) {
    colorElements = `
      <m:color color="${cBase}" />
      <m:color color="${cFill}" />
      <m:color color="${cLine}" />`;
  } else if (colorMode === 2) {
    colorElements = `
      <m:color color="${cFill}" />
      <m:color color="${cLine}" />`;
  } else {
    colorElements = `
      <m:color color="${cLine}" />`;
  }

  const modelXml = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="cs-CZ"
  xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
  xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02"
  xmlns:slic3rpe="http://schemas.slic3r.org/3mf/2017/06">
  <resources>
    <m:colorgroup id="1">${colorElements}
    </m:colorgroup>
${objectsXml}  </resources>
  <build>
${buildItemsXml}  </build>
</model>`;
  zip.folder('3D').file('3dmodel.model', modelXml);

  const modelSettingsConfig = `<?xml version="1.0" encoding="UTF-8"?>
<config>
${modelSettingsXml}</config>`;
  zip.folder('Metadata').file('model_settings.config', modelSettingsConfig);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml'
  });
}

window.buildOrnamentLayers = buildOrnamentLayers;
window.generate3MFBlob = generate3MFBlob;