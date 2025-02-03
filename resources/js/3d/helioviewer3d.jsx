import React, { useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import Sun3D from "./sun";

/**
 * Renders the current helioviewer state
 */
function Hv3D({ state }) {
  /** Get a handle to the WebGLRenderer */
  const { gl } = useThree();

  /** Set the background color to black. */
  useEffect(() => {
    gl.setClearColor("#000000");
  }, [gl]);

  /** Render each layer. */
  return (
    <>
      {Object.values(state.state.tileLayers).map((layer, idx) => (
        <Sun3D
          key={idx}
          index={idx}
          source={layer.sourceId}
          date={state.state.date}
          opacity={layer.visible ? layer.opacity : 0}
          observatory={layer.uiLabels[0].name}
          onLoad={() => handleLayerLoad(layer.sourceId)}
        />
      ))}
    </>
  );
}

export default Hv3D;
