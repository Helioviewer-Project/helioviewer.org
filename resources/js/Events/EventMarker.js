/**
 * @author <a href="mailto:jeff.stys@nasa.gov">Jeff Stys</a>
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:kasim.n.percinel@nasa.gov">Kasim Necdet Percinel</a>
 * @fileoverview Contains the class definition for an EventMarker class.
 * @see EventLayer
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true,
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, getUTCTimestamp */
// "use strict";

import { createRoot } from "react-dom/client";
import React from "react";
import EventViewer from "./EventViewer";
import { renderToString } from "react-dom/server";

// Marker pin icon is 24x38 px. Offsets place the tip of the pin at the event point:
// X = half-width (centers icon horizontally), Y = full height (anchors tip at bottom).
const MARKER_OFFSET_X = 12;
const MARKER_OFFSET_Y = 38;

const TWO_PI = 2 * Math.PI;

/**
 * Points along the solar limb from point a to point b, sweeping the given signed angle
 * (positive = counter-clockwise in the image, y up; negative = clockwise). Used to close a
 * near-side fill along the limb instead of with a straight chord. The radius is
 * interpolated from |a| to |b|, so no solar-radius constant is needed: the arc simply hugs
 * the limb through the two crossing points. About one point every 2 degrees.
 * @returns [{x, y}, ...] intermediate points only (a and b themselves are not repeated)
 */
function limbArc(a, b, sweep) {
  if (Math.abs(sweep) < 1e-6) {
    return [];
  }
  const thA = Math.atan2(a.y, a.x);
  const rA = Math.hypot(a.x, a.y);
  const rB = Math.hypot(b.x, b.y);
  const steps = Math.max(1, Math.round(Math.abs(sweep) / (Math.PI / 90)));
  const points = [];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const th = thA + sweep * t;
    const r = rA + (rB - rA) * t;
    points.push({ x: r * Math.cos(th), y: r * Math.sin(th) });
  }
  return points;
}

/**
 * One footprint contour: a closed polygon of HPC points (arcsec), each point possibly flagged
 * behind the sun by the API. Everything that can be said about a contour on its own lives here
 * and is computed ONCE, on first use: which side of the sun it is on (isFront / isBehind /
 * isPartial), its runs, which side of the walk the region lies on, and the shapes to draw for
 * it (near-side fills, far-side tint, dashed far-side lines). EventMarker only concatenates the
 * shapes of its contours and puts them on screen.
 */
class FootprintContour {
  constructor(points) {
    this.points = points;
    this._behindCount = points.filter((p) => FootprintContour.isPointBehindSun(p)).length;
    this._runs = null;
    this._side = null;
    this._shapes = null;
  }

  /**
   * True when a footprint point is behind the sun. The API sends visible:false for far-side
   * points and omits the key for near-side ones, so the test is "=== false". (Unrelated to the
   * marker/label visibility buttons.)
   */
  static isPointBehindSun(point) {
    return point.visible === false;
  }

  get length() {
    return this.points.length;
  }

  /** Every point on the near side: drawn as one plain fill. */
  isFront() {
    return this._behindCount === 0;
  }

  /** Every point behind the sun: drawn as a tint under a closed dashed outline. */
  isBehind() {
    return this._behindCount === this.points.length;
  }

  /** Straddles the limb: cut into runs; fills closed along the limb, far side ghosted and tinted. */
  isPartial() {
    return !this.isFront() && !this.isBehind();
  }

  /**
   * The contour's RUNS, computed once.
   *
   * A run is a stretch of consecutive points that are all on the same side of the sun: all in
   * front, or all behind. Walking the contour point by point, a new run starts every time the
   * behind-sun flag flips. A run is not a shape yet; shapes() decides what to draw for each run
   * (in-front run -> filled polygon, behind run -> dashed polyline).
   *
   * Example: a 10-point contour, in the order the API lists it (F = in front, B = behind):
   *
   *     index   0 1 2 3 4 5 6 7 8 9
   *     flag    F F B B B B F F F F
   *
   *     first pass, left to right:   [F F] [B B B B] [F F F F]      -> 3 runs
   *
   * The contour is closed, so point 9 is followed by point 0 again. The last run (6..9) and
   * the first run (0,1) are therefore ONE in-front arc that only looks like two because the
   * API happened to start its list in the middle of it. The wrap step below merges them,
   * tail first then head, so the points stay in walking order along the contour:
   *
   *     after the wrap merge:        [F F F F F F] [B B B B]         -> 2 runs, one arc each
   *                                   (6,7,8,9,0,1)  (2,3,4,5)
   *
   * Without the merge the near-side arc would be drawn as two fills with a seam at index 0.
   * Only partial contours are cut into runs; front and behind ones are drawn whole.
   *
   * Each run also remembers the index of its first and last point (first > last for the
   * wrapped run: 6 and 1 above), so shapes() can find the neighbours just outside the run:
   * points[first - 1] and points[last + 1], cyclically.
   *
   * @returns [{ behindSun: boolean, points: [{x,y,...}], first: int, last: int }, ...] in contour order
   */
  runs() {
    if (this._runs === null) {
      const runs = [];
      this.points.forEach((point, index) => {
        const behind = FootprintContour.isPointBehindSun(point);
        const last = runs[runs.length - 1];
        if (last && last.behindSun === behind) {
          // same side as the previous point: extend the current run
          last.points.push(point);
          last.last = index;
        } else {
          // the flag flipped (or this is the first point): start a new run
          runs.push({ behindSun: behind, points: [point], first: index, last: index });
        }
      });
      // Wrap-around: if the list started in the middle of an arc, the first and last runs are
      // the same arc. Merge them, tail before head, to keep walking order (...8,9,0,1...).
      if (runs.length > 1 && runs[0].behindSun === runs[runs.length - 1].behindSun) {
        const tail = runs.pop();
        runs[0].points = tail.points.concat(runs[0].points);
        runs[0].first = tail.first; // the merged arc now starts where the tail run started (e.g. 6)
      }
      this._runs = runs;
    }
    return this._runs;
  }

