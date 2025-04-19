import { RayMarching } from "./RM";
import { load3dTexture } from "./texture";

(async function main() {
  const canvas = document.querySelector("canvas")!;
  const renderer = new RayMarching(canvas);

  const sizeX = 512;
  const sizeY = 512;
  const sizeZ = 234;

  const image3d = await load3dTexture(sizeX * sizeY, sizeZ);

  let prev = -1;
  let rafHandle = -1;
  cancelAnimationFrame(rafHandle);

  rafHandle = requestAnimationFrame(function frame(t: DOMHighResTimeStamp) {
    const dt = t - prev;
    renderer.rotateAboutZ(0.0005 * dt);
    renderer.render(image3d, sizeX, sizeY, sizeZ);
    prev = t;
    rafHandle = requestAnimationFrame(frame);
  });
})();
