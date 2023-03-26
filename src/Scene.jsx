import * as THREE from "three";
import {Fragment} from 'react';
import React, { useRef, useState } from "react";
import { Canvas, useFrame, ThreeElements, useLoader, useThree } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";
import { getZFuncs } from "./TerrainGenerator";
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader";
import {PMREMGenerator} from "three/src/extras/PMREMGenerator";

function Tree(props) {
  // const mesh = useRef(null);

  console.log("TREE")
  console.log(props, props.position)
  const treeHeight = Math.random() + 1.25;
  let position = [props.position.x, props.position.y - treeHeight/2, props.position.z]
  const height = position.y; 
  const h =  treeHeight/2;
  const y = props.position.y;
  let pos1 = [props.position.x, y + h , props.position.z];
  let pos2 = [props.position.x, y + h * 0.6 , props.position.z];
  let pos3 = [props.position.x, y + h * 1.25 , props.position.z];
  let pos4 = [props.position.x, y-h , props.position.z];
  console.log(pos1, pos2, pos3)
  // pos1[1] + 
  return (
    <group>
      <mesh  position={pos1} rotation={[0,0,0]} castShadow receiveShadow >
        <cylinderGeometry args={[0, 0.8, treeHeight, 3]} />
        <meshPhysicalMaterial flatShading={true} map={props.texture} />
      </mesh>
      <mesh  position={pos2} castShadow receiveShadow >
        <cylinderGeometry args={[0, 1, treeHeight, 3]} />
        <meshPhysicalMaterial flatShading={true} map={props.texture} />
      </mesh>
      <mesh  position={pos3} castShadow receiveShadow >
        <cylinderGeometry args={[0, 0.6, treeHeight, 3]} />
        <meshPhysicalMaterial flatShading={true} map={props.texture} />
      </mesh>
      <mesh  position={pos4} castShadow receiveShadow >
        <cylinderGeometry args={[0.2, 0.2, treeHeight, 4]} />
        <meshBasicMaterial flatShading={true} color={"#2B1D14"} />
      </mesh>
    </group>
  );
}

function Block(props) {
  const mesh = useRef(null);
  const radialSegments = 3;
  // console.log(textures)
  const textures = props.textures;
  const MAX_HEIGHT = 6;
  const STONE_HEIGHT = MAX_HEIGHT * 0.8;
  const DIRT_HEIGHT = MAX_HEIGHT * 0.7;
  const GRASS_HEIGHT = MAX_HEIGHT * 0.5;
  const SAND_HEIGHT = MAX_HEIGHT * 0.3;
  const DIRT2_HEIGHT = MAX_HEIGHT * 0;
  // console.log(props)
  let texture = null;
  let extraObj = undefined;
  const height = props.height;
  if (height > STONE_HEIGHT) {
    texture = textures.stone;
    // randomly add stone here
  } else if (height > DIRT_HEIGHT) {
    texture = textures.dirt;
    // randomly add tree here
    if (Math.random() > 0.6) {
      extraObj = <Tree 
        position={new Vector3(props.position.x, props.position.y + height/1.5, props.position.z )} 
        texture={textures.grass}
      />;
    }
  } else if (height > GRASS_HEIGHT) {
    texture = textures.grass;
  }
  else if (height > SAND_HEIGHT) {
    texture = textures.sand;
    // randomly add stone here
  }
  else {
    texture = textures.dirt2;
  }

  return (
    <Fragment>
    
    <mesh
      {...props}
      ref={mesh}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[props.radius, props.radius, props.height, radialSegments]} />
      <meshPhysicalMaterial 
      // envMap={textures.envmap}
      // envMapIntensity={0.135}
      flatShading={true} 
      map={texture}
      />

    </mesh>
    {extraObj}
    </Fragment>
  );
}

function getTriHexPosition(origin, radius, angle, sep=0) {
  let pos = new Vector3(1, 0, 0);
  let quat = new Quaternion();
  quat.setFromAxisAngle(new Vector3(0, 1, 0), angle);
  pos.applyQuaternion(quat);
  return pos.multiplyScalar(radius + sep).add(origin).clone();
}

