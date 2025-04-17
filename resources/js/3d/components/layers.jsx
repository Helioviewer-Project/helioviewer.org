import React from "react";
import { PLANE_SOURCES } from "@helioviewer/sun";
import Sun3D from "./sun";

/**
 * Returns the computed render priority for this instance based on the observatory and index.
 *
 * There's a trick to getting this to render correctly, and it's controlling the
 * render order. Planes must be rendered first so that they don't overlap over
 * the sun where they're not supposed to.
 *
 * @param {number} source - The name of the observatory
 * @param {number} index - The index of the layer
 * @returns {number} The computed render priority
 */
function getRenderPriority(source, index) {
  if (PLANE_SOURCES.indexOf(source) != -1) {
    return -index;
  }
  return index;
}

function Layers({date, layers, coordinator, setCameraPosition}) {
  const priorities = layers.map((layer, idx) => getRenderPriority(layer.sourceId, idx));
  // Returns true if the sourceId must be rendered in a plane.
  const isPlane = (sourceId) => PLANE_SOURCES.indexOf(sourceId) !== -1;
  // Check if there are any non-plane models of the solar sphere to be rendered.
  // We need to know this to add the occluder to the plane models so that the
  // spheres don't blend with the planes.
  const sceneHasSphereModels = layers.some((layer) => PLANE_SOURCES.indexOf(layer.sourceId) === -1);

  /** Render each layer. Plus a sphere that holds as a background for the sun. */
  return (
    <>
      {layers.map((layer, idx) => (
        <Sun3D
          key={idx}
          coordinator={coordinator}
          isPrimaryLayer={idx == 0}
          renderPriority={priorities[idx]}
          source={layer.sourceId}
          date={date}
          opacity={layer.visible ? layer.opacity : 0}
          observatory={layer.uiLabels[0].name}
          setCameraPosition={setCameraPosition}
          useSphereOcclusion={sceneHasSphereModels && isPlane(layer.sourceId)}
          onLoad={() => {}}
        />
      ))}
    </>
  );
}

export { Layers }
