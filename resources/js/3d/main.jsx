import React from "react";
import { createRoot } from "react-dom/client";
import Viewport3D from "./viewport3d";

/** Button to toggle between 3D and 2D views */
const toggleBtn = document.getElementById("js-3d-toggle");
/** Handle to HTML element which shows the 3D view */
const coolViewport = document.getElementById("view-3d");

/**
 * Set up the toggle button that switches between the 2D and 3D viewports
 * When clicked, change the z-index of the 3D view so it appears in front.
 * @note We need to use z-indexes instead of the css display property because
 *       Helioviewer depends on the position of the 2D viewport. Changing the
 *       display property will effect the viewport's position.
 */
toggleBtn.onclick = () => {
  toggleBtn.classList.toggle("active");
  coolViewport.style.zIndex = coolViewport.style.zIndex == "-10" ? "0" : "-10";
  // TODO: Update the remainder of the UI to hide things we don't currently
  //       support
};

/** Render the 3D view. */
createRoot(document.getElementById("view-3d")).render(<Viewport3D />);
