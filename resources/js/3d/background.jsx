import { useThree, useFrame } from "@react-three/fiber";
import React, { useRef } from "react";

function Background() {
  const scene = useRef();
  const { camera } = useThree();
  useFrame(({ gl }) => {
    gl.autoClear = false;
    gl.clearDepth();
    gl.render(scene.current, camera);
  }, 0);
  return (
    <scene ref={scene}>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial colorWrite={false} color={0x000000} />
      </mesh>
    </scene>
  );
}
export default Background;
