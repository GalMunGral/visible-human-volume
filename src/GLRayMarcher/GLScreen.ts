import { Quaternion, Vec2, Vector2 } from "three";

type DragListener = (prevPos: Vector2, curPos: Vector2) => void;

export class GLScreen {
  private dragListeners = new Set<DragListener>();

  private lastEventCoords = new Vector2();
  public pointerDown = false;

  constructor(public canvas: HTMLCanvasElement) {
    canvas.addEventListener("pointerdown", (e) => {
      this.pointerDown = true;
      this.lastEventCoords = this.getEventCoords(e);
    });

    window.addEventListener("pointerup", () => {
      this.pointerDown = false;
    });

    window.addEventListener("pointermove", (e) => {
      if (this.pointerDown) {
        for (const fn of this.dragListeners) {
          const eventCoords = this.getEventCoords(e);
          fn(this.lastEventCoords, eventCoords);
          this.lastEventCoords = eventCoords;
        }
      }
    });
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  private getEventCoords(e: MouseEvent) {
    const boundingRect = this.canvas.getBoundingClientRect();
    return new Vector2(
      e.clientX - boundingRect.left,
      e.clientY - boundingRect.top
    );
  }

  onDrag(fn: DragListener): void {
    this.dragListeners.add(fn);
  }
}
