import { useEffect, useRef } from "react";
import React from "react";

function Checkbox({ state, onChange, style, dataTestId = null }) {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = state === "undecided";
    }
  }, [state]);

  if (dataTestId != null) {
    return (
      <input
        style={{ cursor: "pointer", ...style }}
        type="checkbox"
        ref={checkboxRef}
        checked={state === "checked"}
        onChange={onChange}
        data-testid={dataTestId}
      />
    );
  } else {
    return (
      <input
        style={{ cursor: "pointer", ...style }}
        type="checkbox"
        ref={checkboxRef}
        checked={state === "checked"}
        onChange={onChange}
      />
    );
  }
}

export default Checkbox;
