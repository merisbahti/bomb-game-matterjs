import Matter, {
  Body,
  Bodies,
  Composite,
  Engine,
  MouseConstraint,
  Render,
  Vector,
} from "matter-js";
import { normalizeAngle } from "./utils";

export const createState = (
  engine: Engine,
  mouse: MouseConstraint,
  render: Render,
) => {
  const bombs: Array<Matter.Body> = []; // @TODO: use collisionfilter
  const bodies: Array<Matter.Body> = [];
  const player = Bodies.rectangle(400, 200, 80, 40);
  const keysDown = new Set<string>();
  Composite.add(engine.world, player);

  const getWorldMousePos = () => {
    const mousePosition = mouse.mouse.position;
    const xPercent = mousePosition.x / render.canvas.width;
    const yPercent = mousePosition.y / render.canvas.height;
    return {
      x:
        render.bounds.min.x +
        xPercent * (render.bounds.max.x - render.bounds.min.x),
      y:
        render.bounds.min.y +
        yPercent * (render.bounds.max.y - render.bounds.min.y),
    };
  };

  const state = {
    keysDown,
    canvasMousePos: { x: 0, y: 0 }, // initial mouse position,
    get mousePos() {
      return getWorldMousePos();
    },

    player,
    bombs,
    spawnCircle: () => {
      // spawn circle 40px under player, depending on player rotation
      const { x, y } = player.position;

      const angle = player.angle;
      const offsetX = Math.cos(angle) * 60;
      const offsetY = Math.sin(angle) * 60;
      const body = Bodies.circle(x + offsetX, y + offsetY, 10, {
        label: `dud-${bodies.length}`,
      });
      Body.setMass(body, 0.5);
      Body.setVelocity(
        body,
        Vector.add(
          {
            x: Math.cos(angle) * 50,
            y: Math.sin(angle) * 50,
          },
          player.velocity,
        ),
      );

      bodies.push(body);
      Composite.add(engine.world, body);
    },
    spawnSquare: () => {
      const mousePosition = getWorldMousePos();

      const body = Bodies.rectangle(mousePosition.x, mousePosition.y, 80, 80, {
        label: `dud-${bodies.length}`,
      });
      bodies.push(body);
      Composite.add(engine.world, body);
    },
    spawnBomb: () => {
      // spawn circle 40px under player, depending on player rotation
      const { x, y } = player.position;

      const angle = normalizeAngle(player.angle); // Ensure angle is within [0, 2π]

      const spawnOnTop = angle < -Math.PI / 2 && angle > (-Math.PI * 3) / 2;
      const offsetX =
        Math.cos(angle + Math.PI / 2 + (spawnOnTop ? Math.PI : 0)) * 40;

      const offsetY =
        Math.sin(angle + Math.PI / 2 + (spawnOnTop ? Math.PI : 0)) * 40; // 90 degrees to the right
      const body = Bodies.circle(x + offsetX, y + offsetY, 10, {
        label: `dud-${bodies.length}`,
      });

      const outpushSpeed = 10;

      Body.setVelocity(body, {
        x:
          player.velocity.x +
          outpushSpeed *
            Math.cos(angle + (spawnOnTop ? -1 : 1) * (Math.PI / 2)),
        y:
          player.velocity.y +
          outpushSpeed *
            Math.sin(angle + ((spawnOnTop ? -1 : 1) * Math.PI) / 2),
      });

      bombs.push(body);
      Composite.add(engine.world, body);
    },
  };

  document.addEventListener("click", ({ clientX, clientY }) => {
    state.canvasMousePos = { x: clientX, y: clientY };
  });
  document.addEventListener("mousemove", ({ clientX, clientY }) => {
    state.canvasMousePos = { x: clientX, y: clientY };
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "b") {
      state.spawnBomb();
    } else if (event.key === "d") {
      state.spawnSquare();
    } else if (event.key === "c") {
      state.spawnCircle();
    }
  });

  document.body.addEventListener("keydown", (event) => {
    state.keysDown.add(event.key);
  });
  document.body.addEventListener("keyup", (event) => {
    state.keysDown.delete(event.key);
  });

  return state;
};
