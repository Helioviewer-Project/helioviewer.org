import React from "react";
import { useState } from "react";
import {
  CaretDown,
  CaretRight,
  HideEmptyResourcesIcon,
  ShowMarkersIcon,
  ShowMarkersIcon2,
  ShowLabelsIcon
} from "./Icons.jsx";

import Checkbox from "./Checkbox.jsx";

function SourceHeader({
  source,
  hasEvents,
  eventsDate,
  checked,
  onCheckedUpdate,
  onHeaderHover,
  offHeaderHover,
  expand,
  toggleExpand,
  showEmptyBranches,
  handleShowEmptyBranches,
  visibility,
  handleVisibility,
  labelVisibility,
  handleLabelVisibility
}) {
  const [visibilityState, setVisibilityState] = useState(visibility);
  const [labelVisibilityState, setLabelVisibilityState] = useState(labelVisibility);

  const handleInternalVisibility = (newVisibilityState) => {
    handleVisibility(newVisibilityState);
    setVisibilityState(newVisibilityState);
  };
  const handleInternalLabelVisibility = (newLabelVisibilityState) => {
    handleLabelVisibility(newLabelVisibilityState);
    setLabelVisibilityState(newLabelVisibilityState);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "transparent",
          color: "#fff"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <a onClick={toggleExpand}>
            {expand ? (
              <CaretDown style={{ color: "#444", cursor: "pointer" }} />
            ) : (
              <CaretRight style={{ color: "#444", cursor: "pointer" }} />
            )}
          </a>
          <span onMouseEnter={onHeaderHover} onMouseLeave={offHeaderHover}>
            {source}
          </span>
          {hasEvents ? (
            <Checkbox
              style={{ width: 9 }}
              state={checked}
              onChange={(event) => {
                onCheckedUpdate();
              }}
            />
          ) : (
            ""
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingRight: "15px" }}>
          <span style={{ color: hasEvents ? "green" : "red" }}>
            {eventsDate.toISOString().replace(/-/g, "/").replace("T", " ").slice(0, 19) + " UTC"}
          </span>
          <a onClick={() => handleShowEmptyBranches(!showEmptyBranches)}>
            <HideEmptyResourcesIcon
              width="14"
              height="14"
              style={{ color: showEmptyBranches ? "green" : "red", cursor: "pointer" }}
            />
          </a>
          <a onClick={() => handleInternalVisibility(!visibilityState)}>
            <ShowMarkersIcon
              width="14"
              height="14"
              style={{ color: visibilityState ? "green" : "red", cursor: "pointer" }}
            />
          </a>
          <a onClick={() => handleInternalLabelVisibility(!labelVisibilityState)}>
            <ShowLabelsIcon
              width="14"
              height="14"
              style={{ color: labelVisibilityState ? "green" : "red", cursor: "pointer" }}
            />
          </a>
        </div>
      </div>
    </>
  );
}

export default SourceHeader;
