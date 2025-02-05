import React, { useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import Sun3D from "./sun";
import Background from "./background";

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
  // add 1 as 0 is reserved.
  let priority = index += 1;
  if ([4,5].indexOf(source) != -1) {
    return -priority;
  }
  return priority + 1;
}

/**
 * Renders the current helioviewer state
 */
function Hv3D({ state, setCameraPosition }) {
  /** Get a handle to the WebGLRenderer */
  const { gl } = useThree();

  /** Set the background color to black. */
  useEffect(() => {
    gl.setClearColor("#000000");
  }, [gl]);

  const priorities = Object.values(state.state.tileLayers).map((layer, idx) => getRenderPriority(layer.sourceId, idx))
  console.log(priorities, Math.min(...priorities));

  /** Render each layer. Plus a sphere that holds as a background for the sun. */
  return (
    <>
      <Background />
      {Object.values(state.state.tileLayers).map((layer, idx) => (
        <Sun3D
          key={idx}
          isPrimaryLayer={idx == 0}
          renderPriority={priorities[idx]}
          source={layer.sourceId}
          date={state.state.date}
          opacity={layer.visible ? layer.opacity : 0}
          observatory={layer.uiLabels[0].name}
          setCameraPosition={setCameraPosition}
        />
      ))}
    </>
  );
}

export default Hv3D;
