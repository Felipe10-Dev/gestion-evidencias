const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const SRC_DIR = path.join(projectRoot, "src");

const isJsFile = (filePath) => filePath.endsWith(".js");

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && isJsFile(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
};

const readText = (filePath) => fs.readFileSync(filePath, "utf8");

const extractImports = (code) => {
  const specs = new Set();

  // require('...')
  for (const match of code.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)) {
    specs.add(match[1]);
  }

  // import ... from '...'
  for (const match of code.matchAll(/from\s+["']([^"']+)["']/g)) {
    specs.add(match[1]);
  }

  // import('...')
  for (const match of code.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) {
    specs.add(match[1]);
  }

  return [...specs];
};

const resolveModule = (fromFile, spec) => {
  // Only track local relative imports.
  if (!spec.startsWith("./") && !spec.startsWith("../")) {
    return null;
  }

  const fromDir = path.dirname(fromFile);
  const base = path.resolve(fromDir, spec);

  const candidates = [
    base,
    `${base}.js`,
    path.join(base, "index.js"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.normalize(candidate);
    }
  }

  return null;
};

const rel = (filePath) => path.relative(projectRoot, filePath).replace(/\\/g, "/");

const buildGraph = (allFiles) => {
  const graph = new Map();

  for (const filePath of allFiles) {
    const code = readText(filePath);
    const specs = extractImports(code);
    const deps = specs
      .map((s) => resolveModule(filePath, s))
      .filter(Boolean);

    graph.set(path.normalize(filePath), deps);
  }

  return graph;
};

const traverse = (graph, roots) => {
  const visited = new Set();
  const stack = roots.slice();

  while (stack.length) {
    const current = path.normalize(stack.pop());
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = graph.get(current) || [];
    for (const dep of deps) {
      if (graph.has(dep) && !visited.has(dep)) {
        stack.push(dep);
      }
    }
  }

  return visited;
};

const main = () => {
  const srcFiles = walk(SRC_DIR);
  const rootFiles = [
    path.join(projectRoot, "server.js"),
    path.join(projectRoot, "expressApp.js"),
  ].filter((p) => fs.existsSync(p));

  const allFiles = [...new Set([...srcFiles, ...rootFiles].map((p) => path.normalize(p)))];
  const graph = buildGraph(allFiles);

  const reachable = traverse(graph, rootFiles.map((p) => path.normalize(p)));

  const candidates = srcFiles
    .map((p) => path.normalize(p))
    .filter((p) => !reachable.has(p))
    .sort((a, b) => rel(a).localeCompare(rel(b)));

  console.log(JSON.stringify({
    roots: rootFiles.map(rel),
    totalSrcFiles: srcFiles.length,
    reachableSrcFiles: srcFiles.filter((p) => reachable.has(path.normalize(p))).length,
    unreachableSrcFiles: candidates.length,
    unreachable: candidates.map(rel),
  }, null, 2));
};

main();
