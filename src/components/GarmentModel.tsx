import { Decal, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
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

// Pick the mesh with the largest surface area — the garment body — as the logo host.
function findLogoHost(root: THREE.Object3D): THREE.Mesh | null {
  let best: THREE.Mesh | null = null;
  let bestArea = 0;
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeBoundingBox();
      const box = child.geometry.boundingBox;
      if (!box) return;
      const size = box.getSize(new THREE.Vector3());
      const area = size.x * size.y + size.y * size.z + size.x * size.z;
      if (area > bestArea) {
        bestArea = area;
        best = child;
      }
    }
  });
  return best;
}

export type DesignMode = "print" | "logo";

interface GarmentModelProps {
  source: string;
  design: string | null;
  designMode: DesignMode;
  designRepeat: number;
}

export function GarmentModel({ source, design, designMode, designRepeat }: GarmentModelProps) {
  const { scene } = useGLTF(source);
  const model = useMemo(() => normalizeModel(scene), [scene]);
  const logoHost = useMemo(() => findLogoHost(model), [model]);
  const hostRef = useRef<THREE.Mesh | null>(null);
  hostRef.current = logoHost;

  const [logoTexture, setLogoTexture] = useState<THREE.Texture | null>(null);

  // Load the design image as a logo texture (logo mode only).
  useEffect(() => {
    if (!design || designMode !== "logo") {
      setLogoTexture(null);
      return;
    }
    let cancelled = false;
    new THREE.TextureLoader().load(design, (texture) => {
      if (cancelled) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      setLogoTexture(texture);
    });
    return () => {
      cancelled = true;
    };
  }, [design, designMode]);

  // Full-print mode: apply (or remove) the design texture on every mesh of the garment.
  useEffect(() => {
    if (!design || designMode !== "print") return;

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
              if (material.userData["__originalMap"] === undefined) {
                material.userData["__originalMap"] = material.map;
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
  }, [model, design, designMode, designRepeat]);

  // Restore original materials when the design is removed or switched to logo mode.
  useEffect(() => {
    if (design && designMode === "print") return;
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial && material.userData["__originalMap"] !== undefined) {
            material.map = material.userData["__originalMap"] as THREE.Texture | null;
            material.needsUpdate = true;
          }
        });
      }
    });
  }, [model, design, designMode]);

  useEffect(() => {
    return () => {
      if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    };
  }, [source]);

  // Logo placement: project the design onto the chest of the garment body.
  const logoPlacement = useMemo(() => {
    if (!logoHost) return null;
    const box = new THREE.Box3().setFromObject(logoHost);
    const size = box.getSize(new THREE.Vector3());
    return {
      position: [0, box.max.y - size.y * 0.32, box.max.z + 0.01] as [number, number, number],
      scale: Math.min(size.x, size.y) * 0.28,
    };
  }, [logoHost]);

  return (
    <>
      <primitive object={model} />
      {logoTexture && logoHost && logoPlacement && (
        <Decal
          mesh={hostRef as React.RefObject<THREE.Mesh>}
          position={logoPlacement.position}
          rotation={[0, 0, 0]}
          scale={logoPlacement.scale}
        >
          <meshStandardMaterial
            map={logoTexture}
            transparent
            polygonOffset
            polygonOffsetFactor={-10}
            roughness={0.6}
            depthTest
          />
        </Decal>
      )}
    </>
  );
}
