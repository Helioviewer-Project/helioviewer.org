import React from "react";
import { createRoot } from "react-dom/client";
import Viewport3D from "./viewport3d";

/** Handle to HTML element which shows the 3D view */
const coolViewport = document.getElementById("view-3d");

window.init3DButtons = () => {
  /** Button to toggle between 3D and 2D views */
  const toggleButtons = document.querySelectorAll(".js-3d-toggle");
  window.is3dViewActive = () => toggleButtons[0].classList.contains("active");

  /**
   * Set up the toggle button that switches between the 2D and 3D viewports
   * When clicked, change the z-index of the 3D view so it appears in front.
   * @note We need to use z-indexes instead of the css display property because
   *       Helioviewer depends on the position of the 2D viewport. Changing the
   *       display property will effect the viewport's position.
   */
  toggleButtons.forEach((btn) => {
    btn.onclick = () => {
      btn.classList.toggle("active");
      document.querySelectorAll(".toggle3d").forEach((element) => {
        element.classList.toggle("masked");
      });
      coolViewport.style.zIndex = coolViewport.style.zIndex == "-10" ? "0" : "-10";
      // TODO: Update the remainder of the UI to hide things we don't currently
      //       support
    };
  });
};
init3DButtons();

/** Render the 3D view. */
createRoot(document.getElementById("view-3d")).render(<Viewport3D />);
