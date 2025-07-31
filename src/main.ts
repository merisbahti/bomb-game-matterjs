import Matter, {
  Engine,
  Render,
  Runner,
  Body,
  Bodies,
  Composite,
  Events,
  Query,
  MouseConstraint,
} from "matter-js";
// module aliases

var engine = Engine.create();

// create a renderer
var render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: document.body.clientWidth,
    height: document.body.clientHeight,
    wireframes: false,
  },
});

window.addEventListener("resize", () => {
  render.canvas.width = document.body.clientWidth;
  render.canvas.height = document.body.clientHeight;
  render.options.width = document.body.clientWidth;
  render.options.height = document.body.clientHeight;
});
const mouse = MouseConstraint.create(engine, {});

document.body.addEventListener("keydown", (event) => {
  state.keysDown.add(event.key);
});
document.body.addEventListener("keyup", (event) => {
  state.keysDown.delete(event.key);
});

const state = (() => {
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

  return {
    keysDown,
    canvasMousePos: { x: 0, y: 0 }, // initial mouse position,
    get mousePos() {
      return getWorldMousePos();
    },

    player,
    bombs,
    spawnCircle: () => {
      // spawn circle 40px under player, depending on player rotation
      const { x, y } = state.player.position;

      const angle = state.player.angle;
      const offsetX = Math.cos(angle) * 60;
      const offsetY = Math.sin(angle) * 60; // 90 degrees to the right
      const body = Bodies.circle(x + offsetX, y + offsetY, 10, {
        label: `dud-${bodies.length}`,
      });
      Body.setMass(body, 0.5);
      Body.setVelocity(body, {
        x: Math.cos(angle) * 50 + state.player.velocity.x,
        y: Math.sin(angle) * 50 + state.player.velocity.x,
      });

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
      const { x, y } = state.player.position;

      const angle = normalizeAngle(state.player.angle); // Ensure angle is within [0, 2π]

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
          state.player.velocity.x +
          outpushSpeed *
            Math.cos(angle + (spawnOnTop ? -1 : 1) * (Math.PI / 2)),
        y:
          state.player.velocity.y +
          outpushSpeed *
            Math.sin(angle + ((spawnOnTop ? -1 : 1) * Math.PI) / 2),
      });

      bombs.push(body);
      Composite.add(engine.world, body);
    },
  };
})();
// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 80, { label: "boxA" });
var boxB = Bodies.rectangle(450, 50, 80, 80, { label: "boxB" });
var ground = Bodies.rectangle(400, 610, 4000, 60, {
  isStatic: true,
  label: "ground",
  render: {
    fillStyle: "#00ff00",
  },
});

const normalizeAngle = (angle: number) => {
  if (angle > Math.PI) {
    return angle - 2 * Math.PI;
  } else if (angle < -Math.PI) {
    return angle + 2 * Math.PI;
  }
  return angle;
};

function anglePlayer() {
  const desiredAngle = Math.atan2(
    state.mousePos.y - state.player.position.y,
    state.mousePos.x - state.player.position.x,
  );

  const angle = state.player.angle;
  // slowly rotate the player towards the desired angle
  const angleDiff = normalizeAngle(desiredAngle - angle);

  const turnSpeed = 0.05; // Adjust this value to control the rotation speed

  Body.setAngularVelocity(state.player, angleDiff * turnSpeed);

  if (state.keysDown.has("z")) {
    Body.applyForce(state.player, state.player.position, {
      x: Math.cos(angle) * 0.004,
      y: Math.sin(angle) * 0.004,
    });
  }
  Render.lookAt(
    render,
    { position: state.player.position },
    { x: 1500, y: 1500 },
  );
  requestAnimationFrame(() => {
    anglePlayer();
  });
}
requestAnimationFrame(() => {
  anglePlayer();
});

Events.on(engine, "collisionStart", function (event) {
  const collidedBodies = event.pairs.flatMap(({ bodyA, bodyB }) => [
    bodyA,
    bodyB,
  ]);

  const collidedBombs = state.bombs.filter((bomb) =>
    collidedBodies.includes(bomb),
  );
  if (!collidedBombs) {
    return;
  }

  for (const collidedBomb of collidedBombs) {
    const radius = 400;
    const { x: bombX, y: bombY } = collidedBomb.position;

    const bodiesInRegion = Query.region(engine.world.bodies, {
      min: { x: bombX - radius, y: bombY - radius },
      max: { x: bombX + radius, y: bombY + radius },
    });
    const bodiesWithinRadius = bodiesInRegion.filter((body) => {
      const dx = body.position.x - bombX;
      const dy = body.position.y - bombY;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });

    // remove the bomb from the world
    Composite.remove(engine.world, collidedBomb);

    // @TODO: actually model this as a force.
    // It should be added to state, and should apply over 200ms or so.

    bodiesWithinRadius.forEach((body) => {
      if (body.isStatic) {
        return; // Skip static bodies and ground
      }

      const distance = Math.sqrt(
        (body.position.x - bombX) ** 2 + (body.position.y - bombY) ** 2,
      );
      const intensity = 1 - distance / radius;

      // set velocity away from the bomb
      Body.setVelocity(body, {
        x: (body.position.x - bombX) * 0.5 * intensity,
        y: (body.position.y - bombY) * 0.5 * intensity,
      });
    });

    console.log("Bomb collision detected!", bodiesWithinRadius);
  }
});

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

// add all of the bodies to the world
Composite.add(engine.world, [boxA, boxB, ground]);

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);
