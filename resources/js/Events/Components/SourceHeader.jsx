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
          <a onClick={toggleExpand} data-testid={`event-tree-expand-triangle-${source}`}>
            {expand ? (
              <CaretDown style={{ color: "#444", cursor: "pointer" }} />
            ) : (
              <CaretRight style={{ color: "#444", cursor: "pointer" }} />
            )}
          </a>
          <span onMouseEnter={onHeaderHover} onMouseLeave={offHeaderHover} data-testid={`event-tree-label-${source}`}>
            {source}
          </span>
          {hasEvents ? (
            <Checkbox
              dataTestId={`event-tree-checkbox-${source}`}
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
              data-testid={`event-tree-empty-resource-visibility-button-${source}`}
              width="14"
              height="14"
              style={{ color: showEmptyBranches ? "green" : "red", cursor: "pointer" }}
            />
          </a>
          <a onClick={() => handleVisibility(!visibility)}>
            <ShowMarkersIcon
              data-testid={`event-tree-event-visibility-button-${source}`}
              width="14"
              height="14"
              style={{ color: visibility ? "green" : "red", cursor: "pointer" }}
            />
          </a>
          <a onClick={() => handleLabelVisibility(!labelVisibility)}>
            <ShowLabelsIcon
              data-testid={`event-tree-event-label-visibility-button-${source}`}
              width="14"
              height="14"
              style={{ color: labelVisibility ? "green" : "red", cursor: "pointer" }}
            />
          </a>
        </div>
      </div>
    </>
  );
}

export default SourceHeader;
