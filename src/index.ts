import { Renderer } from "./renderer";
import { load3dTexture } from "./texture-utils";
import * as THREE from "three";

const dims = new THREE.Vector3(512, 512, 234);

async function main() {
  const canvas = document.querySelector("canvas")!;
  const renderer = new Renderer(canvas, dims);

  const image3d = await load3dTexture(dims);

  let prev = -1;
  let rafHandle = -1;
  cancelAnimationFrame(rafHandle);

  rafHandle = requestAnimationFrame(function frame(t: DOMHighResTimeStamp) {
    const dt = t - prev;
    renderer.rotateAboutZ(new THREE.Vector3(0, 0, 1), 0.0005 * dt);
    renderer.rotateAboutZ(new THREE.Vector3(0, 1, 0), 0.0001 * dt);
    renderer.render(image3d);
    prev = t;
    rafHandle = requestAnimationFrame(frame);
  });
}

main();
