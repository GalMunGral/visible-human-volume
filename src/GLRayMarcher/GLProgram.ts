import { GLScreen } from "./GLScreen";
import { Volume } from "./Volume";

const VERTEX_SHADER_SRC = `\
#version 300 es
in vec2 pos;
void main() {
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

export class GLProgram {
  static fromSource(screen: GLScreen, fragmentShaderSrc: string): GLProgram {
    const program = new GLProgram(screen);
    program.compile(VERTEX_SHADER_SRC, fragmentShaderSrc);
    program.makeQuad();
    return program;
  }

  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;

  private constructor(private screen: GLScreen) {
    this.gl = screen.canvas.getContext("webgl2", { antialias: true })!;
    this.program = this.gl.createProgram();
  }

  private compileShader(shaderSource: string, shaderType: GLenum): WebGLShader {
    const shader = this.gl.createShader(shaderType)!;
    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);
    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (!success) {
      throw this.gl.getShaderInfoLog(shader);
    }
    return shader;
  }

  private compile(vertexShaderSrc: string, fragmentShaderSrc: string): void {
    const vertexShader = this.compileShader(
      vertexShaderSrc,
      this.gl.VERTEX_SHADER
    );
    this.gl.attachShader(this.program, vertexShader);
    const fragmentShader = this.compileShader(
      fragmentShaderSrc,
      this.gl.FRAGMENT_SHADER
    );
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);
    const success = this.gl.getProgramParameter(
      this.program,
      this.gl.LINK_STATUS
    );
    if (!success) {
      throw this.gl.getProgramInfoLog(this.program);
    }
  }

  private makeQuad() {
    const posBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]),
      this.gl.STATIC_DRAW
    );

    const posLocation = this.gl.getAttribLocation(this.program, "pos");
    this.gl.enableVertexAttribArray(posLocation);
    this.gl.vertexAttribPointer(posLocation, 2, this.gl.FLOAT, false, 0, 0);

    const indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array([2, 1, 0, 1, 2, 3]),
      this.gl.STATIC_DRAW
    );
  }

  public createTexture3D(name: string, volume: Volume): WebGLTexture {
    const texture = this.gl.createTexture();
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_3D, texture);
    this.gl.texParameteri(
      this.gl.TEXTURE_3D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.NEAREST_MIPMAP_NEAREST
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_3D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.NEAREST
    );
    this.gl.texImage3D(
      this.gl.TEXTURE_3D,
      0,
      this.gl.RGBA,
      volume.width,
      volume.height,
      volume.depth,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      volume.data
    );

    this.gl.generateMipmap(this.gl.TEXTURE_3D);

    this.gl.useProgram(this.program);
    const loc = this.gl.getUniformLocation(this.program, name);
    this.gl.uniform1i(loc, 0);
    return texture;
  }

  private setUniform(name: string, value: number | Iterable<number>) {
    const loc = this.gl.getUniformLocation(this.program, name);
    if (typeof value !== "number") {
      const f32Array = new Float32Array(value);
      if (f32Array.length === 4) {
        this.gl.uniform4fv(loc, f32Array);
      } else if (f32Array.length === 3) {
        this.gl.uniform3fv(loc, f32Array);
      } else if (f32Array.length === 2) {
        this.gl.uniform2fv(loc, f32Array);
      } else if (f32Array.length === 1) {
        this.gl.uniform1fv(loc, f32Array);
      }
    } else {
      this.gl.uniform1f(loc, value);
    }
  }

  public setUniforms(uniforms: Record<string, number | Iterable<number>>) {
    this.gl.useProgram(this.program);
    for (const name in uniforms) {
      this.setUniform(name, uniforms[name]);
    }
  }

  public draw() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.useProgram(this.program);
    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
  }
}
