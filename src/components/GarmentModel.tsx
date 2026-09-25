import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";

const TARGET_HEIGHT = 5.2;

function normalizeModel(source: THREE.Object3D) {
  const object = SkeletonUtils.clone(source);
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  object.scale.setScalar(TARGET_HEIGHT / Math.max(size.y, 0.001));

  const scaledBounds = new THREE.Box3().setFromObject(object);
  const center = scaledBounds.getCenter(new THREE.Vector3());
  object.position.set(-center.x, -scaledBounds.min.y - 2.55, -center.z);

  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return object;
}

export function GarmentModel({ source }: { source: string }) {
  const { scene } = useGLTF(source);
  const model = useMemo(() => normalizeModel(scene), [scene]);

  useEffect(() => {
    return () => {
      if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    };
  }, [source]);

  return <primitive object={model} />;
}