// Semver comparison for migration ordering.
// Accepts major.minor.patch with optional -prerelease suffix (e.g. 0.3.2-dev).

export function parseSemver(v) {
  const raw = String(v).trim();
  const dash = raw.indexOf('-');
  const base = dash === -1 ? raw : raw.slice(0, dash);
  const prerelease = dash === -1 ? null : raw.slice(dash + 1);
  const parts = base.split('.');
  if (parts.length !== 3) throw new Error(`Invalid semver: ${v}`);
  const [major, minor, patch] = parts.map(Number);
  if ([major, minor, patch].some(isNaN)) throw new Error(`Invalid semver: ${v}`);
  return { major, minor, patch, prerelease };
}

export function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;
  // Same numeric triple: release beats prerelease; two prereleases lexicographic.
  if (pa.prerelease === pb.prerelease) return 0;
  if (pa.prerelease === null) return 1;
  if (pb.prerelease === null) return -1;
  return pa.prerelease.localeCompare(pb.prerelease);
}

// Returns true if version `v` is in the range (low, high] (exclusive low, inclusive high).
export function inPendingRange(v, low, high) {
  return compareSemver(v, low) > 0 && compareSemver(v, high) <= 0;
}

export function sortVersions(versions) {
  return [...versions].sort(compareSemver);
}
