import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scanHistory = process.argv.includes("--history");
const maximumFindings = 50;

const forbiddenArtifactNames = new Set([
  "state.json",
  "cookie.json",
  "initial-dom.html",
  "loggedin-dom.html",
  "test-login.js",
  "create-state.js",
  "generate-state.js",
  "audit.js",
]);

const textExtensions = new Set([
  "",
  ".cjs",
  ".css",
  ".env",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

function decodeJwtSegment(segment) {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function isAllowedJwt(token) {
  const payload = decodeJwtSegment(token.split(".")[1] ?? "");
  // `supabase start` always prints the same published demo keys
  // (issuer `supabase-demo`). Those are local-only defaults, not
  // hosted project credentials.
  return payload?.iss === "supabase-demo";
}

const rules = [
  {
    name: "JWT",
    pattern:
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    allow: (match) => isAllowedJwt(match[0]),
  },
  {
    name: "refresh or access token",
    pattern:
      /\b(?:refresh_token|access_token)\b\s*[:=]\s*["'][A-Za-z0-9._~-]{16,}["']/gi,
  },
  {
    name: "privileged credential",
    pattern:
      /\b(?:client_secret|service_role_key|supabase_service_role_key)\b\s*[:=]\s*["'][^"'\r\n]{8,}["']/gi,
  },
  {
    name: "hardcoded password",
    pattern: /\bpassword\b\s*[:=]\s*["']([^"'\r\n]{8,})["']/gi,
    allow: (match) => {
      const candidate = match[1].toLowerCase();
      return /(?:example|placeholder|replace|redacted|dummy|changeme|password)/.test(
        candidate,
      );
    },
  },
];

const findings = new Map();

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

function record(rule, location, target = findings) {
  if (target.size >= maximumFindings) {
    return;
  }

  target.set(`${rule}:${location}`, { rule, location });
}

function scanPath(filePath, locationPrefix = "working tree", target = findings) {
  const normalizedPath = normalizePath(filePath);
  if (forbiddenArtifactNames.has(basename(normalizedPath).toLowerCase())) {
    record("forbidden local artifact", `${locationPrefix}:${normalizedPath}`, target);
  }
}

function scanText(text, location, target = findings) {
  const lines = text.split(/\r?\n/);

  for (const [lineIndex, line] of lines.entries()) {
    if (line.includes("secret-scan: allow")) {
      continue;
    }

    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      let match;

      while ((match = rule.pattern.exec(line)) !== null) {
        if (!rule.allow?.(match)) {
          record(rule.name, `${location}:${lineIndex + 1}`, target);
        }

        if (match[0].length === 0) {
          rule.pattern.lastIndex += 1;
        }
      }
    }
  }
}

export function collectTextFindings(text, location = "test") {
  const collected = new Map();
  scanText(text, location, collected);
  return [...collected.values()];
}

function git(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
}

function scanWorkingTree() {
  const files = git(["ls-files", "-z"]).split("\0").filter(Boolean);

  for (const filePath of files) {
    if (!existsSync(filePath)) {
      continue;
    }

    scanPath(filePath);

    if (!textExtensions.has(extname(filePath).toLowerCase())) {
      continue;
    }

    const content = readFileSync(filePath);
    if (!content.includes(0)) {
      scanText(content.toString("utf8"), `working tree:${normalizePath(filePath)}`);
    }
  }
}

function scanGitHistory() {
  const historicalPaths = git([
    "log",
    "--all",
    "--full-history",
    "--name-only",
    "--pretty=format:",
  ]);

  for (const filePath of historicalPaths.split(/\r?\n/).filter(Boolean)) {
    scanPath(filePath, "history");
  }

  const patches = git([
    "log",
    "--all",
    "--full-history",
    "--patch",
    "--no-color",
    "--pretty=format:commit %H",
  ]);
  scanText(patches, "git history patch");
}

function reportFindings() {
  if (findings.size > 0) {
    console.error(`Secret scan failed with ${findings.size} finding(s):`);
    for (const finding of findings.values()) {
      console.error(`- ${finding.rule} at ${finding.location}`);
    }
    console.error("No secret values were printed. Remove the material before continuing.");
    process.exit(1);
  }

  console.log(
    scanHistory
      ? "Git history secret scan passed."
      : "Working-tree secret scan passed.",
  );
}

function isExecutedDirectly() {
  const invoked = process.argv[1];
  if (!invoked) {
    return false;
  }

  return resolve(fileURLToPath(import.meta.url)) === resolve(invoked);
}

if (isExecutedDirectly()) {
  if (scanHistory) {
    scanGitHistory();
  } else {
    scanWorkingTree();
  }

  reportFindings();
}
