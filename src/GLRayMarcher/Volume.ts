export class Volume {
  public data: Uint8Array;

  constructor(
    public width: number,
    public height: number,
    public depth: number
  ) {
    this.data = new Uint8Array(width * height * depth * 4);
  }

  get numLayers() {
    return this.depth;
  }

  get layerSize() {
    return this.width * this.height * 4;
  }

  private loadSlice(url: string): Promise<Uint8ClampedArray> {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = url;
      image.onload = () => {
        const ctx = new OffscreenCanvas(this.width, this.height).getContext(
          "2d"
        )!;
        ctx.drawImage(image, 0, 0);
        resolve(ctx.getImageData(0, 0, this.width, this.height).data);
      };
    });
  }

  async load(sliceImageUrl: (i: number) => string): Promise<void> {
    const tasks = new Array<Promise<Uint8ClampedArray>>(this.numLayers);
    for (let i = 0; i < this.numLayers; ++i) {
      tasks[i] = this.loadSlice(sliceImageUrl(i));
    }
    const layers = await Promise.all(tasks);
    for (let i = 0; i < this.numLayers; ++i) {
      this.data.set(layers[i], i * this.layerSize);
    }
  }
}