  /**
   * Which side of the walk the region is on, computed once. A closed curve on a sphere bounds
   * two complementary areas; the region is taken to be the SMALLER one (coronal holes and
   * connectivity footprints never cover half the sun). The contour is rebuilt in 3D
   * (z = +sqrt(R²-r²) in front, -sqrt(R²-r²) behind; R = the contour's largest radius, which
   * is the limb because the API puts the crossing points on it), and the signed solid angle of
   * the fan of spherical triangles from a reference direction is summed (Van Oosterom &
   * Strackee). Positive means the walk is counter-clockwise seen from outside the sun, i.e.
   * the enclosed area is on the LEFT of the walk. Reduced to [0, 4π) this is the area on the
   * left; if that is the smaller half the region is on the left, otherwise on the right.
   * @returns +1 region on the left of the walking direction, -1 on the right
   */
  regionSide() {
    if (this._side === null) {
      const R = Math.max(...this.points.map((p) => Math.hypot(p.x, p.y))) || 1;
      const u = this.points.map((p) => {
        const x = p.x / R;
        const y = p.y / R;
        const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
        return [x, y, FootprintContour.isPointBehindSun(p) ? -z : z];
      });
      // reference direction: the mean of the points (never on the curve in practice), else Earth
      let ref = u.reduce((acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]], [0, 0, 0]);
      const norm = Math.hypot(ref[0], ref[1], ref[2]);
      ref = norm > 1e-6 ? ref.map((c) => c / norm) : [0, 0, 1];
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const triple = (a, b, c) =>
        a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
      let omega = 0;
      for (let i = 0; i < u.length; i++) {
        const b = u[i];
        const c = u[(i + 1) % u.length];
        omega += 2 * Math.atan2(triple(ref, b, c), 1 + dot(ref, b) + dot(b, c) + dot(c, ref));
      }
      const FOUR_PI = 4 * Math.PI;
      const leftArea = ((omega % FOUR_PI) + FOUR_PI) % FOUR_PI;
      this._side = leftArea <= 2 * Math.PI ? 1 : -1;
    }
    return this._side;
  }

  /**
   * The SHAPES to draw for this contour, computed once: which points are behind the sun never changes with zoom, only where they land
   * on screen (_updateRegionLayout re-projects the same list on every zoom).
   *
   * Two kinds of entry:
   *   fill  - in-front geometry: a filled <polygon> (event colour, black outline). A whole
   *           near-side contour as is; for a limb-straddler ONE polygon made of its in-front
   *           runs joined by arcs along the limb (see limbArc)
   *   ghost - behind-sun geometry: dashed outline, no fill; a closed <polygon> when a whole
   *           contour is behind, an open <polyline> for each behind run of a straddler
   *
   * What one contour turns into (F = point in front, B = point behind):
   *
   *     contour flags            runs (_cyclicRuns)              shapes pushed
   *     ----------------------   -----------------------------   ------------------------------
   *     F F F F F F              (not split)                     1 fill, the whole contour
   *     B B B B B B              (not split)                     1 closed ghost, whole contour
   *     F F B B B B F F F F      [F x6] [B x4]                   1 fill: the 6 F points, then a
   *                                                              limb arc from point 1 back
   *                                                              round to point 6
   *                                                              + 1 open ghost: the 4 B points
   *                                                              plus the F neighbour at each
   *                                                              end -> 1,2,3,4,5,6
   *     F B B F F F B B F F      [F x3] [B x2] [F x3] [B x2]     crosses the limb twice:
   *                                                              1 fill: run, limb arc, run,
   *                                                              limb arc (the second run is
   *                                                              a notch in the same polygon)
   *                                                              + 2 open ghosts
   *     F F B B B B B B B B      [F x2] [B x8]                   1 fill: the 2 F points plus
   *                                                              the limb arc between them (a
   *                                                              thin sliver along the limb)
   *
   * Closing along the limb: where the contour goes behind the sun, the visible region does
   * not stop at a straight line between the two crossing points, it stops at the limb. The
   * visible part of the region is the region clipped to the near hemisphere; its boundary is
   * the in-front runs plus the limb segments the region straddles. Those segments are found
   * by walking the limb: regionSide() says on which side of the walk the region is, so from
   * the point where a run leaves the disk (its last point) the boundary continues along the
   * limb in the direction that keeps the region on that side (clockwise if it is on the
   * right, counter-clockwise if on the left) to the NEAREST crossing point in that direction,
   * which is where some in-front run (maybe the same one) re-enters the disk. Following
   * run -> limb arc -> run -> ... until the start run comes back gives one closed polygon;
   * runs not reached that way start another. So one contour can yield several fills (two
   * separate slivers where the contour skims the limb), or one fill with a notch (a run
   * between two far-side excursions). No guess about where the far-side points are is
   * needed. If the nearest crossing is not a re-entry (an open, seam-cut contour) the run
   * simply closes on itself the short way. Ghost polylines are left open on purpose (no
   * closing edge across the far side) but are extended by one in-front point at each end,
   * so the dashed line starts and stops on the fill's edge and the two limb-crossing edges
   * of the contour are not lost.
   *
   * Order: tints, then ghosts, then fills, and EventMarker.createRegion paints in that order, so within an
   * event the far-side tint sits under the far-side lines, and both sit UNDER the event's
   * near-side fills, idle or hovered. Far-side points are projected back inside the disk, so
   * ghosts often cross their own fills; they show through the translucent fill rather than
   * lying on top of it.
   *
   *   tint  - the far-side area: the region clipped to the far hemisphere, a stroke-less
   *           <polygon> in the event colour at 0.18 (see the far-side block at the end)
   *
   * @returns { tints: [...], ghosts: [...], fills: [...] }, each entry { kind, closed, points }
   */
  shapes() {
    if (this._shapes === null) {
      this._shapes = this._computeShapes();
    }
    return this._shapes;
  }

  /**
   * Nearest crossing from angle `from`, walking the limb in the direction given by `sweepFn`
   * (a signed sweep function), with one safety rule: if nothing is found within a half turn
   * that way, the limb is walked the OTHER way and the nearest crossing there is taken. No
   * visible region straddles more than half the limb, so a first hit beyond 180 degrees is
   * always wrong. It happens with open, seam-cut contours: their fake closing edge (a jump of
   * 1000 arcsec and more) can flip the computed region side, and the GONGZ hole of 2026-02-27
   * 16:14 then closed a 26-point sliver the long way round and filled 90% of the disk. It also
   * covers two crossings a hair apart in the wrong angular order through coordinate noise
   * (the GONGZ hole of 2026-07-10 23:58), where the wanted way measured 360 degrees minus a hair.
   * @returns { crossing, sweep } or null when there is no other crossing
   */
  static nearestCrossing(from, crossings, sweepFn, skip) {
    const search = (fn) => {
      let best = null;
      crossings.forEach((c) => {
        if (skip(c)) {
          return;
        }
        const sweep = fn(from, c.th);
        if (!best || Math.abs(sweep) < Math.abs(best.sweep)) {
          best = { crossing: c, sweep };
        }
      });
      return best;
    };
    let best = search(sweepFn);
    if (best && Math.abs(best.sweep) > Math.PI) {
      // the same walk, the other way round the limb
      const otherWay = (a, b) => {
        const s = sweepFn(a, b);
        return -Math.sign(s || 1) * (TWO_PI - Math.abs(s));
      };
      best = search(otherWay);
    }
    return best;
  }

  _computeShapes() {
    const fills = [];
    const ghosts = [];
    const tints = [];
    if (this.isFront()) {
      // whole contour on the near side: one filled polygon, exactly as before this feature
      fills.push({ kind: "fill", closed: true, points: this.points });
      return { tints, ghosts, fills };
    }
    if (this.isBehind()) {
      // whole contour behind the sun: one dashed closed outline, tinted inside
      ghosts.push({ kind: "ghost", closed: true, points: this.points });
      tints.push({ kind: "tint", closed: true, points: this.points });
      return { tints, ghosts, fills };
    }
    // Straddler: split into runs. Each behind run becomes its own ghost; the in-front runs
    // become fills closed along the limb (see "Closing along the limb" above).
    const n = this.points.length;
    const runs = this.runs(); // alternates in-front / behind, even length
    const angle = (p) => Math.atan2(p.y, p.x);
    const ccw = (from, to) => (((to - from) % TWO_PI) + TWO_PI) % TWO_PI;
    const side = this.regionSide();
    // signed sweep from angle `from` to angle `to` going the region's way round the limb
    const sweepTo = (from, to) => (side > 0 ? ccw(from, to) : -(TWO_PI - ccw(from, to)));
    // every place an in-front run enters or leaves the disk, with its angle on the limb
    const crossings = [];
    runs.forEach((run, idx) => {
      if (!run.behindSun) {
        crossings.push({ th: angle(run.points[0]), entry: true, run: idx });
        crossings.push({ th: angle(run.points[run.points.length - 1]), entry: false, run: idx });
      }
    });
    const nextRun = {}; // in-front run index -> the run its limb arc leads to
    const arcAfter = {}; // in-front run index -> limb arc points after its last point
    const extended = {}; // behind run index -> { before, after, points } (run + its two neighbours)
    runs.forEach((run, idx) => {
      if (run.behindSun) {
        // Behind arc: dashed open line, EXTENDED by the in-front neighbour at each end (the
        // point just before run.first and just after run.last, cyclically). Those two
        // neighbours are limb points that also belong to the adjacent fill(s), so the dashed
        // line starts and ends exactly on the fill's edge: the this.points edges that cross the
        // limb (1->2 and 5->6 in the example) are drawn as part of the ghost, no gap.
        // A single behind point becomes a 3-point dip: neighbour, point, neighbour.
        const before = this.points[(run.first - 1 + n) % n];
        const after = this.points[(run.last + 1) % n];
        extended[idx] = { before, after, points: [before].concat(run.points, [after]) };
        ghosts.push({ kind: "ghost", closed: false, points: extended[idx].points });
        return;
      }
      // In-front run: from its last point, walk the limb the region's way round to the
      // nearest crossing; that is where the visible boundary continues.
      const last = run.points[run.points.length - 1];
      const thLast = angle(last);
      // skip the point we are leaving from
      const best = FootprintContour.nearestCrossing(thLast, crossings, sweepTo, (c) => c.run === idx && !c.entry);
      let target = idx;
      let sweep;
      if (best && best.crossing.entry) {
        target = best.crossing.run;
        sweep = best.sweep;
      } else {
        // not a re-entry (open, seam-cut this.points): close this run on itself the short way
        const s = ccw(thLast, angle(run.points[0]));
        sweep = s <= Math.PI ? s : -(TWO_PI - s);
      }
      nextRun[idx] = target;
      arcAfter[idx] = limbArc(last, runs[target].points[0], sweep);
    });
    // Chain run -> arc -> next run -> ... into closed polygons; each unreached run starts one.
    const done = {};
    runs.forEach((run, idx) => {
      if (run.behindSun || done[idx]) {
        return;
      }
      let points = [];
      let i = idx;
      let guard = 0;
      do {
        done[i] = true;
        points = points.concat(runs[i].points, arcAfter[i]);
        i = nextRun[i];
        guard++;
      } while (i !== idx && !done[i] && guard < runs.length);
      if (points.length >= 3) {
        fills.push({ kind: "fill", closed: true, points });
      }
      // (fewer than 3 points, e.g. a this.points that only touches the near side at one point,
      // has no area to fill; its ghosts are still drawn)
    });

    // Far-side tint: the region clipped to the FAR hemisphere, built exactly like the fills
    // but mirrored. Its boundary is the behind runs plus the same straddled limb segments.
    // From the point where a behind run comes back in front (its `after`) the boundary follows
    // the limb the OTHER way round (at a re-entry, "region on the right" points the other way
    // along the limb than at an exit) to the nearest crossing, which is where some behind run
    // leaves the disk (its `before`). Chain behind run -> arc -> behind run ... into polygons.
    // A limb-hugging far-side hole therefore becomes one band along the limb, not a disk-sized
    // blob (a per-run chord from `after` back to `before` drew the whole disk for such cases).
    const sweepBack = (from, to) => (side > 0 ? -(TWO_PI - ccw(from, to)) : ccw(from, to));
    const farCrossings = [];
    Object.keys(extended).forEach((k) => {
      const idx = Number(k);
      farCrossings.push({ th: angle(extended[idx].before), exit: true, run: idx });
      farCrossings.push({ th: angle(extended[idx].after), exit: false, run: idx });
    });
    const nextBehind = {};
    const arcBehind = {};
    Object.keys(extended).forEach((k) => {
      const idx = Number(k);
      const after = extended[idx].after;
      const thAfter = angle(after);
      // skip the point we are leaving from
      const best = FootprintContour.nearestCrossing(thAfter, farCrossings, sweepBack, (c) => c.run === idx && !c.exit);
      let target = idx;
      let sweep;
      if (best && best.crossing.exit) {
        target = best.crossing.run;
        sweep = best.sweep;
      } else {
        // not an exit (open, seam-cut this.points): close this run's tint on itself the short way
        const s = ccw(thAfter, angle(extended[idx].before));
        sweep = s <= Math.PI ? s : -(TWO_PI - s);
      }
      nextBehind[idx] = target;
      arcBehind[idx] = limbArc(after, extended[target].before, sweep);
    });
    const doneBehind = {};
    Object.keys(extended).forEach((k) => {
      const idx = Number(k);
      if (doneBehind[idx]) {
        return;
      }
      let points = [];
      let i = idx;
      let guard = 0;
      do {
        doneBehind[i] = true;
        points = points.concat(extended[i].points, arcBehind[i]);
        i = nextBehind[i];
        guard++;
      } while (i !== idx && !doneBehind[i] && guard < runs.length);
      if (points.length >= 3) {
        tints.push({ kind: "tint", closed: true, points });
      }
    });
    return { tints, ghosts, fills };
  }
}

