import { useEffect, useRef, useState } from "react";
import React from "react";
import Checkbox from "./Checkbox.jsx";
import { EnabledTriangle, DisabledTriangle  } from './Icons.jsx';

const fixTitle = (title) => {

    title = title.replace(/u03b1/g, "α");
    title = title.replace(/u03b2/g, "β");
    title = title.replace(/u03b3/g, "γ");
    title = title.replace(/u00b1/g, "±");
    title = title.replace(/u00b2/g, "²");

    return title;
}

export default function NodeLabel({onLabelHover, offLabelHover, onLabelClick, label}) {

    const [hovered, setHovered] = useState(false);

    let labelStyle = {};

    if(hovered) {
      labelStyle = {
          background:"#a8c0ca", 
          color: "black",
      };
    }

    labelStyle.cursor = "pointer";

    return (
        <span 
            style={labelStyle}
            onMouseEnter={() => {
                setHovered(true);
                onLabelHover()
            }}
            onMouseLeave={() => {
                setHovered(false);
                offLabelHover()
            }}
            onClick={onLabelClick}
        >
            {fixTitle(label)}
        </span>
    );
}
