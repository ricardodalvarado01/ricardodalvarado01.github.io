let stations = [];
let demandDots = [];
let riverPoints = [];
let numDemandDots = 120; 
let totalLines; 
let lineColors = [
  '#EE352E', '#00933C', '#0039A6', '#FCCC0A', '#B933AD', 
  '#FF6319', '#6CBE45', '#996633', '#A7A9AC', '#7A2218', 
  '#00A8E6', '#E96898'
];

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container'); 
  
  totalLines = floor(random(4, 12));

  // 1. RIVER
  let numRiverSegments = 30;
  let startY = random(height * 0.3, height * 0.7);
  let waveFrequency = random(0.02, 0.05);
  let waveAmplitude = random(10, 40);

  for (let i = 0; i <= numRiverSegments; i++) {
    let x = (width / numRiverSegments) * i;
    // Sine wave to make the river meander
    let y = startY + sin(x * waveFrequency) * waveAmplitude + random(-10, 10);
    riverPoints.push({x: x, y: y});
  }

  // 2. DEMAND DOTS
  let dotsCreated = 0;
  while (dotsCreated < numDemandDots) {
    let testX = random(width * 0.05, width * 0.95);
    let testY = random(height * 0.05, height * 0.95);
    
    // Prevents dots on the river
    if (!isPointOnRiver(testX, testY, 25)) {
      demandDots.push({
        x: testX,
        y: testY,
        size: random(4, 10)
      });
      dotsCreated++;
    }
  }
}

function draw() {
  background(245, 245, 250); 

  // 1. DRAW RIVER
  noFill();
  stroke('#ADD8E6'); 
  strokeWeight(20); // RIVER WIDTH
  strokeJoin(ROUND);
  beginShape();
  curveVertex(riverPoints[0].x, riverPoints[0].y);
  for (let pt of riverPoints) {
    curveVertex(pt.x, pt.y);
  }
  curveVertex(riverPoints[riverPoints.length-1].x, riverPoints[riverPoints.length-1].y);
  endShape();

  // 2. DRAW DEMAND DOTS
  noStroke();
  fill(150, 150, 150, 60); 
  for (let i = 0; i < demandDots.length; i++) {
    ellipse(demandDots[i].x, demandDots[i].y, demandDots[i].size);
  }

  // 3. OVERLAPPING ROUTES FOR PARALLEL BUNDLING
  let segmentGroups = {};
  for (let lineID = 0; lineID < totalLines; lineID++) {
    let lineStations = stations.filter(s => s.lineID === lineID);
    for (let i = 0; i < lineStations.length - 1; i++) {
      let s1 = lineStations[i];
      let s2 = lineStations[i + 1];
      
      let key;
      if (s1.x < s2.x || (s1.x === s2.x && s1.y < s2.y)) {
        key = s1.x + ',' + s1.y + '-' + s2.x + ',' + s2.y;
      } else {
        key = s2.x + ',' + s2.y + '-' + s1.x + ',' + s1.y;
      }
      
      if (!segmentGroups[key]) segmentGroups[key] = [];
      if (!segmentGroups[key].includes(lineID)) {
        segmentGroups[key].push(lineID);
      }
    }
  }

  // 4. DRAW TRACKS 
  noFill();
  strokeWeight(6);
  
  for (let lineID = 0; lineID < totalLines; lineID++) {
    let lineStations = stations.filter(s => s.lineID === lineID);
    
    if (lineStations.length > 1) {
      stroke(lineColors[lineID]);
      
      for (let i = 0; i < lineStations.length - 1; i++) {
        let s1 = lineStations[i];
        let s2 = lineStations[i + 1];
        
        let key;
        if (s1.x < s2.x || (s1.x === s2.x && s1.y < s2.y)) {
          key = s1.x + ',' + s1.y + '-' + s2.x + ',' + s2.y;
        } else {
          key = s2.x + ',' + s2.y + '-' + s1.x + ',' + s1.y;
        }
        
        let sharedLines = segmentGroups[key];
        let overlapCount = sharedLines.length;
        let overlapIndex = sharedLines.indexOf(lineID);
        
        let offsetX = 0;
        let offsetY = 0;
        
        if (overlapCount > 1) {
          let directDx = s2.x - s1.x;
          let directDy = s2.y - s1.y;
          let len = dist(s1.x, s1.y, s2.x, s2.y);
          if (len > 0) {
            let nx = -directDy / len; 
            let ny = directDx / len;  
            let spacing = 8; 
            let shift = (overlapIndex - (overlapCount - 1) / 2) * spacing;
            offsetX = nx * shift;
            offsetY = ny * shift;
          }
        }

        let drawX1 = s1.x + offsetX;
        let drawY1 = s1.y + offsetY;
        let drawX2 = s2.x + offsetX;
        let drawY2 = s2.y + offsetY;
        
        let dx = drawX2 - drawX1;
        let dy = drawY2 - drawY1;
        let absDx = abs(dx);
        let absDy = abs(dy);
        let minD = min(absDx, absDy);
        let signX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
        let signY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
        
        if (s2.pathType < 0.35) {
          let midX, midY;
          if (absDx > absDy) {
            midX = drawX1 + (absDx - minD) * signX;
            midY = drawY1;
          } else {
            midX = drawX1;
            midY = drawY1 + (absDy - minD) * signY;
          }
          beginShape();
          vertex(drawX1, drawY1);
          vertex(midX, midY);
          vertex(drawX2, drawY2);
          endShape();
        } else if (s2.pathType < 0.70) {
          let midX = drawX1 + minD * signX;
          let midY = drawY1 + minD * signY;
          beginShape();
          vertex(drawX1, drawY1);
          vertex(midX, midY);
          vertex(drawX2, drawY2);
          endShape();
        } else {
          let controlX1 = drawX1 + (drawX2 - drawX1) / 2;
          let controlY1 = drawY1;
          let controlX2 = drawX1 + (drawX2 - drawX1) / 2;
          let controlY2 = drawY2;
          bezier(drawX1, drawY1, controlX1, controlY1, controlX2, controlY2, drawX2, drawY2);
        }
      }
    }
  }

  // 5. DRAW STATIONS
  let coordMap = {};
  for (let i = 0; i < stations.length; i++) {
    let key = stations[i].x + "," + stations[i].y;
    if (!coordMap[key]) {
      coordMap[key] = new Set();
    }
    coordMap[key].add(stations[i].lineID);
  }
  
  for (let key in coordMap) {
    let parts = key.split(",");
    let x = parseFloat(parts[0]);
    let y = parseFloat(parts[1]);
    let uniqueLines = coordMap[key].size;
    let baseSize = 14;

    if (uniqueLines === 1) {
      noStroke();
      fill(0);
      ellipse(x, y, baseSize);
    } else {
      stroke(0);
      strokeWeight(3);
      fill(255);
      if (uniqueLines > 2) {
        ellipse(x, y, baseSize * 1.25);
      } else {
        ellipse(x, y, baseSize);
      }
    }
  }
}