var EventMarker = Class.extend(
  /** @lends EventMarker.prototype */
  {
    /**
     * @constructs
     * @description Creates an EventMarker
     * @param {JSON} eventGlossary
     * @param {string} parentFRM
     * @param {JSON} event Event details
     * @param {integer} zIndex, zIndex as you know, visibility hierarchy of this marker in html
     * @param {boolean} labelVisible, set if the labels of this marker is hidden
     * @param {boolean} markerVisible, set if the marker is visible
     */
    init: function (eventGlossary, parentFRM, event, zIndex, labelVisible, markerVisible) {
      $.extend(this, event);
      this.event = event;
      // Fed by the API's event-level visible flag (false = behind the sun); absent/true = near side.
      this.behindSun = this.visible === false;
      this.parentFRM = parentFRM;
      this._popupVisible = false;
      this._zIndex = zIndex;
      this._eventGlossary = eventGlossary;
      this._uniqueId = Math.random().toString().substring(2);

      // Format LabelText (for mouse-over and "d")
      this.formatLabels();

      // Create DOM nodes for Event Regions and Event Markers
      this.createRegion(0);
      this.createMarker(zIndex);

      // Create the DOM of this marker, and set the visibility
      this.setVisibility(markerVisible);
      this.setLabelVisibility(labelVisible);

      $(document).bind("replot-event-markers", $.proxy(this.refresh, this));
    },

    /**
     * Returns true if this event data contains footprint region information.
     * footprint is a list of contours (a list of regions): an array of polygons,
     * where each polygon is an array of {x, y} HPC-arcsecond points.
     * footprint = [ [ {x,y}, ... ], [ {x,y}, ... ], ... ]
     */
    hasFootprint: function () {
      return (
        this.hasOwnProperty("footprint") &&
        Array.isArray(this.footprint) &&
        this.footprint.length > 0 &&
        Array.isArray(this.footprint[0])
      );
    },

    /**
     * Returns every {x, y} point across all footprint contours as one flat array.
     * Used for centroid and bounding-box math that spans all regions.
     */
    _allFootprintPoints: function () {
      return this.footprint.flat();
    },

    /**
     * The flat list of shapes to draw for the whole footprint: every contour's shapes
     * (see FootprintContour.shapes), ordered tints, then ghosts, then fills. createRegion paints
     * in that order, so within an event the far-side tint sits under the far-side lines, and
     * both sit UNDER the event's near-side fills, idle or hovered. Computed once when the region
     * is created; which points are behind the sun never changes with zoom, only where they land
     * on screen (_updateRegionLayout re-projects the same list on every zoom).
     * @returns [{ kind: "tint"|"ghost"|"fill", closed: boolean, points: [...] }, ...]
     */
    _buildRenderList: function () {
      this._contours = this.footprint.map((points) => new FootprintContour(points));
      const tints = [];
      const ghosts = [];
      const fills = [];
      this._contours.forEach((contour) => {
        const shapes = contour.shapes();
        tints.push(...shapes.tints);
        ghosts.push(...shapes.ghosts);
        fills.push(...shapes.fills);
      });
      return tints.concat(ghosts, fills);
    },

    /**
     * @description Creates the marker pin icon and adds it to the viewport.
     *              The marker is positioned differently depending on whether
     *              the event has a polygon region (bounding box) or not.
     *
     * @param {integer} zIndex - CSS z-index for layering markers in the DOM
     *
     * COORDINATE SYSTEM:
     * - hv_hpc_x, hv_hpc_y: Helioprojective Cartesian coordinates (arcseconds from Sun center)
     * - imageScale: Current zoom level (arcseconds per pixel)
     *
     * SCALING FORMULA:
     * - screenPixels = arcseconds / imageScale
     * - Y is negated (screen Y grows downward, HPC Y grows upward)
     * - Re-runs on zoom via refresh(), so positions track imageScale changes
     *
     * MARKER OFFSET:
     * - MARKER_OFFSET_X / MARKER_OFFSET_Y position the marker pin's tip at the event location
     * - The marker icon is 24x38 pixels, so offset centers the tip at bottom-center
     */
    createMarker: function (zIndex) {
      var markerURL;

      // Create event marker DOM node (the pin icon)
      this.eventMarkerDomNode = $("<div/>");
      this.eventMarkerDomNode.attr({
        class: "event-marker constant-size"
      });

      // Sanitize the event ID for use in DOM (remove special characters)
      var id = this.id;
      id = id.replace(/ivo:\/\/helio-informatics.org\//g, "");
      id = id.replace(/\(|\)|\.|\:/g, "");

      const eventMarkerTestId = "event-marker-" + (this.event.short_label ?? this.event.label);

      this.eventMarkerDomNode.attr({
        rel: id,
        id: "marker_" + id,
        "data-testid": eventMarkerTestId.replaceAll("\n", "")
      });

      // Calculate marker position based on whether event has a footprint polygon
      this.pos = this._computeMarkerPosition(Helioviewer.userSettings.settings.state.imageScale);

      // Set marker icon based on event type (AR, FL, CH, etc.)
      markerURL =
        serverSettings["rootURL"] + "/resources/images/eventMarkers/" + this.type.toUpperCase() + "@2x" + ".png";

      // Apply position and styling to marker DOM node
      this.eventMarkerDomNode.css({
        left: this.pos.x + "px",
        top: this.pos.y + "px",
        "z-index": zIndex,
        "background-image": "url('" + markerURL + "')"
        // Additional styles found in events.css
      });

      // Far-side event: dim the pin (and its label) so it reads as "behind the sun" but stays clickable
      if (this.behindSun) {
        this.eventMarkerDomNode.addClass("behind-sun");
      }

      // Append marker to parent FRM (Feature Recognition Method) container
      if (typeof this.parentFRM != "undefined") {
        this.parentFRM.append(this.eventMarkerDomNode);
      } else {
        return;
      }

      // Bind event handlers for marker interaction
      this.eventMarkerDomNode.bind("click", $.proxy(this.toggleEventPopUp, this));
      this.eventMarkerDomNode.mouseenter($.proxy(this.toggleEventLabel, this));
      this.eventMarkerDomNode.mouseleave($.proxy(this.toggleEventLabel, this));
    },

    /**
     * @description Creates the polygon region overlay for events that have footprint data.
     *              The region is rendered as an SVG polygon directly from HPC coordinates.
     *
     * @param {integer} zIndex - CSS z-index for layering regions in the DOM
     *
     * HOW SVG FOOTPRINT RENDERING WORKS:
     * 1. The API provides footprint as a list of contours (a list of regions):
     *    an array of polygons, each polygon an array of {x, y} HPC-arcsec points
     * 2. Each contour is split by the API's per-point behind-sun flags (see _buildRenderList):
     *    in-front geometry becomes a filled <polygon>, behind-sun geometry a dashed ghost
     *    (<polygon> if a whole contour is behind, <polyline> for the far-side run of a
     *    contour that straddles the limb) - all inside a single region SVG
     *
     * DATA STRUCTURE:
     * event.footprint = [
     *   [ { x: x1, y: y1 }, { x: x2, y: y2 }, ... ],   // contour / region 1
     *   [ { x: x1, y: y1 }, ... ],                     // contour / region 2
     *   ...
     * ]
     *
     * COORDINATE CONVERSION:
     * - HPC X (arcseconds) -> Screen X (pixels): x / imageScale
     * - HPC Y (arcseconds) -> Screen Y (pixels): -y / imageScale (negated because screen Y is inverted)
     *
     * ADVANTAGE OVER PNG:
     * - No pre-rendered images needed
     * - Can be updated dynamically for differential rotation
     * - Smaller data transfer (coordinates vs image)
     * - Scalable without quality loss
     */
    createRegion: function (zIndex) {
      // Only create region if event has footprint polygon data
      if (!this.hasFootprint()) {
        return;
      }

      // Sanitize the event ID for use in DOM (remove special characters)
      var id = this.id;
      id = id.replace(/ivo:\/\/helio-informatics.org\//g, "");
      id = id.replace(/\(|\)|\.|\:/g, "");

      // Create SVG namespace element for proper SVG rendering
      const svgNS = "http://www.w3.org/2000/svg";
      let svg = document.createElementNS(svgNS, "svg");

      svg.setAttribute("class", "event-region");
      svg.setAttribute("id", "region_" + id);
      svg.setAttribute("rel", id);
      svg.style.position = "absolute";
      svg.style.left = "0px"; // both region SVGs sit at the container origin; all points are absolute px
      svg.style.top = "0px";
      svg.style.width = "1px";
      svg.style.height = "1px";
      svg.style.overflow = "visible";
      svg.style.zIndex = zIndex;
      this._regionZIndex = zIndex; // restored by deEmphasize after a hover raised it
      svg.style.pointerEvents = "none"; // Allow clicks to pass through to markers

      // Two SVGs per event. This one (region_<id>) holds the near-side fills. A second one
      // (region_<id>_far) holds everything far-side: the tint, the dashed lines and their hover
      // halos. It sits one z-index below, so every far-side line of every event paints under
      // every near-side fill of every event: a dashed line crossing a fill is seen through the
      // fill, never on top of it. Within one SVG that only held for the event's own fills, and a
      // dashed line over another event's fill was as strong as on the bare sun.
      let far = document.createElementNS(svgNS, "svg");
      far.setAttribute("class", "event-region event-region-far");
      far.setAttribute("id", "region_" + id + "_far");
      far.setAttribute("rel", id);
      far.style.position = "absolute";
      far.style.left = "0px";
      far.style.top = "0px";
      far.style.width = "1px";
      far.style.height = "1px";
      far.style.overflow = "visible";
      far.style.zIndex = zIndex - 1;
      far.style.pointerEvents = "none";

      // Two luminance masks, both built from this event's fill polygons and kept in step with
      // them on every zoom (_updateRegionLayout); their region is made huge so nothing is
      // clipped whatever the bounding box.
      //  - tintmask: fills in BLACK. The far-side tint must not show where this event has a
      //    near-side fill; two translucent layers would stack darker than the fill itself.
      //  - ghostmask: fills in GREY (45% luminance). A far-side dashed line that crosses its
      //    own event's fill is drawn at 45% strength there, so it stays a hint under the region
      //    rather than competing with it.
      const BIG = 100000;
      const defs = document.createElementNS(svgNS, "defs");
      const makeMask = (maskId) => {
        const mask = document.createElementNS(svgNS, "mask");
        mask.setAttribute("id", maskId);
        mask.setAttribute("maskUnits", "userSpaceOnUse");
        mask.setAttribute("x", -BIG);
        mask.setAttribute("y", -BIG);
        mask.setAttribute("width", 2 * BIG);
        mask.setAttribute("height", 2 * BIG);
        const base = document.createElementNS(svgNS, "rect");
        base.setAttribute("x", -BIG);
        base.setAttribute("y", -BIG);
        base.setAttribute("width", 2 * BIG);
        base.setAttribute("height", 2 * BIG);
        base.setAttribute("fill", "white");
        mask.appendChild(base);
        defs.appendChild(mask);
        return mask;
      };
      const tintMask = makeMask("tintmask_" + id);
      const ghostMask = makeMask("ghostmask_" + id);
      far.appendChild(defs);
      // All far-side tints of the container (one container per source) live in ONE shared SVG,
      // inside a single group with opacity 0.18. Group opacity composites the group as a whole,
      // so where two events' tints overlap (twelve AGONG realisations of the same hole, say) the
      // union is still 0.18 and never adds up to something that reads as a near-side fill. The
      // layer is created by the first marker of the container and removed with the container.
      let tintLayerGroup = null;
      if (typeof this.parentFRM != "undefined") {
        let tintLayer = this.parentFRM.children("svg.event-far-tints")[0];
        if (!tintLayer) {
          tintLayer = document.createElementNS(svgNS, "svg");
          tintLayer.setAttribute("class", "event-far-tints");
          tintLayer.style.position = "absolute";
          tintLayer.style.left = "0px";
          tintLayer.style.top = "0px";
          tintLayer.style.width = "1px";
          tintLayer.style.height = "1px";
          tintLayer.style.overflow = "visible";
          tintLayer.style.zIndex = zIndex - 1; // same level as the far-side SVGs, earlier in the DOM: under them
          tintLayer.style.pointerEvents = "none";
          const layerGroup = document.createElementNS(svgNS, "g");
          layerGroup.setAttribute("class", "event-far-tints-group");
          layerGroup.style.opacity = "0.18";
          tintLayer.appendChild(layerGroup);
          this.parentFRM.prepend(tintLayer);
        }
        tintLayerGroup = tintLayer.querySelector("g.event-far-tints-group");
      }
      const tintGroup = document.createElementNS(svgNS, "g");
      tintGroup.setAttribute("id", "tint_" + id);
      tintGroup.setAttribute("class", "event-region event-region-tint behind-sun-tints"); // event-region: hidden/shown with the regions
      tintGroup.setAttribute("mask", "url(#tintmask_" + id + ")"); // the mask lives in this event's far-side SVG; ids are document-wide
      this._tintGroup = tintGroup;
      this._tintLayerGroup = tintLayerGroup;
      if (tintLayerGroup) {
        tintLayerGroup.appendChild(tintGroup);
      } else {
        tintGroup.style.opacity = "0.18"; // no container: keep the tint in the far-side SVG
        far.appendChild(tintGroup);
      }
      const ghostGroup = document.createElementNS(svgNS, "g");
      ghostGroup.setAttribute("class", "behind-sun-ghosts");
      ghostGroup.setAttribute("mask", "url(#ghostmask_" + id + ")");
      far.appendChild(ghostGroup);

      // One SVG child per render-list entry (see _buildRenderList): tints and ghosts in the
      // far-side SVG, fills in the near-side one.
      // Fill styling mirrors the legacy backend HEK polygon renderer:
      // fill: event-type color at 0.4 alpha, stroke: black at 0.533 alpha, 1.5px round joins.
      let baseColor = EventLoader.getEventTypeColor(this.type);
      this._renderList = this._buildRenderList();
      // Paint order: tints, then ghosts (both in the far-side SVG), then fills (near-side SVG,
      // one z-index above). Far-side points are projected back inside the disk, so a ghost often
      // crosses a near-side fill; it must show through the translucent fill, never lie on top.
      const paintOrder = this._renderList
        .filter((e) => e.kind === "tint")
        .concat(
          this._renderList.filter((e) => e.kind === "ghost"),
          this._renderList.filter((e) => e.kind === "fill")
        );
      paintOrder.forEach((entry) => {
        // closed shapes are <polygon>; an open behind-sun run is a <polyline> (no closing chord)
        const tag = entry.closed ? "polygon" : "polyline";
        let shape = document.createElementNS(svgNS, tag);
        if (entry.kind === "tint") {
          // Far-side area: a faint, stroke-less fill under everything else of the event, masked
          // out wherever a near-side fill of this event is (see tintMask above)
          shape.setAttribute("class", "event-region-shape behind-sun-ghost-fill");
          shape.style.fill = hexToRgba(baseColor, 1); // the 0.18 comes from the group that holds it
          shape.style.stroke = "none";
          entry.node = shape;
          tintGroup.appendChild(shape);
          return;
        }
        if (entry.kind === "fill") {
          // the same polygon punches this fill out of the tint mask (black = hidden) and dims
          // the dashed lines under it in the ghost mask (grey = 45% strength)
          const cutout = document.createElementNS(svgNS, "polygon");
          cutout.setAttribute("fill", "black");
          entry.maskNode = cutout;
          tintMask.appendChild(cutout);
          const dimmer = document.createElementNS(svgNS, "polygon");
          dimmer.setAttribute("fill", "rgb(115, 115, 115)");
          entry.ghostMaskNode = dimmer;
          ghostMask.appendChild(dimmer);

          shape.setAttribute("class", "event-region-shape behind-sun-none");
          shape.style.fill = hexToRgba(baseColor, 0.4);
          shape.style.stroke = "rgba(0, 0, 0, 0.533)";
          shape.style.strokeWidth = "1.5px";
        } else {
          // Ghost: behind the sun - no fill, dashed, dimmed event colour.
          // Its hover halo is a second, wider, black dashed copy of the same path drawn UNDER it
          // and hidden while idle - not a CSS drop-shadow filter. A filter on a long SVG polyline
          // inside the scaled moving container is rasterised as a bitmap and comes out blurred,
          // blocky or clipped; a plain underlay element stays crisp at any zoom.
          let halo = document.createElementNS(svgNS, tag);
          halo.setAttribute("class", "event-region-shape behind-sun-ghost-halo");
          halo.style.fill = "none";
          halo.style.stroke = "rgba(0, 0, 0, 0.6)";
          halo.style.strokeWidth = "4px";
          // Dash pattern: the ghost is 5 on / 4 off (period 9), hovered or not. With round caps a
          // 4px stroke grows each dash by 2px at both ends, so the halo uses 3 on / 6 off shifted
          // by 1px (offset 8 of 9): black dash [1,4] + caps = [-1,6], i.e. it wraps the coloured
          // dash [0,5] by 1px at each end and still leaves a 2px real gap. Using 5/4 with round
          // caps would merge the black dashes into one solid rope (9px dashes, 0px gaps).
          halo.style.strokeDasharray = "3,6";
          halo.style.strokeDashoffset = "8";
          halo.style.strokeLinecap = "round";
          halo.style.strokeLinejoin = "round";
          halo.style.display = "none";
          entry.haloNode = halo;
          ghostGroup.appendChild(halo); // appended first = painted under the coloured ghost

          shape.setAttribute("class", "event-region-shape behind-sun-ghost");
          shape.style.fill = "none"; // the far-side area is the separate "tint" entry
          shape.style.stroke = hexToRgba(baseColor, 0.55);
          shape.style.strokeWidth = "1.5px";
          shape.style.strokeDasharray = "5,4";
        }
        shape.style.strokeLinejoin = "round";
        entry.node = shape;
        (entry.kind === "ghost" ? ghostGroup : svg).appendChild(shape);
      });

      this.eventRegionDomNode = $(svg);
      this.eventFarRegionDomNode = $(far);

      if (typeof this.parentFRM != "undefined") {
        this.parentFRM.append(this.eventFarRegionDomNode);
        this.parentFRM.append(this.eventRegionDomNode);
      }

      this._updateRegionLayout(Helioviewer.userSettings.settings.state.imageScale);
    },

    /**
     * Computes the {x, y} pixel position for the marker pin at the given
     * imageScale. The pin sits at the event's hv_hpc_x / hv_hpc_y (provided by
     * the backend), with the pin icon offset applied so its tip lands on the
     * event point. Shared by createMarker (initial draw) and refresh (zoom).
     */
    _computeMarkerPosition: function (imageScale) {
      // Negate Y because screen Y is inverted (positive down)
      return {
        x: Math.round(this.hv_hpc_x / imageScale) - MARKER_OFFSET_X,
        y: Math.round(-this.hv_hpc_y / imageScale) - MARKER_OFFSET_Y
      };
    },

    /**
     * Computes the footprint bounding box at the given imageScale and applies it
     * to the existing region SVG (position, size, and inner polygon points).
     * Shared by createRegion (initial draw) and refresh (re-draw on zoom).
     */
    _updateRegionLayout: function (imageScale) {
      if (!this.eventRegionDomNode || !this.hasFootprint()) {
        return;
      }

      // Project each render-list entry's points to container pixels (the SVGs sit at the
      // container origin, overflow visible, so no bounding box is needed; screen Y is inverted).
      // Each entry holds its own SVG node(s), so no index matching is needed.
      this._renderList.forEach((entry) => {
        let pointsStr = entry.points
          .map((point) => {
            let screenX = point.x / imageScale;
            let screenY = -point.y / imageScale;
            return `${screenX},${screenY}`;
          })
          .join(" ");

        entry.node.setAttribute("points", pointsStr);
        if (entry.haloNode) {
          entry.haloNode.setAttribute("points", pointsStr);
        }
        if (entry.maskNode) {
          entry.maskNode.setAttribute("points", pointsStr); // keep the tint cut-out under this fill
          entry.ghostMaskNode.setAttribute("points", pointsStr); // and the dashed-line dimmer
        }
      });
    },

    /**
     * @description Choses the text to display in the details label based on the type of event
     * @param {String} eventType The type of event for which a label is being created
     */
    formatLabels: function () {
      var self = this;

      if (this.hasOwnProperty("label") && Object.keys(this.label).length > 0) {
        this.labelText = "";

        let labels = this.label.split("\n");
        labels.forEach((line) => {
          self.labelText += self.fixTitles(line) + "<br/>\n";
        });
      }
    },

    /**
     * @description Removes the Event Marker (and Event Region)
     */
    remove: function () {
      this.eventMarkerDomNode.qtip("destroy");
      this.eventMarkerDomNode.unbind();
      this.eventMarkerDomNode.remove();

      if (this.hasFootprint()) {
        this.eventRegionDomNode.qtip("destroy");
        this.eventRegionDomNode.unbind();
        this.eventRegionDomNode.remove();
        this.eventFarRegionDomNode.remove();
        $(this._tintGroup).remove();
      }
    },

    /**
     * @description Re-positions event markers/regions when zoom level changes.
     *              Recalculates positions from HPC coordinates using new imageScale.
     */
    refresh: function () {
      let imageScale = Helioviewer.userSettings.settings.state.imageScale;

      // Re-position Event Marker pin
      this.pos = this._computeMarkerPosition(imageScale);

      this.eventMarkerDomNode.css({
        left: this.pos.x + "px",
        top: this.pos.y + "px"
      });

      // Re-position and re-render SVG footprint region
      this._updateRegionLayout(imageScale);

      // Re-position Event Popup
      if (this._popupVisible) {
        this.popup_pos = {
          x: this.hv_hpc_x / imageScale + MARKER_OFFSET_X,
          y: -this.hv_hpc_y / imageScale - MARKER_OFFSET_Y
        };
        if (this.hv_hpc_x > 400) {
          this.popup_pos.x -= this.eventPopupDomNode.width() + MARKER_OFFSET_Y;
        }
        this.eventPopupDomNode.css({
          left: this.popup_pos.x + "px",
          top: this.popup_pos.y + "px"
        });
      }
    },

    /**
     * @description Creates the event marker label domnode if it is not already set
     * @returns void
     * */
    _makeLabel: function () {
      const eventLabelTestId = "event-label-" + (this.event.short_label ?? this.event.label);

      if (!this._label) {
        this._label = $("<div/>");
        this._label.hide();
        this._label.attr({
          class: "event-label",
          "data-testid": eventLabelTestId.replaceAll("\n", "")
          // Styles found in events.css
        });
        this._label.html(this.labelText);
        this._label.click(function (event) {
          event.stopImmediatePropagation();
        });
        this._label.mousedown(function (event) {
          event.stopImmediatePropagation();
        });
        this._label.dblclick(function (event) {
          event.stopImmediatePropagation();
        });
        this._label.enableSelection();

        this.eventMarkerDomNode.append(this._label);
      }
    },

    /**
     * @description create label of marker if it is not created, and sets its visibility,
     * @param {boolean} labelVisibility, hide or show
     * @return {void}
     */
    setLabelVisibility: function (labelVisibility) {
      this._makeLabel();

      if (labelVisibility === true) {
        this._labelVisible = true;
        this._label.show();
      }

      if (labelVisibility === false) {
        this._labelVisible = false;
        this._label.hide();
      }
    },

    /**
     * @description sets marker visibility,
     * @param {boolean} markerVisible, hide or show
     * @return {void}
     */
    setVisibility: function (markerVisible) {
      if (markerVisible) {
        if (this.eventRegionDomNode) {
          this.eventRegionDomNode.show();
          this.eventFarRegionDomNode.show();
          $(this._tintGroup).show();
        }
        this.eventMarkerDomNode.show();
        this._markerVisible = markerVisible;
      } else {
        if (this.eventRegionDomNode) {
          this.eventRegionDomNode.hide();
          this.eventFarRegionDomNode.hide();
          $(this._tintGroup).hide();
        }
        this.eventMarkerDomNode.hide();
        this._markerVisible = markerVisible;
      }
    },

    /**
     * @description shows label visibility with mouseenter and leave events, this function does not change visibility state,
     * just shows labels for temporary events and situations
     * @param {Event} event
     * @return {bool}
     */
    toggleEventLabel: function (event) {
      this._makeLabel();

      if (event.type == "mouseenter") {
        this._label.show();
        this.emphasize();

        if (
          Helioviewer.userSettings.get("state.drawers.#hv-drawer-timeline-events.open") == true &&
          timelineRes == "m"
        ) {
          var eventID = $(event.currentTarget).attr("rel");
          $(".highcharts-series > rect").hide();
          $(".highcharts-series > rect[data-eventid='" + eventID + "']").show();
        }
      }

      if (event.type == "mouseleave") {
        if (this._labelVisible == false) {
          this._label.hide();
        }
        this.deEmphasize();

        if (
          Helioviewer.userSettings.get("state.drawers.#hv-drawer-timeline-events.open") == true &&
          timelineRes == "m"
        ) {
          $(".highcharts-series > rect").show();
        }
      }

      return true;
    },

    toggleEventPopUp: function () {
      if (!this.eventPopupDomNode) {
        this._populatePopup();
      }

      if (this._popupVisible) {
        this.eventPopupDomNode.hide();
        this.eventMarkerDomNode.css("z-index", this._zIndex);
      } else {
        this.popup_pos = {
          x: this.hv_hpc_x / Helioviewer.userSettings.settings.state.imageScale + MARKER_OFFSET_X,
          y: -this.hv_hpc_y / Helioviewer.userSettings.settings.state.imageScale - MARKER_OFFSET_Y
        };
        if (this.hv_hpc_x > 400) {
          this.popup_pos.x -= this.eventPopupDomNode.width() + MARKER_OFFSET_Y;
        }
        this.eventPopupDomNode.css({
          left: this.popup_pos.x + "px",
          top: this.popup_pos.y + "px",
          "z-index": "1000"
          // Additional styles found in events.css
        });
        this.eventMarkerDomNode.css("z-index", "998");
        //$('.event-popup').hide();
        this.eventPopupDomNode.show();
      }

      this._popupVisible = !this._popupVisible;
      return true;
    },

    /**
     * @description Displays the Image meta information and properties associated with a given image
     *
     */
    _showEventInfoDialog: function () {
      var params,
        dtype,
        split,
        self = this,
        dialog = $("#event-info-dialog");

      this._buildEventInfoDialog();

      // Format numbers for human readability
      $(".event-header-value.integer").number(true);
      $(".event-header-value.float").each(function (i, num) {
        split = num.innerHTML.split(".");
        if (typeof split[1] != "undefined") {
          num.innerHTML = $.number(num.innerHTML, split[1].length);
        } else {
          num.innerHTML = $.number(num.innerHTML);
        }
      });
    },

    /**
     * @description
     *
     */
    _buildEventInfoDialog: function () {
      var dialog,
        sortBtn,
        tabs,
        html = "",
        tag,
        json,
        headingText,
        self = this;

      // Format results
      dialog = $("<div id='event-info-dialog' class='event-info-dialog' />");

      // Generate heading text from label
      const eventTypeLabel = EventLoader.getEventTypeName(this.type);
      headingText = eventTypeLabel + ": " + this.fixTitles(this.label.split("\n")[0]);

      // Render React EventViewer for all event sources (HEK, CCMC, RHESSI)
      html += renderToString(<div id={this._uniqueId}></div>);

      let hidingEmpty = false;

      function updateHiddenClasses() {
        $.each($(dialog).find("div.empty"), function (index, node) {
          if (hidingEmpty) {
            $(node).css("display", "none");
          } else {
            $(node).css("display", "block");
          }
        });
      }

      dialog
        .append(html)
        .appendTo("body")
        .dialog({
          autoOpen: true,
          title: headingText,
          minWidth: 746,
          width: 746,
          maxWidth: 746,
          height: 550,
          draggable: true,
          resizable: false,
          buttons: [
            {
              text: "Hide Empty Rows",
              class: "toggle_empty",
              click: function () {
                hidingEmpty = !hidingEmpty;

                var text = $(this).parent().find(".toggle_empty span.ui-button-text");

                updateHiddenClasses();

                if (text.html() == "Hide Empty Rows") {
                  text.html("Show Empty Rows");
                } else {
                  text.html("Hide Empty Rows");
                }
              }
            }
          ],
          create: function (event, ui) {
            dialog.css("overflow", "hidden");

            // Render React EventViewer for all event sources
            let reactContainer = dialog.find("#" + self._uniqueId);
            if (reactContainer.length == 1) {
              const root = createRoot(reactContainer[0]);
              root.render(<EventViewer views={self.views} source={self.source} onChange={updateHiddenClasses} />);
            }
          }
        });
    },

    _populatePopup: function () {
      var content = "",
        headingText = "",
        self = this;

      const eventTypeLabel = EventLoader.getEventTypeName(this.type);

      headingText = eventTypeLabel + ": " + this.fixTitles(this.label.split("\n")[0]);

      content +=
        '<div class="close-button ui-icon ui-icon-closethick" title="Close PopUp Window"></div>' +
        "\n" +
        '<h1 class="user-selectable">' +
        headingText +
        "</h1>" +
        "\n";

      if (this.event_peaktime != null && this.event_peaktime != "") {
        content +=
          '<div class="container">' +
          "\n" +
          "\t" +
          '<div class="param-container"><div class="param-label user-selectable">Peak Time:</div></div>' +
          "\n" +
          "\t" +
          '<div class="value-container"><div class="param-value user-selectable">' +
          this.event_peaktime.replace("T", " ") +
          ' <span class="dateSelector" data-tip-pisition="right" data-date-time="' +
          this.event_peaktime.replace("T", " ") +
          '">UTC</span></div>' +
          (embedView ? "" : '<div class="ui-icon ui-icon-arrowstop-1-n" title="Jump to Event Peak Time"></div></div>') +
          "\n" +
          "</div>" +
          "\n";
      }
      content +=
        '<div class="container">' +
        "\n" +
        "\t" +
        '<div class="param-container"><div class="param-label user-selectable">Start Time: </div></div>' +
        "\n" +
        "\t" +
        '<div class="value-container"><div class="param-value user-selectable">' +
        this.start.replace("T", " ") +
        ' <span class="dateSelector" data-tip-pisition="right" data-date-time="' +
        this.start.replace("T", " ") +
        '">UTC</span></div>' +
        (embedView ? "" : '<div class="ui-icon ui-icon-arrowstop-1-w" title="Jump to Event Start Time"></div></div>') +
        "\n" +
        "</div>" +
        "\n" +
        '<div class="container">' +
        "\n" +
        "\t" +
        '<div class="param-container"><div class="param-label user-selectable">End Time: </div></div>' +
        "\n" +
        "\t" +
        '<div class="value-container"><div class="param-value user-selectable">' +
        this.end.replace("T", " ") +
        ' <span class="dateSelector" data-tip-pisition="right" data-date-time="' +
        this.end.replace("T", " ") +
        '">UTC</span></div>' +
        (embedView ? "" : '<div class="ui-icon ui-icon-arrowstop-1-e" title="Jump to Event End Time"></div>') +
        "\n" +
        "</div>" +
        "\n";

      // Display label in popup
      if (this.hasOwnProperty("label") && this.label.length > 0) {
        let lines = this.label.replace("\n", " ");
        content +=
          '<div class="container">' +
          "\n" +
          "\t" +
          '<div class="param-container"><div class="param-label user-selectable">Label: </div></div>' +
          "\n" +
          "\t" +
          '<div class="value-container"><div class="param-value user-selectable">' +
          this.fixTitles(lines) +
          "</div></div>" +
          "\n" +
          "</div>" +
          "\n";
      }

      var noaaSearch = "";
      if (this.path == "HEK>>Active Region>>NOAA SWPC Observer" || this.path == "HEK>>Active Region>>HMI SHARP") {
        var eventName = this.fixTitles(this.label.split("\n")[0]);
        noaaSearch =
          '<div class="btn-label btn event-search-external text-btn" data-url=\'https://ui.adsabs.harvard.edu/#search/q="' +
          eventName +
          '"&sort=date desc\' target="_blank"><i class="fa fa-search fa-fw"></i>ADS search for ' +
          eventName +
          '<i class="fa fa-external-link fa-fw"></i></div>\
						<div style="clear:both"></div>\
						<div class="btn-label btn event-search-external text-btn" data-url="https://arxiv.org/search/?query=' +
          eventName +
          '&searchtype=all" target="_blank"><i class="fa fa-search fa-fw"></i>arXiv search for ' +
          eventName +
          '<i class="fa fa-external-link fa-fw"></i></div>\
						<div style="clear:both"></div>';
      }

      let sourceLink = "";
      if (this.hasOwnProperty("link") && this.link !== null) {
        sourceLink +=
          '\
            <div class="btn-label btn event-search-external text-btn" data-url="' +
          this.link.url +
          '" target="_blank">' +
          this.link.text +
          ' <i class="fa fa-external-link fa-fw"></i></div>\
            <div style="clear:both"></div>';
      }

      //Only add buttons to main site event pop-ups, remove buttons from k12
      if (outputType != "minimal" && this.hasOwnProperty("start") && this.hasOwnProperty("end")) {
        content +=
          '<div class="btn-container">' +
          "\n" +
          "\t" +
          '<div class="btn-label btn event-info text-btn"><i class="fa fa-info-circle fa-fw"></i> View source data</div>' +
          "\n" +
          '<div style="clear:both"></div>\n' +
          "\t" +
          (embedView
            ? ""
            : '<div class="btn-label btn event-create-movie text-btn" data-start="' +
              this.start +
              '" data-end="' +
              this.end +
              '"><i class="fa fa-video-camera fa-fw"></i> Make movie using event times and current field of view</div>') +
          "\n" +
          '<div style="clear:both"></div>\n' +
          //+       "\t"+'<div class="ui-icon ui-icon-copy btn copy-to-data" data-start="'+this.start.replace('T',' ').replace(/-/gi,'/')+'" data-end="'+this.end.replace('T',' ').replace(/-/gi,'/')+'"></div>'
          noaaSearch +
          "\t" +
          (embedView
            ? ""
            : '<div class="btn-label btn copy-to-data text-btn" data-start="' +
              this.start.replace("T", " ").replace(/-/gi, "/") +
              '" data-end="' +
              this.end.replace("T", " ").replace(/-/gi, "/") +
              '"><i class="fa fa-copy fa-fw"></i> Copy start / end times to data download</div>') +
          "\n" +
          //+       "\t"+'<div class="ui-icon ui-icon-video btn event-movie"></div><div class="btn-label btn event-movie">Generate Movie</div>'+"\n"
          '<div style="clear:both"></div>\n' +
          sourceLink +
          "</div>" +
          "\n";
      }

      this.eventPopupDomNode = $("<div/>");
      this.eventPopupDomNode.hide();
      this.eventPopupDomNode.attr({
        class: "event-popup constant-size"
      });

      this.eventPopupDomNode.html(content);

      // Event bindings
      this.eventPopupDomNode.find(".ui-icon-arrowstop-1-w").bind("click", function () {
        helioviewerWebClient.timeControls.setDate(new Date(self.start + ".000Z"));
      });
      this.eventPopupDomNode.find(".ui-icon-arrowstop-1-n").bind("click", function () {
        helioviewerWebClient.timeControls.setDate(new Date(self.event_peaktime + ".000Z"));
      });
      this.eventPopupDomNode.find(".ui-icon-arrowstop-1-e").bind("click", function () {
        helioviewerWebClient.timeControls.setDate(new Date(self.end + ".000Z"));
      });
      this.eventPopupDomNode.find(".event-movie").bind("click", function () {
        alert("Event-based movie generation not yet implemented.");
      });
      this.eventPopupDomNode.find(".copy-to-data").bind("click", function () {
        var start = $(this).data("start");
        var end = $(this).data("end");

        var startArr = start.split(" ");
        var endArr = end.split(" ");

        //Set dates
        if (Helioviewer.userSettings.get("state.drawers.#hv-drawer-data.open") == false) {
          helioviewerWebClient.drawerDataClick(true);
        }
        $("#vso-start-date, #sdo-start-date").val(startArr[0]);
        $("#vso-start-time, #sdo-start-time").val(startArr[1]).change();
        $("#vso-end-date, #sdo-end-date").val(endArr[0]);
        $("#vso-end-time, #sdo-end-time").val(endArr[1]).change();
      });

      //Create Movie from event popup
      this.eventPopupDomNode.find(".event-create-movie").bind("click", function () {
        var start = $(this).data("start").replace(" ", "T") + ".000Z";
        var end = $(this).data("end").replace(" ", "T") + ".000Z";

        //build an movie settings object
        var formSettings = [
          { name: "speed-method", value: "framerate" },
          { name: "framerate", value: 15 },
          { name: "startTime", value: start },
          { name: "endTime", value: end }
        ];

        helioviewerWebClient._movieManagerUI.requestQueueMovie(formSettings);
      });

      this.eventPopupDomNode.find(".event-search-external").bind("click", function () {
        var url = $(this).data("url");
        window.open(url, "_blank");
      });
      this.eventPopupDomNode.find(".btn.event-info").bind("click", $.proxy(this._showEventInfoDialog, this));
      this.eventPopupDomNode.find(".close-button").bind("click", $.proxy(this.toggleEventPopUp, this));
      this.eventPopupDomNode.bind("mousedown", function () {
        return false;
      });
      this.eventPopupDomNode.bind("dblclick", function () {
        return false;
      });
      this.eventPopupDomNode.draggable();

      // Allow text selection (prevent drag where text exists)
      this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").click(function (event) {
        event.stopImmediatePropagation();
      });
      this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").mousedown(function (event) {
        event.stopImmediatePropagation();
      });
      this.eventPopupDomNode.find("h1, .param-label, .param-value, .btn-container .btn").dblclick(function (event) {
        event.stopImmediatePropagation();
      });
      this.eventPopupDomNode.find("h1, .param-label, .param-value").enableSelection();

      this.parentFRM.append(this.eventPopupDomNode);
      helioviewerWebClient._timeSelector = new TimeSelector();
    },

    fixTitles: function (s) {
      if (!s) {
        return "";
      }
      s = s.replace(/u03b1/g, "α");
      s = s.replace(/u03b2/g, "β");
      s = s.replace(/u03b3/g, "γ");
      s = s.replace(/u00b1/g, "±");
      s = s.replace(/u00b2/g, "²");

      return s;
    },

    /**
     * Emphasize label of the marker and highlight the footprint region,
     */
    emphasize: function () {
      this.eventMarkerDomNode.css("zIndex", "997");
      this._label.addClass("event-label-hover");

      if (this.hasFootprint() && this.eventRegionDomNode) {
        // Bring the region to the top. Every source has its own event container, but those
        // containers are position:static, so all region SVGs and pins of all sources stack in
        // the one #moving-container context by z-index (regions 0, pins 1..n). Re-ordering the
        // DOM inside one container would still leave the region under the next source's
        // regions, so raise its z-index instead: 996 sits above every region and pin, and just
        // under this marker's own pin (997) and its label. Regions have pointer-events:none, so
        // pins that end up under the translucent fill stay clickable. deEmphasize restores the
        // value createRegion set.
        this.eventRegionDomNode.css("zIndex", "996");
        this.eventFarRegionDomNode.css("zIndex", "995"); // above other events' fills, below our own

        let baseColor = EventLoader.getEventTypeColor(this.type);
        // Near-side fills get the solid highlight; behind-sun ghosts get a slightly brighter,
        // slightly wider dashed stroke over a soft black dashed underlay (still no fill, still
        // dashed, so they keep reading as "behind the sun"). The underlay does for the ghost what
        // the black outline does for the fill: a light dashed line on the bright disk barely
        // changes with alpha alone.
        // Selectors are tag-agnostic: fills are <polygon>s, ghosts may be <polygon> or <polyline>
        this.eventRegionDomNode.find(".behind-sun-none").each(function () {
          this.style.fill = hexToRgba(baseColor, 0.6);
          this.style.stroke = "rgba(0, 0, 0, 0.8)";
          this.style.strokeWidth = "3px";
          this.style.strokeLinejoin = "round";
        });
        // Ghost highlight is deliberately mild: a little brighter and a little wider, same dash
        // pattern, plus the soft black underlay. Solid colour at 3px read as a glowing rope.
        this.eventFarRegionDomNode.find(".behind-sun-ghost").each(function () {
          this.style.stroke = hexToRgba(baseColor, 0.85);
          this.style.strokeWidth = "2px";
        });
        // The tint leaves the shared 0.18 layer for the hover and joins this event's far-side
        // SVG (z-index 995) at 0.28, under the dashed lines, so it rises with them
        if (this._tintGroup) {
          this._tintGroup.style.opacity = "0.28";
          if (this._tintLayerGroup) {
            const far = this.eventFarRegionDomNode[0];
            far.insertBefore(this._tintGroup, far.querySelector("g.behind-sun-ghosts"));
          }
        }
        this.eventFarRegionDomNode.find(".behind-sun-ghost-halo").each(function () {
          this.style.display = ""; // the black underlay gives the dashed line its halo
        });
      }
    },

    /**
     * deEmphasize label of the marker and restore the footprint region,
     */
    deEmphasize: function () {
      this.eventMarkerDomNode.css("zIndex", this._zIndex);
      this._label.removeClass("event-label-hover");

      if (this.hasFootprint() && this.eventRegionDomNode) {
        // Back to the idle stacking level createRegion gave it
        this.eventRegionDomNode.css("zIndex", this._regionZIndex);
        this.eventFarRegionDomNode.css("zIndex", this._regionZIndex - 1);

        let baseColor = EventLoader.getEventTypeColor(this.type);
        this.eventRegionDomNode.find(".behind-sun-none").each(function () {
          this.style.fill = hexToRgba(baseColor, 0.4);
          this.style.stroke = "rgba(0, 0, 0, 0.533)";
          this.style.strokeWidth = "1.5px";
          this.style.strokeLinejoin = "round";
        });
        // Restore ghosts to their idle style (values must match createRegion)
        this.eventFarRegionDomNode.find(".behind-sun-ghost").each(function () {
          this.style.stroke = hexToRgba(baseColor, 0.55);
          this.style.strokeWidth = "1.5px";
        });
        if (this._tintGroup) {
          if (this._tintLayerGroup) {
            this._tintGroup.style.opacity = "";
            this._tintLayerGroup.appendChild(this._tintGroup); // back into the shared 0.18 layer
          } else {
            this._tintGroup.style.opacity = "0.18";
          }
        }
        this.eventFarRegionDomNode.find(".behind-sun-ghost-halo").each(function () {
          this.style.display = "none";
        });
      }
    },

    /**
     * Checks if the marker belongs to given FRM,
     * @param {string} frmName, name of FRM, internally handles underscored frmNames as well
     * @returns {booelan}
     */
    belongsToFrm: function (frmName) {
      // Usually frmNames has _ for space
      let frmNameNonUnderScored = frmName.replaceAll("_", " ");
      return this.event.name == frmName || this.event.name == frmNameNonUnderScored;
    },

    /**
     * Checks if the marker belongs to event type,
     * @param {string} eventType, event type is the pin of event data
     * @returns {booelan}
     */
    belongsToEventType: function (eventType) {
      return this.event.pin == eventType;
    }
  }
);

export { EventMarker };
