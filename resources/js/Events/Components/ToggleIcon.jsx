import { useState } from 'react'
import React from 'react';

const ToggleIcon = ({ value, updateValue }) => {

  const [internalValue , setInternalValue] = useState(value)

  // Choose the color based on the state.
  const color = internalValue ? 'green' : 'red';

  const onToggle = () => {
      const newValue = !internalValue;
      setInternalValue(newValue);
      updateValue(newValue);
  }

  return (
    <button
      onClick={onToggle}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        color: color
      }}
      title={internalValue ? 'Enabled' : 'Disabled'}
    >
      &#9678;
    </button>

  );
};

export default ToggleIcon;
