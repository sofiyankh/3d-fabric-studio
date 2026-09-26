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

interface GarmentModelProps {
  source: string;
  design: string | null;
  designRepeat: number;
}

export function GarmentModel({ source, design, designRepeat }: GarmentModelProps) {
  const { scene } = useGLTF(source);
  const model = useMemo(() => normalizeModel(scene), [scene]);

  // Apply (or remove) the design texture on every mesh of the garment.
  useEffect(() => {
    if (!design) return;

    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(design, (texture) => {
      if (cancelled) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(designRepeat, designRepeat);
      texture.anisotropy = 8;

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              if (!material.userData.__originalMap) {
                material.userData.__originalMap = material.map;
              }
              material.map = texture;
              material.needsUpdate = true;
            }
          });
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [model, design, designRepeat]);

  // Restore original materials when the design is removed.
  useEffect(() => {
    if (design) return;
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial && material.userData.__originalMap !== undefined) {
            material.map = material.userData.__originalMap;
            material.needsUpdate = true;
          }
        });
      }
    });
  }, [model, design]);

  useEffect(() => {
    return () => {
      if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    };
  }, [source]);

  return <primitive object={model} />;
}