// --- FUNCTIONS ---

// Checks if a given coordinate is too close to any point along the river
function isPointOnRiver(px, py, buffer) {
  for (let i = 0; i < riverPoints.length - 1; i++) {
    let info = getDistanceToSegment({x: px, y: py}, riverPoints[i], riverPoints[i+1]);
    if (info.distance < buffer) {
      return true;
    }
  }
  return false;
}

function getDistanceToSegment(p, v, w) {
  let l2 = dist(v.x, v.y, w.x, w.y);
  l2 = l2 * l2;
  if (l2 === 0) return { distance: dist(p.x, p.y, v.x, v.y), t: 0 };
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  let projX = v.x + t * (w.x - v.x);
  let projY = v.y + t * (w.y - v.y);
  return { distance: dist(p.x, p.y, projX, projY), t: t };
}

function mousePressed() {
  if (mouseX > 20 && mouseX < 260 && mouseY > 20 && mouseY < 200) return; 

  // Prevent clicking to build a station directly on the river
  if (isPointOnRiver(mouseX, mouseY, 25)) return;

  let targetX = mouseX;
  let targetY = mouseY;
  let snappedToExisting = false;

  for (let i = 0; i < stations.length; i++) {
    if (dist(mouseX, mouseY, stations[i].x, stations[i].y) < 30) {
      targetX = stations[i].x;
      targetY = stations[i].y;
      snappedToExisting = true;
      break;
    }
  }

  if (!snappedToExisting) {
    let snappedDotIndex = -1;
    for (let i = 0; i < demandDots.length; i++) {
      if (dist(mouseX, mouseY, demandDots[i].x, demandDots[i].y) < 50) {
        targetX = demandDots[i].x;
        targetY = demandDots[i].y;
        snappedDotIndex = i;
        break; 
      }
    }
    if (snappedDotIndex !== -1) {
      demandDots.splice(snappedDotIndex, 1);
    }
  }

  let uniqueCoords = [];
  for (let s of stations) {
    if (!uniqueCoords.find(c => c.x === s.x && c.y === s.y)) {
      uniqueCoords.push({x: s.x, y: s.y});
    }
  }

  let numLinesToConnect = floor(random(1, 4));
  let linesPicked = [];
  while (linesPicked.length < numLinesToConnect) {
    let r = floor(random(totalLines));
    if (!linesPicked.includes(r)) linesPicked.push(r);
  }

  for (let i = 0; i < linesPicked.length; i++) {
    let activeLine = linesPicked[i];
    let lineStations = stations.filter(s => s.lineID === activeLine);
    let lastNode = lineStations.length > 0 ? lineStations[lineStations.length - 1] : null;

    if (lastNode) {
      let intermediatePoints = [];
      for (let pt of uniqueCoords) {
        let info = getDistanceToSegment(pt, lastNode, {x: targetX, y: targetY});
        if (info.distance < 70 && info.t > 0.15 && info.t < 0.85) {
          let alreadyOnLine = stations.some(s => s.lineID === activeLine && s.x === pt.x && s.y === pt.y);
          if (!alreadyOnLine) {
            intermediatePoints.push({ x: pt.x, y: pt.y, t: info.t });
          }
        }
      }
      intermediatePoints.sort((a, b) => a.t - b.t);
      for (let pt of intermediatePoints) {
        stations.push({
          x: pt.x, y: pt.y, lineID: activeLine, pathType: random(1)
        });
      }
    }

    let tooCloseAtEnd = false;
    for (let j = 0; j < stations.length; j++) {
      if (stations[j].lineID === activeLine && dist(targetX, targetY, stations[j].x, stations[j].y) < 80) {
        tooCloseAtEnd = true;
        break;
      }
    }

    if (!tooCloseAtEnd) {
      stations.push({
        x: targetX, y: targetY, lineID: activeLine, pathType: random(1) 
      });
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}