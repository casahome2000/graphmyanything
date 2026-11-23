export type DataPoint = { ts: number; value: number };

/**
 * Largest-Triangle-Three-Buckets downsampling (LTTB).
 * Preserves visual shape; target ~threshold points.
 */
export function lttb(points: DataPoint[], threshold: number): DataPoint[] {
  if (threshold < 3 || points.length <= threshold) {
    return points.slice();
  }

  const sampled: DataPoint[] = [];
  const bucketSize = (points.length - 2) / (threshold - 2);

  sampled.push(points[0]);

  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    const rangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const rangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    const rangeTo = Math.min(rangeEnd, points.length);
    const rangeFrom = Math.min(rangeStart, points.length - 1);

    let avgX = 0;
    let avgY = 0;
    const avgRangeLength = rangeTo - rangeFrom;
    for (let j = rangeFrom; j < rangeTo; j++) {
      avgX += points[j].ts;
      avgY += points[j].value;
    }
    if (avgRangeLength > 0) {
      avgX /= avgRangeLength;
      avgY /= avgRangeLength;
    } else {
      avgX = points[rangeFrom]?.ts ?? points[a].ts;
      avgY = points[rangeFrom]?.value ?? points[a].value;
    }

    let maxArea = -1;
    let maxIdx = rangeFrom;
    for (let j = rangeFrom; j < rangeTo; j++) {
      const area =
        Math.abs(
          (points[a].ts - avgX) * (points[j].value - points[a].value) -
            (points[a].ts - points[j].ts) * (avgY - points[a].value),
        ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxIdx = j;
      }
    }

    sampled.push(points[maxIdx]);
    a = maxIdx;
  }

  sampled.push(points[points.length - 1]);
  return sampled;
}