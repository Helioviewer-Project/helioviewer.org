import React, { useEffect, useRef, useState } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { Quality, StaticSun } from "@helioviewer/sun";
import { SSCWS } from "../coordinates/sscws";
import { Vector3, Matrix4 } from "three";
import Background from "../background";
import { Horizons } from "../coordinates/horizons";
extend({ StaticSun });

// Track polygon offsets to deal with overlapping planes.
function Sun3D({
  coordinator,
  renderPriority,
  isPrimaryLayer,
  source,
  date,
  opacity,
  observatory,
  setCameraPosition,
  useSphereOcclusion,
  parentReady,
  onStartLoad,
  onEndLoad,
  onFail
}) {
  // Main sun instance
  const sunObj = useRef();
  // Shadow is used to render a copy of the model while loading.
  const shadowObj = useRef();
  const [shadow, setShadow] = useState(null);
  // Ready is set when component is done loading.
  const [ready, setReady] = useState(false);
  // Current date being rendered.
  const [currentDate, setCurrentDate] = useState(new Date(date));
  // Used to compute camera location
  const [lastObservatoryLocation, setLastObservatoryLocation] = useState(new Vector3(0, 0, 1));
  const [lastRotationAngle, setLastRotationAngle] = useState(0);
  const [originalSunDirection, setOriginalSunDirection] = useState(null);
  // First time component loads.
  const [firstLook, setFirstLook] = useState(true);
  const { camera } = useThree();
  useEffect(() => {
    const abortController = new AbortController();
    const abort = () => {
      helioviewerWebClient.stopLoading();
      onEndLoad();
    };
    const fn = async () => {
      if (typeof sunObj.current !== "undefined" && !ready) {
        onStartLoad();
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
          if (abortController.signal.aborted) return abort();

          let localCoords = null;
          try {
            // Get the position of the sun from SSCWS
            const coords = await SSCWS.GetLocations(observatory, startDate, endRange);
            if (abortController.signal.aborted) return abort();
            // Convert the SSCWS coordinates to our 3D frame
            localCoords = await coordinator.GSE(coords);
          } catch (e) {
            console.warn("Unable to get data from SSC, trying JPL Horizons");
            localCoords = await new Horizons(coordinator).GetLocations(observatory, startDate, endRange);
          }

          if (abortController.signal.aborted) return abort();
          // LERP the coordinate of the object at the given time.
          const observatoryLocation = localCoords.Get(startDate).toVec();

          // If state has changed at this point during the async function,
          // then this execution thread is stale and should not proceed to update
          // the state or camera position.
          if (abortController.signal.aborted) return abort();

          setLastObservatoryLocation(observatoryLocation);
          setLastRotationAngle(rotationAngle);
          sunObj.current.lookAt(observatoryLocation);
          sunObj.current.rotation.y += rotationAngle;

          if (isPrimaryLayer) {
            const objectDirection = new Vector3();
            sunObj.current.getWorldDirection(objectDirection);
            // On first look, set the camera to be right in front of the sun.
            if (firstLook) {
              setCameraPosition(objectDirection.clone().multiplyScalar(100));
              setFirstLook(false);
            } else {
              // Compute where the camera needs to be so we're looking at the new
              // sun from the same perspective.
              setCameraPosition(computeCameraPosition(originalSunDirection, objectDirection, camera.position));
            }
            setOriginalSunDirection(objectDirection.clone());
          }
        } catch (e) {
          onFail(e);
          throw e;
        } finally {
          helioviewerWebClient.stopLoading();
        }
        setReady(true);
        onEndLoad();
      }
    };
    fn();

    // This function is executed whenever the useEffect state is called again.
    return () => {
      abortController.abort();
    };
  }, [sunObj.current]);

  // Reset ready back to false whenever the sourceId changes
  useEffect(() => {
    // If this isn't the first load, then make the shadow visible
    // This gives the user the loading indication by providing visual
    // feedback that something is happening.
    if (ready && shadowObj.current != null) {
      shadowObj.current.lookAt(lastObservatoryLocation);
      shadowObj.current.rotation.y += lastRotationAngle;
      shadowObj.current.opacity = (opacity * 0.5) / 100;
    }
    setReady(false);
    setCurrentDate(new Date(date));
  }, [source, date]);

  useEffect(() => {
    if (ready && !parentReady && shadowObj.current != null) {
      shadowObj.current.lookAt(lastObservatoryLocation);
      shadowObj.current.rotation.y += lastRotationAngle;
      shadowObj.current.opacity = (opacity * 0.5) / 100;
    } else if (parentReady && shadowObj.current != null) {
      shadowObj.current.opacity = 0;
    }
  }, [parentReady]);

  useEffect(() => {
    // When everything finishes loading, prepare a copy of it so we can perform
    // a transition during load.
    if (parentReady) {
      setShadow(<staticSun ref={shadowObj} args={[source, currentDate, Quality.High]} opacity={0} />);
    }
  }, [parentReady]);

  const shadowScene = useRef();
  const scene = useRef();
  useFrame(({ gl }) => {
    gl.autoClear = false;
    gl.clearDepth();
    gl.render(shadowScene.current, camera);
    gl.clearDepth();
    gl.render(scene.current, camera);
  }, renderPriority);

  return (
    <>
      <scene ref={shadowScene}>
        {useSphereOcclusion ? <Background /> : <></>}
        {shadow}
      </scene>
      <scene ref={scene}>
        {useSphereOcclusion ? <Background /> : <></>}
        <staticSun ref={sunObj} args={[source, currentDate, Quality.High]} opacity={parentReady ? opacity / 100 : 0} />;
      </scene>
    </>
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
