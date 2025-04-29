import React from "react";
import { createRoot } from "react-dom/client";
import { Coordinator } from "./coordinates/coordinator";
import { SetHelioviewerApiUrl } from "@helioviewer/sun";
import Viewport3D from "./viewport3d";

/** Handles what to do if 3D rendering fails */
const onFail = (error) => {
  Helioviewer.messageConsole.error("3D rendering is currently unavailable. Check back later.");
}

/** Render the 3D view. */
window.Init3D = (coordinator_url, apiUrl) => {
  SetHelioviewerApiUrl(apiUrl + "?action=");
  createRoot(document.getElementById("view-3d")).render(
    <Viewport3D coordinator={new Coordinator(coordinator_url)} onFail={onFail} />
  );
}
