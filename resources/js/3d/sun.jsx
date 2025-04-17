import React, { useEffect, useRef, useState } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { Quality, StaticSun } from "@helioviewer/sun";
import { SSCWS } from "./coordinates/sscws";
import { Vector3, Matrix4 } from "three";
import Background from "./background";
extend({ StaticSun });

// Track polygon offsets to deal with overlapping planes.
function Sun3D({coordinator, renderPriority, isPrimaryLayer, source, date, opacity, observatory, setCameraPosition, useSphereOcclusion}) {
  const sunObj = useRef();
  const [ready, setReady] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(date));
  const [originalSunDirection, setOriginalSunDirection] = useState(null);
  const [firstLook, setFirstLook] = useState(true);
  const { camera } = useThree();
  useEffect(() => {
    const fn = async () => {
      if (typeof sunObj.current !== "undefined" && !ready) {
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

          if (isPrimaryLayer) {
            const objectDirection = new Vector3();
            sunObj.current.getWorldDirection(objectDirection);
            // On first look, set the camera to be right in front of the sun.
            if (firstLook) {
              setCameraPosition(objectDirection.clone().multiplyScalar(2));
              setFirstLook(false);
            } else {
              // Compute where the camera needs to be so we're looking at the new
              // sun from the same perspective.
              setCameraPosition(computeCameraPosition(originalSunDirection, objectDirection, camera.position));
            }
            setOriginalSunDirection(objectDirection.clone());
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

function computeCameraPosition(originalDirection, newDirection, currentCameraPosition) {
  // Normalize the direction vectors to ensure they are unit vectors
  const origDir = originalDirection.clone().normalize();
  const newDir = newDirection.clone().normalize();

  // Use the current camera position directly
  const relativePosition = currentCameraPosition.clone();

  // Create rotation matrices for both directions
  const originalMatrix = new Matrix4().lookAt(origDir, new Vector3(), new Vector3(0, 1, 0));
  const newMatrix = new Matrix4().lookAt(newDir, new Vector3(), new Vector3(0, 1, 0));

  // Calculate the rotation from original to new direction
  const rotationMatrix = new Matrix4().multiplyMatrices(newMatrix, originalMatrix.invert());

  // Apply the rotation to the relative camera position
  const newCameraPosition = relativePosition.applyMatrix4(rotationMatrix);

  return newCameraPosition;
}

export default Sun3D;
