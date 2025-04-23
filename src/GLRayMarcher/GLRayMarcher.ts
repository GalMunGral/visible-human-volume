import { Camera } from "./Camera";
import { Vector3 } from "three";
import { GLProgram } from "./GLProgram";
import { GLScreen } from "./GLScreen";
import { Volume } from "./Volume";

import fragmentShaderSrc from "./raymarching.frag";

export class GLRayMarcher {
  static from(canvas: HTMLCanvasElement) {
    const screen = new GLScreen(canvas);
    const program = GLProgram.fromSource(screen, fragmentShaderSrc);
    const camera = new Camera(
      screen,
      new Vector3(0.5, 0.5, 0),
      new Vector3(0, 0, 1),
      75 * (Math.PI / 180),
      0.1
    );
    const rayMarcher = new GLRayMarcher(program, camera);
    return rayMarcher;
  }

  private volume: Volume;

  private constructor(private program: GLProgram, public camera: Camera) {}

  public uploadVolumeData(volume: Volume) {
    this.volume = volume;
    this.program.createTexture3D("data", volume);
    const size = Math.max(volume.width, volume.height, volume.depth);
    this.program.setUniforms({
      volume_dims: [
        this.volume.width / size,
        this.volume.height / size,
        this.volume.depth / size,
      ],
    });
  }

  public render() {
    this.program.setUniforms({
      viewport: [this.camera.screen.width, this.camera.screen.height],
      camera_pos: this.camera.pos,
      camera_forward: this.camera.forward,
      camera_right: this.camera.right,
      camera_up: this.camera.up,
      screen_dist: this.camera.screenDist,
      fovy: this.camera.fovy,
    });
    this.program.draw();
  }
}
