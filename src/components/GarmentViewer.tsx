import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, OrbitControls, useProgress } from "@react-three/drei";
import { Box, CheckCircle2, Rotate3D, Upload } from "lucide-react";
import { Suspense, useEffect, useRef, useState, type ChangeEvent } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { GarmentModel } from "./GarmentModel";

const DEFAULT_MODEL = "/models/garment.glb";

function ModelLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="model-loader" role="status">Loading garment · {Math.round(progress)}%</div>
    </Html>
  );
}

function Studio({ source }: { source: string | null }) {
  return (
    <>
      <color attach="background" args={["#d9d7d1"]} />
      <fog attach="fog" args={["#d9d7d1", 10, 18]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 5]} intensity={2.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <spotLight position={[-4, 5, 4]} intensity={52} angle={0.48} penumbra={0.9} color="#f1f5ff" />
      <Environment resolution={256}>
        <Lightformer intensity={2.8} position={[0, 5, 4]} scale={[5, 5, 1]} />
        <Lightformer intensity={1.8} position={[-5, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer intensity={1.1} position={[5, 0, -2]} rotation-y={-Math.PI / 2} scale={[7, 3, 1]} />
      </Environment>
      {source ? (
        <Suspense fallback={<ModelLoader />}>
          <GarmentModel source={source} />
        </Suspense>
      ) : null}
      <ContactShadows position={[0, -2.56, 0]} opacity={0.38} scale={8} blur={2.5} far={5} color="#363636" />
      <mesh rotation-x={-Math.PI / 2} position={[0, -2.58, 0]} receiveShadow>
        <circleGeometry args={[8, 96]} />
        <meshStandardMaterial color="#d9d7d1" roughness={0.9} />
      </mesh>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} enablePan={false} minDistance={5.2} maxDistance={10} minPolarAngle={Math.PI * 0.2} maxPolarAngle={Math.PI * 0.68} target={[0, 0, 0]} />
    </>
  );
}

export function GarmentViewer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(DEFAULT_MODEL, { method: "HEAD" }).then((response) => {
      if (active && response.ok && response.headers.get("content-type")?.includes("model")) {
        setSource(DEFAULT_MODEL);
        setFileName("garment.glb");
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const chooseModel = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (source?.startsWith("blob:")) URL.revokeObjectURL(source);
    setSource(URL.createObjectURL(file));
    setFileName(file.name);
  };

  return (
    <main className="showroom-shell">
      <header className="showroom-header">
        <a href="/" className="wordmark" aria-label="Form Archive home">FORM/ARCHIVE</a>
        <div className="collection-label">Digital Sample Room · Production View</div>
        <span className="file-status"><span data-ready={Boolean(source)} />{source ? "Model loaded" : "Awaiting GLB"}</span>
      </header>

      <section className="viewer-stage" aria-label="Interactive 3D garment viewer">
        <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 0.1, 8.4], fov: 42 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
          <Studio source={source} />
        </Canvas>
        {!source && (
          <div className="empty-model-state">
            <Box aria-hidden="true" />
            <strong>Garment model required</strong>
            <p>Load the production GLB containing the garment, mannequin, UVs, and embedded fabric textures.</p>
            <Button onClick={() => inputRef.current?.click()}><Upload /> Load GLB</Button>
          </div>
        )}
        <div className="viewer-instruction"><Rotate3D /> Drag to inspect · Scroll to zoom</div>
      </section>

      <aside className="showroom-panel">
        <div className="product-heading">
          <span className="product-kicker">Production sample · 001</span>
          <h1>Garment Study</h1>
          <p>Real-time material and silhouette inspection</p>
        </div>

        <div className="model-source">
          <span>Source model</span>
          <strong>{fileName ?? "No file loaded"}</strong>
          <Button variant="outline" onClick={() => inputRef.current?.click()}><Upload /> {source ? "Replace model" : "Choose GLB"}</Button>
          <input ref={inputRef} className="sr-only" type="file" accept=".glb,model/gltf-binary" onChange={chooseModel} />
        </div>

        <dl className="material-specs">
          <div><dt>Geometry</dt><dd>{source ? <><CheckCircle2 /> Imported</> : "Pending"}</dd></div>
          <div><dt>Materials</dt><dd>{source ? <><CheckCircle2 /> Original PBR</> : "Pending"}</dd></div>
          <div><dt>Lighting</dt><dd>Calibrated studio</dd></div>
        </dl>
      </aside>
    </main>
  );
}