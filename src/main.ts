import {
  Engine,
  Render,
  Runner,
  Body,
  Bodies,
  Composite,
  Events,
  Query,
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
  const bombs: Array<Matter.Body> = []; // @TODO: use collisionfilter
  const bodies: Array<Matter.Body> = [];
  const player = Bodies.rectangle(400, 200, 80, 40);
  Composite.add(engine.world, player);

  return {
    player,
    bombs,
    spawnCircle: (x: number, y: number) => {
      const body = Bodies.circle(x, y, 40, {
        label: `dud-${bodies.length}`,
      });
      bodies.push(body);
      Composite.add(engine.world, body);
    },
    spawnSquare: (x: number, y: number) => {
      const body = Bodies.rectangle(x, y, 80, 80, {
        label: `dud-${bodies.length}`,
      });
      bodies.push(body);
      Composite.add(engine.world, body);
    },
    spawnBomb: (x: number, y: number) => {
      const bombBody = Bodies.circle(x, y, 40, {
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
  const collidedBombs = state.bombs.filter((bomb) =>
    event.pairs.flatMap(({ bodyA, bodyB }) => [bodyA, bodyB]).includes(bomb),
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
        x: (body.position.x - bombX) * 0.1 * intensity,
        y: (body.position.y - bombY) * 0.1 * intensity,
      });
    });

    console.log("Bomb collision detected!", bodiesWithinRadius);
  }
});
const mousePos = { x: 0, y: 0 };
document.addEventListener("click", ({ clientX, clientY }) => {
  console.log("click", clientX, clientY);
  // create a new box at the click position
});
document.addEventListener("mousemove", ({ clientX, clientY }) => {
  mousePos.x = clientX;
  mousePos.y = clientY;

  const desiredAngle = Math.atan2(
    clientY - state.player.position.y,
    clientX - state.player.position.x,
  );

  const angle = state.player.angle;
  console.log("angle", angle, state.player.angle);
  // slowly rotate the player towards the desired angle
  const angleDiff = desiredAngle - angle;
  const rotationSpeed = 0.05; // Adjust this value to control the rotation speed
  const angleDiffNormalized = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI; // Normalize to [-PI, PI]
  const newAngle = angle + Math.sign(angleDiffNormalized) * rotationSpeed;

  Body.setAngle(state.player, newAngle);
  const speed = 10;
  Body.setVelocity(state.player, {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed,
  });
  console.log({
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed,
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "b") {
    state.spawnBomb(mousePos.x, mousePos.y);
  } else if (event.key === "d") {
    state.spawnSquare(mousePos.x, mousePos.y);
  } else if (event.key === "c") {
    state.spawnCircle(mousePos.x, mousePos.y);
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
