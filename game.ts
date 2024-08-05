import { Canvas, Texture, EventType, Rect, Surface, WindowBuilder } from "jsr:@divy/sdl2";

export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function drawMap(
  texture: Texture,
  canvas: Canvas,
  map: number[][],
  chipSize: number,
): Rect[] {
  const frames: Rect[] = [];
  for (let i = 0; i < map.length; i++) {
    for (let j = 0; j < map[i].length; j++) {
      const chip = map[i][j];
      const src = new Rect(
        (chip % 4) * chipSize,
        ((chip / 4) | 0) * chipSize,
        chipSize,
        chipSize,
      );
      const dst = new Rect(
        i * chipSize * 4,
        j * chipSize * 4,
        chipSize * 4,
        chipSize * 4,
      );
      // 9 = cactus
      // 8 = normal tile
      if (chip === 9) frames.push(dst);
      canvas.copy(
        texture,
        src,
        dst,
      );
    }
  }
  return frames;
}

export class Sprite {
  x = 0;
  y = 0;
  z = 0;
  vx = 0;
  vy = 0;
  originX = 0;
  originY = 0;
  scale = 1;
  texture: Texture;
  frames: Rect[];
  index = 0;

  constructor(texture: Texture, frames: Rect[]) {
    this.texture = texture;
    this.frames = frames;
  }

  draw(dest: Canvas) {
    const dst = new Rect(
      this.x - this.originX,
      this.y - this.originY - this.z,
      this.frames[this.index].width * this.scale,
      this.frames[this.index].height * this.scale,
    );
    dest.copy(this.texture, this.frames[this.index], dst);
  }

  tick() {
    this.x += this.vx;
    this.y += this.vy;
  }

  wrap(rect: Area) {
    this.x = (this.x - rect.x) % rect.width + rect.x;
    this.y = (this.y - rect.y) % rect.height + rect.y;
  }
}
function sleepSync(ms: number) {
  const start = Date.now();
  while (true) {
    if (Date.now() - start > ms) {
      break;
    }
  }
}

const canvasSize = { width: 1000, height:800 };
const window = new WindowBuilder(
  "Hello, Deno!",
  canvasSize.width,
  canvasSize.height,
).build();
const canv = window.canvas();

const surface = Surface.fromFile("./sprites.png");

const creator = canv.textureCreator();
const texture = creator.createTextureFromSurface(surface);

const map = [
  [8, 8, 9, 8, 11, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 10, 8, 8, 8, 8],
  [8, 10, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 10, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 10, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 10, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 9, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [10, 8, 8, 8, 8, 8, 8, 8, 8, 8, 10, 8, 8, 8, 8],
  [8, 8, 11, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 10, 8],
  [8, 8, 9, 8, 11, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 10, 8, 8, 8, 8],
  [8, 10, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 10, 8, 8],
  [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 10, 8, 8, 8],
  [8, 8, 8, 8, 8, 8, 10, 8, 8, 8, 8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 9, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  [10, 8, 8, 8, 8, 8, 8, 8, 8, 8, 10, 8, 8, 8, 8],
  [8, 8, 11, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 10, 8],
];

const denoTextureFrames = [
  new Rect(0, 0, 16, 16),
  new Rect(16, 0, 16, 16),
  new Rect(32, 0, 16, 16),
  new Rect(48, 0, 16, 16),
];

const shadowTexture = [
  new Rect(0, 3 * 16, 16, 16),
];

function random(min: number, max: number) {
  return (Math.random() * (max - min) + min) | 0;
}

function createShadowInstance() {
  const shadow = new Sprite(texture, shadowTexture);
  shadow.x = 0;
  shadow.y = 0;
  shadow.originX = shadow.frames[0].width / 2 + 6;
  shadow.originY = shadow.frames[0].height - 16;
  shadow.scale = 4;
  shadow.vx = 0;
  shadow.vy = 0;
  return shadow;
}

function createDenoInstance(id) {
  const deno = new Sprite(texture, denoTextureFrames);
  deno.x = random(0, canvasSize.width);
  deno.y = random(0, canvasSize.height);
  deno.originX = deno.frames[0].width / 2;
  deno.originY = deno.frames[0].height;
  deno.scale = 4;
  deno.vx = 0;
  deno.vy = 0;
  deno.id = id || 0;
  return deno;
}

const denos: Sprite[] = [];
const self = createDenoInstance();
const shadow = createShadowInstance();

let cnt = 0;
let mouse = { x: 0, y: 0 };

function frame(e) {
  canv.clear();
  const tiles = drawMap(texture, canv, map, 16);

  for (const deno of [...denos, self]) {
    deno.tick();
    shadow.draw(canv);
    deno.draw(canv);

    const margin = 48;
    deno.wrap({
      x: -margin,
      y: -margin,
      width: canvasSize.width + margin * 2,
      height: canvasSize.height + margin * 2,
    });

    shadow.x = deno.x;
    shadow.y = deno.y;

    // make deno jump
    deno.z = Math.abs(Math.sin(cnt / 10) * 16) | 0;

    if ((cnt / 20 | 0) % 2 === 0) {
      if (deno.vx > 0) {
        deno.index = 2;
      } else {
        deno.index = 0;
      }
    } else {
      if (deno.vx > 0) {
        deno.index = 3;
      } else {
        deno.index = 1;
      }
    }

    deno.vx = (mouse.x - deno.x) / 100;
    deno.vy = (mouse.y - deno.y) / 100;

    // check for collision with tiles on map
//   for (const tile of tiles) {
//     if (deno.x < tile.x + tile.width &&
//       deno.x + deno.frames[0].width * deno.scale > tile.x &&
//       deno.y < tile.y + tile.height &&
//       deno.y + deno.frames[0].height * deno.scale > tile.y) {
//       deno.x -= deno.vx;
//       deno.y -= deno.vy;
//     }
//   }
  }

  cnt++;
  canv.present();

  sleepSync(10);
}

for await (const event of window.events()) {
  switch (event.type) {
    case EventType.Draw:
      frame();
      break;
    case EventType.Quit:
      Deno.exit(0);
      break;
    case EventType.MouseMotion:
      mouse.x = event.x;
      mouse.y = event.y;
      break;
    default:
      break;
  }
}
