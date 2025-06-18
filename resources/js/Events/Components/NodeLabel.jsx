import { useEffect, useRef, useState } from "react";
import React from "react";
import Checkbox from "./Checkbox.jsx";
import { EnabledTriangle, DisabledTriangle } from "./Icons.jsx";

/*
 * Uses a regex to find proper JavaScript Unicode escape sequences like \u03b1 (note the backslash)
 * Captures the 4-digit hex code in a group and converts it to an actual Unicode character
 * Can handle any Unicode character in the Basic Multilingual Plane (U+0000 to U+FFFF)
 * Properly checks for the backslash prefix
 */
const fixTitle = (title) => {
  return title.replace(/\\u([\da-fA-F]{4})/g, function (m, $1) {
    return String.fromCharCode(parseInt($1, 16));
  });
};

export default function NodeLabel({ onLabelHover, offLabelHover, onLabelClick, label, dataTestId }) {
  const [hovered, setHovered] = useState(false);

  let labelStyle = {};

  if (hovered) {
    labelStyle = {
      background: "#a8c0ca",
      color: "black"
    };
  }

  labelStyle.cursor = "pointer";

  return (
    <span
      data-testid={dataTestId}
      style={labelStyle}
      onMouseEnter={() => {
        setHovered(true);
        onLabelHover();
      }}
      onMouseLeave={() => {
        setHovered(false);
        offLabelHover();
      }}
      onClick={onLabelClick}
    >
      {fixTitle(label)}
    </span>
  );
}
