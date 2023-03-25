import * as THREE from "three";
import {Fragment} from 'react';
import { createRoot } from "react-dom/client";
import React, { useRef, useState } from "react";
import { Canvas, useFrame, ThreeElements } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";
import { createNoise2D } from 'simplex-noise';
import { Billboard, Text } from "@react-three/drei";
import { getZFuncs } from "./TerrainGenerator";

function Block(props) {
  const mesh = useRef(null);
  const radialSegments = 3;
  return (
    <mesh
      {...props}
      ref={mesh}
      castShadow
    >
      <cylinderGeometry args={[props.radius, props.radius, props.height, radialSegments]} />
      <meshStandardMaterial color={"grey"} />
    </mesh>
  );
}

function getTriHexPosition(origin, radius, angle, sep=0) {
  let pos = new Vector3(1, 0, 0);
  let quat = new Quaternion();
  quat.setFromAxisAngle(new Vector3(0, 1, 0), angle);
  pos.applyQuaternion(quat);
  return pos.multiplyScalar(radius + sep).add(origin).clone();
}

function clip(x, minVal=0, maxVal=10000) {
  if (x < minVal) {
    return minVal;
  }
  if (x > maxVal) {
    return maxVal;
  }
  return x;
}
function buildHex(currKey, getZ, origin, radius, sep) {
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
            />
          )})
        }
    </>
  );
}

function deg2rad(deg) {
  return deg * Math.PI / 180;
}

function buildHexGrid(getZ, gridSize, radius, outerSep, innerSep) {
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
      grid.push(buildHex(currKey, getZ, origin, radius, innerSep));
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

  // Build a grid of triangles
  const gridSize = props.gridSize ||10;
  const innerSep = props.innerSep || 0.0;
  const outerSep = props.outerSep || 0.0;
  const radius = props.radius || 1;
  const noiseScale = props.noiseScale || 8;
  const baseHeight = props.baseHeight || 10;
  const minHeight = props.minHeight || 0.1;
  const noiseFunc = props.noiseFunc || 'simplex';

  let getZ = getZFuncs(noiseFunc, noiseScale, baseHeight, minHeight);
  let hexGrid = buildHexGrid(getZ, gridSize, radius, outerSep, innerSep);
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight
        position={[0, 20, 0]}
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


