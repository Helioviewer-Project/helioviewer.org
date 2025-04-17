import { BufferGeometry, Color, Line as ThreeLine } from "three";
import { useRef, useLayoutEffect } from "react";
import React from "react";
import { extend } from "@react-three/fiber";
extend({ ThreeLine })

function Line({ points, color = new Color("white") }) {
    const lineRef = useRef();

    useLayoutEffect(() => {
      if (lineRef.current) {
        const geometry = new BufferGeometry().setFromPoints(points);
        lineRef.current.geometry = geometry;
      }
    }, [points]);

    return (
      <threeLine ref={lineRef}>
        <lineBasicMaterial attach="material" color={color} linewidth={1} />
      </threeLine>
    );
}

export { Line }

