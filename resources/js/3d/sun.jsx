import React, { useEffect, useRef, useState } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { Quality, StaticSun } from "@helioviewer/sun";
import { SSCWS } from "./coordinates/sscws";
import Background from "./background";
extend({ StaticSun });

// Track polygon offsets to deal with overlapping planes.
function Sun3D({coordinator, renderPriority, isPrimaryLayer, source, date, opacity, observatory, setCameraPosition, useSphereOcclusion}) {
  const sunObj = useRef();
  const [ready, setReady] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(date));
  useEffect(() => {
    const fn = async () => {
      if (typeof sunObj.current !== "undefined" && !ready) {
        setReady(false);
        helioviewerWebClient.startLoading();
        try {
          // Wait for the sun to be ready
          await sunObj.current.ready;
          // Compute extra solar rotation to account for any time difference between
          // when all the images were taken.
          const refDate = new Date(date);
          const dt = sunObj.current.time.getTime() - refDate.getTime();
          const timeDifferenceInHours = dt / (1000 * 60 * 60);
          // Computation assumes a full solar rotation of 27 days.
          const rotationAngle = (timeDifferenceInHours / (27 * 24)) * 2 * Math.PI;
          // The minimum time interval varies for different observatories.
          // We find the minimum time interval that HV supports by testing all
          // our available sources.
          const startDate = sunObj.current.time; // sunObj.current.time;
          // const startDate = sunObj.current.time;
          const endRange = new Date(startDate);
          endRange.setMinutes(endRange.getMinutes() + 24);
          // Get the position of the sun from SSCWS
          const coords = await SSCWS.GetLocations(observatory, startDate, endRange);
          // Convert the SSCWS coordinates to our 3D frame
          const localCoords = await coordinator.GSE(coords);
          // LERP the coordinate of the object at the given time.
          const observatoryLocation = localCoords.Get(startDate).toVec();
          sunObj.current.lookAt(observatoryLocation);
          sunObj.current.rotation.y += rotationAngle;

          const pos = observatoryLocation.normalize().multiplyScalar(100);
          if (isPrimaryLayer) {
            setCameraPosition(pos);
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
  }, [sunObj.current]);

  // Reset ready back to false whenever the sourceId changes
  useEffect(() => {
    setReady(false);
    setCurrentDate(new Date(date));
  }, [source, date]);

  const scene = useRef();
  const { camera } = useThree();
  useFrame(({ gl }) => {
    gl.autoClear = false;
    gl.clearDepth();
    gl.render(scene.current, camera);
  }, renderPriority);

  return (
    <scene ref={scene}>
      {useSphereOcclusion ? <Background /> : <></>}
      <staticSun ref={sunObj} args={[source, currentDate, Quality.High]} opacity={ready ? opacity / 100 : 0} />;
    </scene>
  );
}

export default Sun3D;
