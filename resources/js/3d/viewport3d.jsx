import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Hv3D from "./helioviewer3d";
import { CameraControls } from "@react-three/drei";

/** Handle to HTML element which shows the 3D view */
const viewport3dRoot = document.getElementById("view-3d");

/** Reads the state of the HV application from localStorage */
function getHvState() {
  return JSON.parse(localStorage.getItem("settings"));
}

function Viewport3D({coordinator}) {
  /** Tracks the current state of Helioviewer */
  const [hvState, setHvState] = useState(getHvState());
  /** Tracks if the 3D view is currently enabled */
  // This is needed to make switching between 2D and 3D more fluid.
  // The first time a user enters 3D mode, this will turn on and start loading
  // data required for 3D rendering. It will stay on for the remainder of the
  // session, but the user may still switch between 2D and 3D.
  const [on, turnOn] = useState(false);
  /** Tracks if the 3D view is currently visible */
  const [enabled, setEnabled] = useState(false);
  const controls = useRef(null);

  useEffect(() => {
    const init3DButtons = () => {
      /** Button to toggle between 3D and 2D views */
      const toggleButtons = document.querySelectorAll(".js-3d-toggle");
      /** Create a function for legacy HV to check if the 3D view is active. */
      window.is3dViewActive = () => enabled

      /**
       * Set up the toggle button that switches between the 2D and 3D viewports
       * When clicked, change the z-index of the 3D view so it appears in front.
       * @note We need to use z-indexes instead of the css display property because
       *       Helioviewer depends on the position of the 2D viewport. Changing the
       *       display property will effect the viewport's position.
       */
      toggleButtons.forEach((btn) => {
        btn.onclick = () => {
          // Turn on once.
          // This enables loading all 3D data whenever the observation date changes.
          if (!on) {
            turnOn(true);
          }
          setEnabled(!enabled);
          btn.classList.toggle("active");
          document.querySelectorAll(".toggle3d").forEach((element) => {
            element.classList.toggle("masked");
          });
          viewport3dRoot.style.zIndex = viewport3dRoot.style.zIndex == "-10" ? "0" : "-10";
          // TODO: Update the remainder of the UI to hide things we don't currently
          //       support
        };
      });
    };
    init3DButtons();

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
    controls.current.setLookAt(position.x, position.y, position.z, 0, 0, 0);
  };

  /** Render the 3D canvas */
  return <>
      <div className="solid-bg"></div>
      {/* If enabled, show the 3D viewport. This can be turned on and off anytime. */}
      <Canvas style={{visibility: enabled ? "visible" : "hidden"}} orthographic={true}>
        {/* Set up the camera controls */}
        <CameraControls ref={controls} />
        {/* Render the 3D viewport from the current state */}
        {/* This is only done if 3D mode is turned on, which happens once per session and cannot be turned off. */}
        {on ? <Hv3D coordinator={coordinator} state={hvState} setCameraPosition={setCameraPosition} /> : <></> }
      </Canvas>
    </>;
}

export default Viewport3D;
