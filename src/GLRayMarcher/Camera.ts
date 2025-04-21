import { Quaternion, Vec2, Vector2, Vector3 } from "three";
import { GLScreen } from "./GLScreen";

export class Camera {
  public forward: Vector3;
  public right: Vector3;
  public up: Vector3;

  private arcBallRadius: number;

  constructor(
    public screen: GLScreen,
    public pos: Vector3,
    public lookAt: Vector3,
    up: Vector3,
    public fovy: number,
    public screenDist: number
  ) {
    this.forward = lookAt.clone().sub(pos).normalize();
    this.right = this.forward.clone().cross(up).normalize();
    this.up = this.right.clone().cross(this.forward);

    this.arcBallRadius = lookAt.clone().sub(pos).length() / 3;

    this.screen.onDrag((prevPos, curPos) => {
      const quat = new Quaternion()
        .setFromUnitVectors(
          this.castRayToArcBall(curPos).normalize(),
          this.castRayToArcBall(prevPos).normalize()
        )
        .normalize();
      this.pos.applyQuaternion(quat);
      this.forward.applyQuaternion(quat);
      this.right.applyQuaternion(quat);
      this.up.applyQuaternion(quat);
    });
  }

  get unitsPerPixel() {
    const imagePlaneHeight = 2 * this.screenDist * Math.tan(this.fovy / 2);
    const imagePlaneHeightInPixels = this.screen.height;
    return imagePlaneHeight / imagePlaneHeightInPixels;
  }

  private castRayFrom(screenPos: Vector2): Vector3 {
    return this.forward
      .clone()
      .multiplyScalar(this.screenDist)
      .add(
        this.right
          .clone()
          .multiplyScalar(
            (screenPos.x - this.screen.width / 2) * this.unitsPerPixel
          )
      )
      .add(
        this.up
          .clone()
          .multiplyScalar(
            -(screenPos.y - this.screen.height / 2) * this.unitsPerPixel
          )
      )
      .normalize();
  }

  private castRayToArcBall(screenPos: Vector2): Vector3 {
    const ray = this.castRayFrom(screenPos);
    const p = this.pos
      .clone()
      .add(
        ray.clone().multiplyScalar(this.lookAt.clone().sub(this.pos).dot(ray))
      );
    const offset = p.clone().sub(this.lookAt);
    const r = offset.length();
    if (r > this.arcBallRadius) {
      return this.lookAt
        .clone()
        .add(offset.multiplyScalar(this.arcBallRadius / r));
    }
    const d = Math.sqrt(this.arcBallRadius * this.arcBallRadius - r * r);
    return p.sub(ray.multiplyScalar(d));
  }
}
