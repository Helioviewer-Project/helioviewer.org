import React from "react";
import { createRoot } from "react-dom/client";
import { Coordinator } from "./coordinates/coordinator";
import Viewport3D from "./viewport3d";

/** Render the 3D view. */
window.Init3D = (coordinator_url) =>  createRoot(document.getElementById("view-3d")).render(
  <Viewport3D coordinator={new Coordinator(coordinator_url)} />
);
