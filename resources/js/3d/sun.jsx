import React, { useEffect, useRef } from "react";
import { extend } from "@react-three/fiber";
import { Quality, Sun } from "@helioviewer/sun";
import { SSCWS } from "./coordinates/sscws";
import { Coordinator } from "./coordinates/coordinator";
extend({ Sun });

function Sun3D({ index, source, date, opacity, observatory }) {
  const sunObj = useRef();
  useEffect(() => {
    const fn = async () => {
      // Wait for the sun to be ready
      await sunObj.current.ready
      // This is a trick to get the models to render without showing visual
      // artifacts.
      sunObj.current._model.children.forEach((m) => {
        m.material.polygonOffset = true
        m.material.polygonOffsetFactor = index * 8;
        m.material.polygonOffsetUnits = index * 5000;
        console.log(m.material)
      })
      // The SSCWS API requires at least a 2 minute interval.
      const endRange = new Date(sunObj.current.time);
      endRange.setMinutes(endRange.getMinutes() + 2)
      // Get the position of the sun from SSCWS
      const coords = await SSCWS.GetLocations(observatory, sunObj.current.time, endRange);
      // Convert the SSCWS coordinates to our 3D frame
      const localCoords = await Coordinator.GSE(coords);
      // LERP the coordinate of the object at the given time.
      const observatoryLocation = localCoords.Get(sunObj.current.time).toVec();
      sunObj.current.lookAt(observatoryLocation);
      // sunObj.current.scale.setScalar(1 + 0.01 * index)
    }
    fn()
  }, [sunObj]);

  return <sun ref={sunObj} args={[source, date, date, 1, Quality.High]} opacity={opacity / 100} />;
}

export default Sun3D;
