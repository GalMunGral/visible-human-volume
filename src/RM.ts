import * as THREE from "three";
import { createProgramFromScripts } from "./utils";
import vertexShaderSrc from "./vert.glsl";
import fragmentShaderSrc from "./frag.glsl";

const filterInput = document.querySelector("#filter") as HTMLInputElement;

export class RayMarching {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;

  private eye = new THREE.Vector3(1, 1, 0);
  private forward = this.eye.clone().multiplyScalar(-1).normalize();
  private right = this.forward
    .clone()
    .cross(new THREE.Vector3(0, 0, 1))
    .normalize();
  private up = this.right.clone().cross(this.forward).normalize();

  private focus = 0.1;
  private fov = Math.PI / 3;

  private e1 = new THREE.Vector3(1, 0, 0);
  private e2 = new THREE.Vector3(0, 1, 0);
  private e3 = new THREE.Vector3(0, 0, 1);

  private keydown: Record<string, boolean> = {};
  private pointerDown = false;
  private prevX = -1;
  private prevY = -1;

  constructor(private canvas: HTMLCanvasElement) {
    (async () => {
      const r = 1;
      canvas.width = 512 / r;
      canvas.height = 512 / r;
      const gl = (this.gl = canvas.getContext("webgl2", { antialias: true })!);

      const program = (this.program = await createProgramFromScripts(
        gl,
        vertexShaderSrc,
        fragmentShaderSrc
      ));

      const vertices = [-1, 1, 1, 1, -1, -1, 1, -1];
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW
      );

      var positionLoc = gl.getAttribLocation(program, "ndcCoord");
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      const indices = [2, 1, 0, 1, 2, 3];
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
      );

      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_3D, texture);
      gl.texParameteri(
        gl.TEXTURE_3D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_NEAREST
      );
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      window.addEventListener("keydown", (e) => {
        this.keydown[e.key] = true;
      });

      window.addEventListener("keyup", (e) => {
        this.keydown[e.key] = false;
      });

      window.addEventListener("pointerdown", (e) => {
        if (e.target instanceof HTMLCanvasElement) {
          this.pointerDown = true;
          this.prevX = e.clientX - this.canvas.getBoundingClientRect().left;
          this.prevY = e.clientY - this.canvas.getBoundingClientRect().top;
        }
      });

      window.addEventListener("pointerup", () => (this.pointerDown = false));

      window.addEventListener("pointermove", (e) => {
        if (this.pointerDown) {
          const q = new THREE.Quaternion()
            .setFromUnitVectors(
              this.toDir(this.prevX, this.prevY),
              this.toDir(
                e.clientX - this.canvas.getBoundingClientRect().left,
                e.clientY - this.canvas.getBoundingClientRect().top
              )
            )
            .normalize();

          this.e1.applyQuaternion(q);
          this.e2.applyQuaternion(q);
          this.e3.applyQuaternion(q);

          this.prevX = e.clientX - this.canvas.getBoundingClientRect().left;
          this.prevY = e.clientY - this.canvas.getBoundingClientRect().top;
        }
      });
    })();
  }

  private toDir(x: float, y: float): THREE.Vector3 {
    const scale =
      (2 * this.focus * Math.tan(this.fov / 2)) /
      Math.max(this.canvas.width, this.canvas.height);

    return this.eye
      .clone()
      .multiplyScalar(0.01)
      .add(
        this.right
          .clone()
          .multiplyScalar((x - this.gl.canvas.width / 2) * scale)
      )
      .add(
        this.up.clone().multiplyScalar(-(y - this.gl.canvas.height / 2) * scale)
      )
      .normalize();
  }

  public rotateAboutZ(angle: float) {
    if (!this.pointerDown) {
      const z = new THREE.Vector3(0, 0, 1);
      this.e1.applyAxisAngle(z, angle);
      this.e2.applyAxisAngle(z, angle);
      this.e3.applyAxisAngle(z, angle);
    }
  }

  public render(
    texture3d: Uint8Array,
    width: number,
    height: number,
    depth: number
  ) {
    const { gl, program } = this;

    if (!program) return;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program);

    gl.texImage3D(
      gl.TEXTURE_3D,
      0,
      gl.RGBA,
      width,
      height,
      depth,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      texture3d
    );
    gl.generateMipmap(gl.TEXTURE_3D);

    const L = (name: string) => gl.getUniformLocation(program, name);
    const RInv = new THREE.Matrix3(
      this.e1.x,
      this.e1.y,
      this.e1.z,
      this.e2.x,
      this.e2.y,
      this.e2.z,
      this.e3.x,
      this.e3.y,
      this.e3.z
    );
    const inObjectSpace = (v: THREE.Vector3): THREE.Vector3 => {
      return v.clone().applyMatrix3(RInv);
    };

    gl.uniform1i(L(`volume`), 0);
    gl.uniform2fv(
      L(`viewport`),
      new Float32Array([gl.canvas.width, gl.canvas.height])
    );
    gl.uniform1f(L(`focus`), this.focus);
    gl.uniform1f(L(`fov`), this.fov);
    gl.uniform3fv(L(`eye`), new Float32Array(inObjectSpace(this.eye)));
    gl.uniform3fv(L(`forward`), new Float32Array(inObjectSpace(this.forward)));
    gl.uniform3fv(L(`up`), new Float32Array(inObjectSpace(this.up)));
    gl.uniform3fv(L(`right`), new Float32Array(inObjectSpace(this.right)));

    gl.uniform1f(L(`value`), Number(filterInput.value));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
}
