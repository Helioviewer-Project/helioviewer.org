import React from "react";
import { createRoot } from "react-dom/client";
import { Coordinator } from "./coordinates/coordinator";
import { SetHelioviewerApiUrl } from "@helioviewer/sun";
import Viewport3D from "./viewport3d";

// Tracks if 3D mode has been turned on at least once.
// This is a performance optimization to make sure we don't load all 3D
// assets until the user requests it.
// Once 3D has been launched and assets have been loaded, then it becomes
// a simple show/hide.
let is3dLaunched = false;

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
  const date = Helioviewer.userSettings.get("state.date");
  const enabled = Helioviewer.userSettings.get("state.enable3d");
  /**
   * @typedef {Object} LayerObject
   * @property {string} sourceId - The ID of the source
   * @property {number} opacity - The opacity of the layer
   * @property {boolean} visible - The visibility of the layer
   * @property {string} observatory - The name of the observatory
   */
  const layers = Object.values(Helioviewer.userSettings.get("state.tileLayers")).map((hvLayer) => {
    return {
      sourceId: hvLayer.sourceId,
      observatory: hvLayer.uiLabels[0].name,
      visible: hvLayer.visible,
      opacity: hvLayer.opacity
    };
  });
  return [layers, date, enabled];
}

function render(root, launched, enabled, layers, date, coordinator_url) {
  root.render(
    <Viewport3D
      active={launched}
      layers={layers}
      date={date}
      visible={enabled}
      coordinator={new Coordinator(coordinator_url)}
      onFail={onFail}
      onLoadStart={() => helioviewerWebClient.startLoading()}
      onLoadFinish={() => helioviewerWebClient.stopLoading()}
    />
  );
}

/**
 * Render the 3D view.
 */
window.Init3D = (coordinator_url, apiUrl) => {
  SetHelioviewerApiUrl(apiUrl + "?action=");
  // Create root and begin executing the component via the render call
  const root = createRoot(document.getElementById("view-3d"));

  const toggleButton = document.querySelector('.js-3d-toggle');
  toggleButton.addEventListener('click', () => {
    Helioviewer.userSettings.set("state.enable3d", !Helioviewer.userSettings.get("state.enable3d"));
    $(document).trigger("update-external-datasource-integration");
  });

  /**
   * Listen for changes to state.
   * Helioviewer sends this trigger whenever changes to the state are made.
   * re-render whenever state is updated
   */
  $(document).on("update-external-datasource-integration", () => {
    const [layers, date, enabled] = getHvState();
    update3DButtonCss(enabled);
    hideDisabledElements(enabled);
    update3dViewport(enabled);
    if (!is3dLaunched && enabled) {
      is3dLaunched = true;
      fetch(apiUrl + "?action=enable3D");
    }
    render(root, is3dLaunched, enabled, layers, date, coordinator_url);
  });
};

/**
 * Update 3D CSS on 3D activation buttons for 3D mode
 * @param {boolean} enable3d 3D enabled/disabled
 */
function update3DButtonCss(enable3d) {
  document.querySelectorAll('.js-3d-toggle').forEach(btn => {
    if (enable3d) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Hides HTML elements which should be hidden when 3D mode is enabled
 * @param {boolean} enable3d  3D enabled/disabled
 */
function hideDisabledElements(enable3d) {
  document.querySelectorAll('.toggle3d').forEach(element => {
    if (enable3d) {
      element.classList.add('masked');
    } else {
      element.classList.remove('masked');
    }
  });
}

/**
 * Shows/Hides the 3D viewport for 3D mode
 * @param {boolean} enable3d 3D enabled/disabled
 */
function update3dViewport(enable3d) {
  /** Handle to HTML element which shows the 3D view */
  const viewport3dRoot = document.getElementById("view-3d");
  viewport3dRoot.style.zIndex = enable3d ? "0" : "-10";
}
