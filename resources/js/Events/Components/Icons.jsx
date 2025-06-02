import React from "react";
/**
 * Minimal SVG caret pointing down.
 */
export function CaretDown(props) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 6l4 4 4-4H4z" />
    </svg>
  );
}

/**
 * Minimal SVG caret pointing right.
 */
export function CaretRight(props) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 4l4 4-4 4V4z" />
    </svg>
  );
}
/**
 * Locate/Crosshair icon (similar to Material "gps_fixed").
 */
export function HideEmptyResourcesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 8c-2.21 0-4 1.79-4 4s1.79 
               4 4 4 4-1.79 4-4-1.79-4 
               -4-4zm8 4c0-3.86-3.14-7-7-7V2h-2v3c-3.86 
               0-7 3.14-7 7s3.14 7 7 7v3h2v-3c3.86 
               0 7-3.14 7-7z"
      />
    </svg>
  );
}

/**
 * Eye (visibility) icon (typical "eye" shape).
 */
export function ShowMarkersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 4.5C7 4.5 2.73 7.61 1 
               12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 
               11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 
               12.5c-2.48 0-4.5-2.02-4.5-4.5S9.52 
               8 12 8s4.5 2.02 4.5 4.5S14.48 17 
               12 17zm0-7c-1.38 0-2.5 1.12-2.5 
               2.5S10.62 15 12 15s2.5-1.12 
               2.5-2.5S13.38 10 12 10z"
      />
    </svg>
  );
}

/**
 * Tag (label/price tag) icon (similar to Material "local_offer").
 */
export function ShowLabelsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M21.41 11.58l-9-9C12.23 
               2.21 11.62 2 11 2H4c-1.1 
               0-2 .9-2 2v7c0 .62.21 1.23.59 
               1.7l9 9c.78.78 2.05.78 2.83 
               0l6.99-6.99c.79-.78.79-2.05.01
               -2.83zM6.5 7C5.67 7 5 6.33 5 
               5.5S5.67 4 6.5 4 8 4.67 8 
               5.5 7.33 7 6.5 7z"
      />
    </svg>
  );
}

// White, narrow right-facing triangle icon component
export const EnabledTriangle = ({ width = "11", height = "11", fill = "white", viewBox = "0 0 16 16", ...props }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={viewBox} {...props}>
      <polygon points="4,4 12,10 4,16" fill={fill} />
    </svg>
  );
};

// Gray right-angled triangle icon component
export const DisabledTriangle = ({ width = "6", height = "6", fill = "#999", viewBox = "0 0 16 16", ...props }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={viewBox} {...props}>
      <polygon points="0,16 16,16 16,0" fill={fill} />
    </svg>
  );
};

export const LoadingIcon = ({ size = 13, strokeWidth = 2, color = "#666", className = "", ...props }) => {
  // The radius of the circle: (size - strokeWidth) / 2
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} {...props}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${Math.PI * 2 * radius * 0.75} ${Math.PI * 2 * radius}`}
        transform={`rotate(-90 ${center} ${center})`}
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${center} ${center}`}
          to={`360 ${center} ${center}`}
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};
