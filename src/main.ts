import {
  Engine,
  Render,
  Runner,
  Body,
  Bodies,
  Composite,
  Events,
  Detector,
  Query,
  Bounds,
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

const state = (() => {
  const bombs: Array<Matter.Body> = [];
  const duds: Array<Matter.Body> = [];

  return {
    bombs,
    spawnDud: (x: number, y: number) => {
      const body = Bodies.rectangle(x, y, 80, 80, {
        label: `dud-${duds.length}`,
        render: {
          fillStyle: "red",
        },
      });
      duds.push(body);
      Composite.add(engine.world, body);
    },
    spawnBomb: (x: number, y: number) => {
      const bombBody = Bodies.rectangle(x, y, 80, 80, {
        label: `bomb-${bombs.length}`,
        render: {
          fillStyle: "red",
        },
      });
      bombs.push(bombBody);
      Composite.add(engine.world, bombBody);
    },
  };
})();
// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 80, { label: "boxA" });
var boxB = Bodies.rectangle(450, 50, 80, 80, { label: "boxB" });
var ground = Bodies.rectangle(400, 610, 810, 60, {
  isStatic: true,
  label: "ground",
});

Events.on(engine, "collisionStart", function (event) {
  const collidedBomb = state.bombs.find((bomb) =>
    event.pairs.flatMap(({ bodyA, bodyB }) => [bodyA, bodyB]).includes(bomb),
  );
  if (!collidedBomb) {
    return;
  }

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

  // apply force to all bodies within the radius
  bodiesWithinRadius.forEach((body) => {
    if (body.isStatic) {
      return; // Skip static bodies and ground
    }

    // set velocity away from the bomb
    Body.setVelocity(body, {
      x: (body.position.x - bombX) * 0.1,
      y: (body.position.y - bombY) * 0.1,
    });
  });

  console.log("Bomb collision detected!", bodiesWithinRadius);
});
const mousePos = { x: 0, y: 0 };
document.addEventListener("click", ({ clientX, clientY }) => {
  console.log("click", clientX, clientY);
  // create a new box at the click position
});
document.addEventListener("mousemove", ({ clientX, clientY }) => {
  mousePos.x = clientX;
  mousePos.y = clientY;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "b") {
    state.spawnBomb(mousePos.x, mousePos.y);
  } else if (event.key === "d") {
    state.spawnDud(mousePos.x, mousePos.y);
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
