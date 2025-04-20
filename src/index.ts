import { RayMarching } from "./RM";
import { load3dTexture } from "./texture";
import * as THREE from "three";

const dims = new THREE.Vector3(512, 512, 234);

async function main() {
  const canvas = document.querySelector("canvas")!;
  const renderer = new RayMarching(canvas, dims);

  const image3d = await load3dTexture(dims);

  let prev = -1;
  let rafHandle = -1;
  cancelAnimationFrame(rafHandle);

  rafHandle = requestAnimationFrame(function frame(t: DOMHighResTimeStamp) {
    const dt = t - prev;
    renderer.rotateAboutZ(0.0005 * dt);
    renderer.render(image3d);
    prev = t;
    rafHandle = requestAnimationFrame(frame);
  });
}

main();
