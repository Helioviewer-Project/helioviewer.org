import React, { useEffect } from "react";


function CanvasFallback() {
  useEffect(() => {
    if (Helioviewer.userSettings.get("state.enable3d")) {
      Helioviewer.messageConsole.error("Your browser does not support WebGL, disabling 3D mode");
    }
    Set3DMode(false);
  }, []);

  return null;
}

export default CanvasFallback;
