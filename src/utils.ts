export const normalizeAngle = (angle: number) => {
  if (angle > Math.PI) {
    return angle - 2 * Math.PI;
  } else if (angle < -Math.PI) {
    return angle + 2 * Math.PI;
  }
  return angle;
};
