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
import { createState } from "./state";
import { normalizeAngle } from "./utils";
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
const state = createState(engine, mouse, render);

// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 80, { label: "boxA" });
var boxB = Bodies.rectangle(450, 50, 80, 80, { label: "boxB" });

// var ground = Bodies.rectangle(400, 610, 4000, 60, {
//   isStatic: true,
//   label: "ground",
//   render: {
//     fillStyle: "#00ff00",
//   },
// });

// make ground from vertices instead of a rectangle

const ground = Bodies.fromVertices(
  200,
  600,
  [
    [
      { x: -2000, y: 30 },
      { x: 2000, y: 30 },
      { x: 2000, y: 60 },
      { x: -2000, y: 60 },
    ],
  ],
  {
    isStatic: true,
    label: "ground",
    render: {
      fillStyle: "#00ff00",
    },
  },
);

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

// add all of the bodies to the world
Composite.add(engine.world, [boxA, boxB, ground]);

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);
