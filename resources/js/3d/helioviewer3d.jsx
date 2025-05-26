import React, { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Layers } from "./components/layers";

/**
 * Renders the current helioviewer state
 */
function Hv3D({ coordinator, layers, date, setCameraPosition, onFail, onLoadStart, onLoadFinish }) {
  // Disable react 3 fiber automatic rendering by executing useFrame with a
  // non-zero value.
  useFrame(() => {}, 1);

  /** Get a handle to the WebGLRenderer */
  const { gl } = useThree();

  /** Set the background color to black. */
  useEffect(() => {
    gl.setClearColor("#000000");
  }, [gl]);

  return (
    <Layers
      onLoadStart={onLoadStart}
      onLoadFinish={onLoadFinish}
      date={date}
      layers={layers}
      coordinator={coordinator}
      setCameraPosition={setCameraPosition}
      onFail={onFail}
    />
  );
}

export default Hv3D;
