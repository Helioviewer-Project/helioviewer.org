import React from "react";
import { createRoot } from "react-dom/client";
import { Coordinator } from "./coordinates/coordinator";
import { SetHelioviewerApiUrl } from "@helioviewer/sun";
import Viewport3D from "./viewport3d";

// Tracks if 3D mode is active.
// This is toggled when the 3D button is clicked
let is3dEnabled = false;

// Tracks if 3D mode has been turned on at least once.
// This is a performance optimization to make sure we don't load all 3D
// assets until the user requests it.
// Once 3D has been launched and assets have been loaded, then it becomes
// a simple show/hide.
let is3dLaunched = false;

// This function can be used by the main HV application to check if
// 3D mode is currently visible.
window.is3dViewActive = () => is3dEnabled;

/** Handles what to do if 3D rendering fails */
const onFail = (error) => {
  console.error(error);
  Helioviewer.messageConsole.error("3D rendering is currently unavailable. Check back later.");
};

/**
 * Reads the state of the HV application from localStorage
 * and parses it into the required parameters for the 3D viewport module.
 */
function getHvState() {
  const state = JSON.parse(localStorage.getItem("settings"));
  const date = state.state.date;
  const layers = Object.values(state.state.tileLayers).map((hvLayer) => {
    return {
      sourceId: hvLayer.sourceId,
      observatory: hvLayer.uiLabels[0].name,
      visible: hvLayer.visible,
      opacity: hvLayer.opacity
    };
  });
  return [layers, date];
}

/**
/**
 * @typedef {Object} LayerObject
 * @property {string} sourceId - The ID of the source
 * @property {number} opacity - The opacity of the layer
 * @property {boolean} visible - The visibility of the layer
 * @property {string} observatory - The name of the observatory
 */
function render(root, visible, coordinator_url) {
  // Extract parameters for the 3D viewport from the HV State
  const [layers, observationTime] = getHvState();
  root.render(
    <Viewport3D
      active={is3dLaunched}
      layers={layers}
      date={observationTime}
      visible={visible}
      coordinator={new Coordinator(coordinator_url)}
      onFail={onFail}
      onLoadStart={() => helioviewerWebClient.startLoading()}
      onLoadFinish={() => helioviewerWebClient.stopLoading()}
    />
  );
}

/** Handle to HTML element which shows the 3D view */
const viewport3dRoot = document.getElementById("view-3d");

function init3DButtons(rerender_func) {
  /** Button to toggle between 3D and 2D views */
  const toggleButtons = document.querySelectorAll(".js-3d-toggle");

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
      if (!is3dLaunched) {
        is3dLaunched = true;
      }
      is3dEnabled = !is3dEnabled;
      btn.classList.toggle("active");
      document.querySelectorAll(".toggle3d").forEach((element) => {
        element.classList.toggle("masked");
      });
      viewport3dRoot.style.zIndex = viewport3dRoot.style.zIndex == "-10" ? "0" : "-10";
      rerender_func(is3dEnabled);
    };
  });
}

/** Render the 3D view. */
window.Init3D = (coordinator_url, apiUrl) => {
  SetHelioviewerApiUrl(apiUrl + "?action=");
  // Create root and begin executing the component via the render call
  const root = createRoot(document.getElementById("view-3d"));
  render(root, false, coordinator_url);

  // Initialize the event listeners on the buttons that enable/disable 3D mode.
  init3DButtons((visible) => render(root, visible, coordinator_url));

  /**
   * Listen for changes to state.
   * Helioviewer sends this trigger whenever changes to the state are made.
   * re-render whenever state is updated
   */
  $(document).on("update-external-datasource-integration", () => {
    render(root, is3dEnabled, coordinator_url);
  });
};
