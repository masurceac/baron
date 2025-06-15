// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

/**
 * Check if the directory contains a page or route file.
 * Adjust the check if you need to support additional filename patterns.
 */
function hasPageFile(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    return files.some(
      (file) => file.startsWith('page.') || file.startsWith('route.'),
    );
  } catch (err) {
    console.error(`Error reading ${dirPath}:`, err);
    return false;
  }
}

/**
 * Recursively parse directories starting from dirPath.
 * The baseRoute accumulates the URL path segments.
 */
function parseRoutes(dirPath, baseRoute = '') {
  let routes = [];

  // If the current directory qualifies as a route, add it.
  if (hasPageFile(dirPath)) {
    // Treat the root route as "/"
    routes.push(baseRoute === '' ? '/' : baseRoute);
  }

  // Read directory entries
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    console.error(`Error reading directory ${dirPath}:`, err);
    return routes;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const segmentName = entry.name;
      // Skip adding segment if folder is wrapped in parentheses (e.g. (auth))
      let routeSegment = '';
      if (!/^\(.*\)$/.test(segmentName)) {
        // Add a leading slash and preserve dynamic segments (e.g. [id])
        routeSegment = '/' + segmentName;
      }
      const newRoute = baseRoute + routeSegment;
      const subDir = path.join(dirPath, segmentName);
      routes = routes.concat(parseRoutes(subDir, newRoute));
    }
  }

  return routes;
}

// Assuming your Next.js "app" folder is in the same directory as this script.
const appDir = path.join(__dirname, 'src/app');

if (!fs.existsSync(appDir)) {
  console.error('App folder not found at:', appDir);
  process.exit(1);
}

const allRoutes = parseRoutes(appDir);

const ignorePrefixxes = ['app', 'auth', 'api', '[locale]'];
const updated = allRoutes
  .map((r) => {
    // remove the first / slash from the r
    return r.replace(/^\//, '').replace('[locale]/', '');
  })
  .filter((item) => !ignorePrefixxes.some((prefix) => item.startsWith(prefix)));

// Output the list of routes as JSON.
console.log(JSON.stringify(updated, null, 2));
