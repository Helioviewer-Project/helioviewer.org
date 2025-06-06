import { useEffect, useRef, useState } from "react";
import React from "react";
import Checkbox from "./Checkbox.jsx";
import NodeLabel from "./NodeLabel.jsx";
import { EnabledTriangle, DisabledTriangle } from "./Icons.jsx";

export default function Node({ id, toggleCheckbox, toggleExpand, onHover, offHover, eventTree, showEmptyBranches }) {
  const isEvent = eventTree[id].hasOwnProperty("data");
  const isBranch = !isEvent;
  const hasEvents = eventTree.getEventCount(id) > 0;
  const branchWithNoEvents = isBranch && !hasEvents;

  if (branchWithNoEvents && !showEmptyBranches) {
    return;
  }

  let nodeContainerStyle = {
    paddingTop: 3
  };

  if (isEvent) {
    nodeContainerStyle.paddingTop = 1;
  }

  if (branchWithNoEvents) {
    nodeContainerStyle = {
      opacity: 0.5
    };
  }

  const nodeHeaderStyle = {
    display: "flex",
    alignItems: "center",
    gap: 4
  };

  const nodeChildrensStyle = {
    paddingLeft: 18
  };

  if (!eventTree[id].expand) {
    nodeChildrensStyle["display"] = "none";
  }

  if (eventTree.isEventBranch(id)) {
    nodeChildrensStyle["paddingLeft"] = 30;
    nodeChildrensStyle["paddingTop"] = 4;
    nodeChildrensStyle["paddingBottom"] = 4;
  }

  let nodeLabel = eventTree[id].label + (isEvent ? "" : "(" + eventTree.getEventCount(id) + ")");

  return (
    <div style={nodeContainerStyle}>
      <div style={nodeHeaderStyle}>
        {isEvent ? null : (
          <a
            style={{ cursor: "pointer", minWidth: 11 }}
            data-testid={`event-tree-expand-triangle-${id}`}
            onClick={() => {
              toggleExpand(id);
            }}
          >
            {eventTree[id].expand ? <DisabledTriangle /> : <EnabledTriangle />}
          </a>
        )}
        <Checkbox
          dataTestId={`event-tree-checkbox-${id}`}
          state={eventTree[id].state}
          onChange={() => {
            toggleCheckbox(id);
          }}
        />
        <NodeLabel
          onLabelHover={() => {
            onHover(id);
          }}
          offLabelHover={offHover}
          onLabelClick={() => {
            toggleCheckbox(id);
          }}
          label={nodeLabel}
          dataTestId={`event-tree-label-${id}`}
        />
      </div>
      {isEvent ? null : (
        <div style={nodeChildrensStyle}>
          {eventTree[id].children.map((cid) => {
            return (
              <Node
                key={cid + "_" + Math.random()}
                id={cid}
                toggleCheckbox={toggleCheckbox}
                toggleExpand={toggleExpand}
                onHover={onHover}
                offHover={offHover}
                eventTree={eventTree}
                showEmptyBranches={showEmptyBranches}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
