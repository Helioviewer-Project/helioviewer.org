import React, { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Layers } from "./components/layers";


/**
 * Renders the current helioviewer state
 */
function Hv3D({coordinator, state, setCameraPosition }) {
  // Disable react 3 fiber automatic rendering by executing useFrame with a
  // non-zero value.
  useFrame(() => {}, 1);

  /** Get a handle to the WebGLRenderer */
  const { gl, camera } = useThree();

  /** Set the background color to black. */
  useEffect(() => {
    gl.setClearColor("#000000");
  }, [gl]);

  return <Layers date={state.state.date} layers={Object.values(state.state.tileLayers)} coordinator={coordinator} setCameraPosition={setCameraPosition} />;
}

export default Hv3D;
