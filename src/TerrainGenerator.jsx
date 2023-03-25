import { createNoise2D } from 'simplex-noise';

function clip(x, minVal=0, maxVal=10000) {
    if (x < minVal) {
      return minVal;
    }
    if (x > maxVal) {
      return maxVal;
    }
    return x;
  }
export function getZFuncs(name, noiseScale, baseHeight, minHeight) {
    if (name == 'simplex') {
      let noise2D = createNoise2D();
      return (x, y) => clip(baseHeight-noise2D(x/10, y/10)*noiseScale, minHeight);
    }
    return {
      pyramid: (x,y) => clip(baseHeight - Math.abs(x)-Math.abs(y), minHeight),
      cone: (x,y) => clip(baseHeight - (x**2 + y**2)**0.5, minHeight),
      bumps: (x,y) => clip(baseHeight - (Math.sin(x) + Math.cos(y))/2, minHeight),
      riple: (x,y) => clip(baseHeight - (Math.sin(10*((x/10)**2 + (y/10)**2))/10)*noiseScale, minHeight),
      torus: (x,y) => clip( baseHeight +  ((0.4^2-(0.6-((x/1)^2+(y/1)^2)^0.5)^2)^0.5)/10 , minHeight),
      flat: (x,y) => clip(baseHeight, minHeight),
    }[name];
  }
  