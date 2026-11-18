# SPICE WCS frontend integration (draft)

Companion to https://github.com/Helioviewer-Project/api/pull/513.

The tile API retains its scalar raster scale and additionally provides the
normalized CD matrix. The frontend divides CD by that scalar scale and
conjugates it by the FITS-to-screen Y flip. Both transformed bounds and the
inverse viewport bounds are needed to load tiles at the rotated corners.
The API reference pixel already includes inverse(CD) * CRVAL; do not apply
CRVAL a second time. SPICE uses additive blending over background layers.

## Export contract and Fast Movies

The initial API #513 branch predates the current event export contract.
Its screenshot schema rejects event_selections/event_visibility_selections.
Replacing these with eventsState: {} also fails: the old validator turns the
empty object into an array, then rejects it as a non-object. A structured
legacy tree succeeds, but replacing current frontend fields would break the
current API and lose current event selections.

Keep the current frontend export fields. Reapply the two API SPICE commits on
API main including Fast Movies (#524). The SPICE fixture test must pass an
EventContext::empty() instead of null to the new composite constructor.
This integration was exercised separately: screenshots returned HTTP 200 with
the current frontend fields, and five screenshot/frame regression tests passed
(67 assertions). Different observation and base-difference dates were accepted;
this mismatch does not cause the observed schema rejection.

## 3D dependency and release gate

The 3D frontend change requires the companion sun changes: independent pixel
scales, row-scaled PC (or explicit CD), reference-pixel offsets and a bounded
surface patch. npm reported 0.8.1 as the latest @helioviewer/sun release on
2026-11-18; its package does not contain planeWcs or SPICE surface sources.
The current manifest/lockfile remain registry-based. They do not yet deliver
this 3D implementation. This PR must remain draft until the sun change is
validated and released, then the frontend dependency and lockfile must be
updated to that actual release (a proposed next minor is 0.9.0).

Local validation used a compiled tarball installed outside the manifests.
Do not commit that installation or replace the dependency with a file: URL.
Sun, React Three Fiber and Drei must resolve their rendering objects to the
same Three.js instance (0.175.0 during validation). A private stats-gl subtree
also has 0.170.0; it does not supply the rendered solar objects.

## Validation limits

Frontend Jest covers a real SPICE matrix, anisotropy/shear, the screen Y sign,
inverse mapping, invalid/legacy matrices, and screenshot event selections.
The 2D browser view shows a tilted raster over AIA, and exports were generated.
The selected AIA archive image is stale relative to the SPICE observation, so
these images do not demonstrate scientific co-registration.

Front/profile 3D screenshots show a SPICE patch but the AIA disk is nearly
black. The 3D projection, EUI comparisons and off-limb behavior remain
unvalidated. Frame constructor/compositor tests passed; an encoded movie and
the asynchronous Fast Movies worker have not been exercised end to end.
No local endpoint configuration or generated bundles belong in this PR.
