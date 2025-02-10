import React from "react";
import { createRoot } from "react-dom/client";
import Viewport3D from "./viewport3d";

/** Render the 3D view. */
createRoot(document.getElementById("view-3d")).render(
  <Viewport3D />
);