function buildHex(currKey, getZ, origin, radius, sep, textures) {
  let items = [];
  let angles = [
    0,
    Math.PI/3,
    Math.PI*2/3,
    Math.PI,
    Math.PI*4/3,
    Math.PI*5/3,
  ]

  // let height = clip(baseHeight - noise2D(origin.x/10, origin.z/10)*noiseScale, 0.5);
  for (let i = 0; i < angles.length; i++) {
    let a = angles[i];
    let pos = getTriHexPosition(origin, radius, a, sep);
    let height = getZ(pos.x, pos.z);
    pos.y += height/2;
    items.push({
      position: pos,
      rotation: [0, a-Math.PI/2, 0],
      radius: radius,
      height: height,
    })
  }
  return (
    <>
      {
        items.map((item, index) => {
          return (
            <Block 
              key={currKey + index}
              position={item.position}
              rotation={item.rotation}
              height={item.height}
              radius={item.radius}
              radialSegments={item.radialSegments}
              textures={textures}
            />
          )})
        }
    </>
  );
}

function deg2rad(deg) {
  return deg * Math.PI / 180;
}

function buildHexGrid(
  getZ, 
  gridSize, 
  radius, 
  outerSep, 
  innerSep,
  textures,
  ) {
  let grid = []

  let currKey = 0;
  let hexLength =  (radius * Math.sin(deg2rad(120))) / Math.sin(deg2rad(30))
  let hexWidth  = hexLength * Math.cos(deg2rad(30));

  let hexGridCenter = new Vector3(
    (2*hexWidth*gridSize+3*outerSep*gridSize)/2, 
    0, 
    (1.5*hexLength*gridSize+3*outerSep*gridSize)/2
  );

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let origin = new Vector3(2*hexWidth*i+3*outerSep*i, 0, 1.5*hexLength*j+3*outerSep*j);
      if (j % 2 == 1) {
        origin.add(new Vector3(hexWidth + outerSep, 0, 0));
      }
      origin.sub(hexGridCenter);
      // if (origin.distanceTo(new Vector3(0, 0, 0)) > 9.8) {
      //   continue;
      // }
      grid.push(buildHex(currKey, getZ, origin, radius, innerSep, textures));
      currKey += 7;
    }
  }

  return (
    <Fragment>
      {
        grid.map((item, index) => {
          return (
            <Fragment key={index}>
              {item}
            </Fragment>
          )})
      }
    </Fragment>
  )
}

export const Scene = (props) => {
  const { gl, scene } = useThree();
  // Build a grid of triangles
  const gridSize = props.gridSize ||10;
  const innerSep = props.innerSep || 0.0;
  const outerSep = props.outerSep || 0.0;
  const radius = props.radius || 1;
  const noiseScale = props.noiseScale || 8;
  const baseHeight = props.baseHeight || 10;
  const minHeight = props.minHeight || 0.1;
  const noiseFunc = props.noiseFunc || 'simplex';

  let pmrem = new PMREMGenerator(gl);
  pmrem.compileEquirectangularShader()
  const loader = new RGBELoader();
  
  // let envmapTexture = loader.load('../assets/envmap.hdr');
  // let rt = pmrem.fromEquirectangular(envmapTexture);
  // envmapTexture = rt.texture;
  let envmapTexture = null;
  const textures = {
    envmap: envmapTexture,
    dirt:   useLoader(TextureLoader, "dirt.png"),
    dirt2:  useLoader(TextureLoader, "dirt2.jpg"),
    grass:  useLoader(TextureLoader, "grass.jpg"),
    sand:   useLoader(TextureLoader, "sand.jpg"),
    water:  useLoader(TextureLoader, "water.jpg"),
    stone:  useLoader(TextureLoader, "stone.png"),
  }

  let getZ = getZFuncs(noiseFunc, noiseScale, baseHeight, minHeight);
  let hexGrid = buildHexGrid(
    getZ, 
    gridSize, 
    radius, 
    outerSep, 
    innerSep,
    textures);
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight
        position={[0, 20, 10]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {/* <hemisphereLight 
        skyColor={0xffffbb}
        groundColor={0x080820}
        intensity={1}
      /> */}
      {hexGrid}
    </>
  );
};


