import { useEffect, useRef } from "react";
import React from "react";

function Checkbox({ state, onChange, style }) {
  const checkboxRef = useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = state === "indecided";
    }
  }, [state]);
  
  return <input style={{cursor: "pointer", ...style}} type="checkbox" ref={checkboxRef} checked={state === "checked"} onChange={onChange} />;
}

export default Checkbox;
