import { Quaternion } from "three";
import { GLRayMarcher } from "./GLRayMarcher/GLRayMarcher";
import { Volume } from "./GLRayMarcher/Volume";

const filterInput = document.querySelector("#filter") as HTMLInputElement;

const WIDTH = 512;
const HEIGHT = 512;
const DEPTH = 234;

async function main() {
  const canvas = document.querySelector("canvas")!;
  canvas.width = 512;
  canvas.height = 512;

  const renderer = GLRayMarcher.from(canvas);

  const volume = new Volume(WIDTH, HEIGHT, DEPTH);
  await volume.load((i) => `./public/texture/texture-${i}.png`);
  renderer.uploadVolumeData(volume);

  let lastTimestamp = -1;
  requestAnimationFrame(function frame(t) {
    if (!renderer.camera.screen.pointerDown) {
      const quat = new Quaternion().setFromAxisAngle(
        renderer.camera.up,
        0.001 * (t - lastTimestamp)
      );
      renderer.camera.pos.applyQuaternion(quat);
      renderer.camera.forward.applyQuaternion(quat);
      renderer.camera.right.applyQuaternion(quat);
      renderer.camera.up.applyQuaternion(quat);
    }
    renderer.render(Number(filterInput.value));
    requestAnimationFrame(frame);
    lastTimestamp = t;
  });
}

main();
