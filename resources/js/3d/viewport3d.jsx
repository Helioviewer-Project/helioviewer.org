import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
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
      controls.current.zoomTo(400);
    }
  }, [controls.current]);

  /** Render the 3D canvas */
  return (
    <Canvas orthographic={true}>
      {/* Set up the camera controls */}
      <CameraControls ref={controls} />
      {/* Render the 3D viewport from the current state */}
      <Hv3D state={hvState} />
    </Canvas>
  );
}

export default Viewport3D;
