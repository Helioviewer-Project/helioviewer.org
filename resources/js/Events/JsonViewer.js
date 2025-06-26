import React from "react";
import ModalImage from "react-modal-image";

/**
 * Dumps JSON into a table
 * @param {Object} value
 * @returns
 */
function JsonViewer({ value }) {
  return (
    <div className="event-header" style={{ height: "400px", overflow: "auto" }}>
      <Rows object={value} />
    </div>
  );
}

function Rows({ object, prefix }) {
  return Object.entries(object).map((entry, idx) => (
    <Row key={btoa(JSON.stringify(entry))} prefix={prefix} name={entry[0]} value={entry[1]} />
  ));
}

function isNumeric(value) {
  return !isNaN(parseInt(value));
}

/**
 * Table row
 * @param {string} name Label for the row
 * @param {any} value Value to place in the table.
 */
function Row({ prefix, name, value }) {
  let label = `${prefix ? `${prefix}.` : ""}${name}`;
  if (isNumeric(name)) {
    label = prefix ? `${prefix}[${name}]` : name;
  }
  if (typeof value === "object" && value != null) {
    return <Rows prefix={label} object={value} />;
  } else {
    // Check if the value is empty. These get a special 'empty' class in the HTML.
    let emptyClass = IsEmptyValue(value) ? "empty" : "";
    return (
      <div className={emptyClass}>
        <span title={label} className={`event-header-tag ${emptyClass}`}>
          {label}
        </span>
        {/* Render the value. Using another component to handle special cases for certain types of values. */}
        <Value empty={IsEmptyValue(value)} value={value} />
      </div>
    );
  }
}

/**
 * Renders a value, taking care to handle special cases such as rendering links if the value is a URL.
 * @param {boolean} empty Set to true if value is null or an empty string
 * @param {any} value Value to render.
 * @returns
 */
function Value({ empty, value }) {
  let className = `event-header-value ${empty ? "empty" : ""}`;
  if (typeof value == "string" && value.startsWith("http")) {
    // If the string is an image, put the link in an image tag
    if (IsImage(value)) {
      return (
        <span className={className}>
          <ModalImage small={value} large={value} hideDownload={true} hideZoom={true} />
        </span>
      );
    } else {
      // If the string is a URL, make it a link
      return (
        <span className={className}>
          <a href={value} target="_blank">
            {value}
          </a>
        </span>
      );
    }
  } else {
    if (typeof value === "boolean") {
      value = value ? "true" : "false";
    }
    // Otherwise just return the content as plain text.
    return <span className={className}>{value}</span>;
  }
}

/**
 * Returns true if the value is null or empty
 * @param {any} value
 * @returns {boolean}
 */
function IsEmptyValue(value) {
  switch (typeof value) {
    case "string":
      return value.trim() === "";
    default:
      return value == null;
  }
}

/**
 * Checks if the given value is an image
 * @param {string} link link to check
 */
function IsImage(link) {
  let imageTypes = [".gif", ".png", ".jpg", ".jpeg", ".webp"];
  for (let i = 0; i < imageTypes.length; i++) {
    if (link.endsWith(imageTypes[i])) {
      return true;
    }
  }
  return false;
}

export { JsonViewer };
