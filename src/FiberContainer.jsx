import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { Scene } from "./Scene";
import { useState } from "react";
import { Hud, OrthographicCamera } from "@react-three/drei";
export function FiberContainer() {
    // function 
    const [seed, setSeed] = useState(1);
    const reset = () => {
        setSeed(Math.random());
    }
    return (
        <>
            {/* <button onClick={reset}>Refresh</button> */}
            <Canvas camera={{ position: [15, 15, 0], fov: 60 }} shadows>
                <Scene 
                        gridSize={20}
                        innerSep={0.01}
                        outerSep={0.02}
                        radius={0.5}
                        noiseScale={4}
                        baseHeight={3}
                        minHeight={0.5}
                        noiseFunc={'simplex'}
                    />
                <OrbitControls minDistance={1} maxDistance={200} target={[0 , 0, 0]}/>
            </Canvas>

        </>
    );
}