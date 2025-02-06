import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import Hv3D from "./helioviewer3d";
import { CameraControls } from "@react-three/drei";

/** Reads the state of the HV application from localStorage */
function getHvState() {
  return JSON.parse(localStorage.getItem("settings"));
}

function Viewport3D() {
  /** Tracks the current state of Helioviewer */
  const [hvState, setHvState] = useState(getHvState());
  const controls = useRef(null);

  useEffect(() => {
    /**
     * Listen for changes to state.
     * Helioviewer sends this trigger whenever changes to the state are made.
     */
    $(document).on("update-external-datasource-integration", () => {
      setHvState(getHvState());
    });
  });

  useEffect(() => {
    if (controls.current != null) {
      controls.current.zoomTo(150);
    }
  }, [controls.current]);

  /**
   * Move the camera to the given position
   * @param {Vector3} position
   */
  const setCameraPosition = (position) => {
    controls.current.setLookAt(position.x, position.y, position.z, 0, 0, 0, false);
  };

  /** Render the 3D canvas */
  return (
    <>
      <div className="solid-bg"></div>
      <Canvas orthographic={true}>
        {/* Set up the camera controls */}
        <CameraControls ref={controls} />
        {/* Render the 3D viewport from the current state */}
        <Hv3D state={hvState} setCameraPosition={setCameraPosition} />
      </Canvas>
    </>
  );
}

export default Viewport3D;
