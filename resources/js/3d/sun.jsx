import React, { useEffect, useRef, useState } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { Quality, Sun } from "@helioviewer/sun";
import { SSCWS } from "./coordinates/sscws";
extend({ Sun });

function Sun3D({coordinator, renderPriority, isPrimaryLayer, source, date, opacity, observatory, setCameraPosition }) {
  const sunObj = useRef();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const fn = async () => {
      if (typeof sunObj.current !== "undefined") {
        setReady(false);
        helioviewerWebClient.startLoading();
        try {
          // Wait for the sun to be ready
          await sunObj.current.ready;
          // The minimum time interval varies for different observatories.
          // We find the minimum time interval that HV supports by testing all
          // our available sources.
          const endRange = new Date(sunObj.current.time);
          endRange.setMinutes(endRange.getMinutes() + 24);
          // Get the position of the sun from SSCWS
          const coords = await SSCWS.GetLocations(observatory, sunObj.current.time, endRange);
          // Convert the SSCWS coordinates to our 3D frame
          const localCoords = await coordinator.GSE(coords);
          // LERP the coordinate of the object at the given time.
          const observatoryLocation = localCoords.Get(sunObj.current.time).toVec();
          sunObj.current.lookAt(observatoryLocation);
          const pos = observatoryLocation.normalize().multiplyScalar(100);
          if (isPrimaryLayer) {
            setCameraPosition(pos);
          }
          // Lasco C2 needs a slight offset so it doesn't overlap with LASCO C3
          // and cause visual artifacts from Z-Fighting
          if (source == 4) {
            sunObj.current._model.children.forEach((m) => {
              m.material.polygonOffset = true;
              m.material.polygonOffsetFactor = -1;
            });
          }
        } catch (e) {
          throw e;
        } finally {
          helioviewerWebClient.stopLoading();
        }
        setReady(true);
      }
    };
    fn();
  }, [sunObj.current, renderPriority]);

  const scene = useRef();
  const { camera } = useThree();
  useFrame(({ gl }) => {
    if ([4, 5].indexOf(source) == -1) {
      gl.clearDepth();
    }
    gl.render(scene.current, camera);
  }, renderPriority);

  return (
    <scene ref={scene}>
      <sun ref={sunObj} args={[source, date, date, 1, Quality.High]} opacity={ready ? opacity / 100 : 0} />;
    </scene>
  );
}

export default Sun3D;
