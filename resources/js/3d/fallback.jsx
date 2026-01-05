import React, { useEffect } from "react";

// Check if WebGL is actually supported
function isWebGLSupported() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

function CanvasFallback() {
  useEffect(() => {
    // Only run the error handling if WebGL is actually not supported
    if (!isWebGLSupported()) {
      if (Helioviewer.userSettings.get("state.enable3d")) {
        Helioviewer.messageConsole.error("Your browser does not support WebGL, disabling 3D mode");
      }
      Set3DMode(false);
    }
  }, []);

  return null;
}

export default CanvasFallback;
