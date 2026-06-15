// Numeric semver comparison for migration ordering.
// Supports only numeric major.minor.patch (no pre-release).

export function parseSemver(v) {
  const parts = String(v).split('.');
  if (parts.length !== 3) throw new Error(`Invalid semver: ${v}`);
  const [major, minor, patch] = parts.map(Number);
  if ([major, minor, patch].some(isNaN)) throw new Error(`Invalid semver: ${v}`);
  return { major, minor, patch };
}

export function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  return pa.patch - pb.patch;
}

// Returns true if version `v` is in the range (low, high] (exclusive low, inclusive high).
export function inPendingRange(v, low, high) {
  return compareSemver(v, low) > 0 && compareSemver(v, high) <= 0;
}

export function sortVersions(versions) {
  return [...versions].sort(compareSemver);
}
