import React, { useEffect, useId, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Layers } from "./components/layers";

let instanceCounter = 0;

function hashCode(string){
  var hash = 0;
  for (var i = 0; i < string.length; i++) {
      var code = string.charCodeAt(i);
      hash = ((hash<<5)-hash)+code;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Renders the current helioviewer state
 */
function Hv3D({coordinator, state, setCameraPosition }) {
  // Disable react 3 fiber automatic rendering by executing useFrame with a
  // non-zero value.
  useFrame(() => {}, 1);

  /** Get a handle to the WebGLRenderer */
  const { gl } = useThree();

  /** Set the background color to black. */
  useEffect(() => {
    gl.setClearColor("#000000");
  }, [gl]);

  // Manage instances. We need to retain at least one previous instance
  // to perform a transition.
  const [instances, setInstances] = useState([]);

  useEffect(() => {
    // hash the instance, helioviewer updates it's state relatively often,
    // which may impact calls to this function. So we want to only update
    // anything if the state has really changed.
    // This is done by hashing the relevant data and only updating our
    // state if the data has changed.
    const data = {
      date: state.state.date,
      layers: Object.values(state.state.tileLayers),
    };
    const hash = hashCode(JSON.stringify(data));
    if (!instances.some((v) => v.hash == hash)) {
      // There are only ever two instances. The original, and the one we're transitioning to.
      // If the one we're transitioning to changes before it's finished transitioning,
      // it gets dropped from the instance array and we just continue loading
      // the newest one.
      const newInstances = instances.length == 0 ? [{data: data, hash: hash}] :
                           [instances[0], {data: data, hash: hash}]
      setInstances(newInstances);
    }
  }, [state.state.tileLayers, state.state.date]);

  // Once all layers are loaded, we can remove the original layer set
  // so only the latest is displayed
  const onLayersLoaded = () => {
    if (instances.length == 2) {
      setInstances([instances[1]]);
    }
  }

  return <>
    {instances.map((instance, idx) =>
      <Layers key={instance.hash} date={instance.data.date} layers={instance.data.layers} coordinator={coordinator} setCameraPosition={setCameraPosition} dim={instances.length == 2 && idx == 0} onReady={onLayersLoaded} />
    )}
  </>
}

export default Hv3D;
