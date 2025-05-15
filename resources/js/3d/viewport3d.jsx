import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Hv3D from "./helioviewer3d";
import { CameraControls } from "@react-three/drei";

function Viewport3D({ active, visible, layers, date, coordinator, onFail, onLoadStart, onLoadFinish }) {
  const controls = useRef(null);

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
    controls.current.setLookAt(position.x, position.y, position.z, 0, 0, 0);
  };

  /** Render the 3D canvas */
  return (
    <>
      <div className="solid-bg"></div>
      {/* If enabled, show the 3D viewport. This can be turned on and off anytime. */}
      <Canvas style={{ visibility: visible ? "visible" : "hidden" }} orthographic={true}>
        {/* Set up the camera controls */}
        <CameraControls ref={controls} dollySpeed={20} />
        {/* Render the 3D viewport from the current state */}
        {/* This is only done if 3D mode is turned on, which happens once per session and cannot be turned off. */}
        {active ? (
          <Hv3D
            onLoadStart={onLoadStart}
            onLoadFinish={onLoadFinish}
            coordinator={coordinator}
            layers={layers}
            date={date}
            setCameraPosition={setCameraPosition}
            onFail={onFail}
          />
        ) : (
          <></>
        )}
      </Canvas>
    </>
  );
}

export default Viewport3D;
