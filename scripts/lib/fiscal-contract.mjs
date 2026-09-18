const VALID_OPERATIONAL_STATES = new Set(["blocked", "enabled"]);
const MIGRATION_FILE_PATTERN = /^(\d{14})_.+\.sql$/;

function pushIssue(issues, code, subject) {
  issues.push({ code, subject });
}

export function extractMigrationVersions(fileNames) {
  return fileNames
    .map((fileName) => fileName.match(MIGRATION_FILE_PATTERN)?.[1] ?? null)
    .filter((version) => version !== null);
}

export function evaluateFiscalContract({
  manifest,
  localMigrationVersions = [],
  remoteMigrationVersions,
  remoteOpenApiPaths,
}) {
  const issues = [];
  const state = manifest?.operationalState;
  const requiredMigrations = manifest?.requiredRepositoryMigrations ?? [];
  const criticalObjects = [
    ...(manifest?.criticalObjects?.tablePaths ?? []),
    ...(manifest?.criticalObjects?.rpcPaths ?? []),
  ];

  if (!VALID_OPERATIONAL_STATES.has(state)) {
    pushIssue(issues, "INVALID_OPERATIONAL_STATE", String(state ?? "undefined"));
  }

  const localMigrations = new Set(localMigrationVersions);
  for (const version of requiredMigrations) {
    if (!localMigrations.has(version)) {
      pushIssue(issues, "MISSING_REPOSITORY_MIGRATION", version);
    }
  }

  if (remoteMigrationVersions !== undefined) {
    const remoteMigrations = new Set(remoteMigrationVersions);
    for (const version of requiredMigrations) {
      if (state === "blocked" && remoteMigrations.has(version)) {
        pushIssue(issues, "UNEXPECTED_REMOTE_MIGRATION", version);
      }
      if (state === "enabled" && !remoteMigrations.has(version)) {
        pushIssue(issues, "MISSING_REMOTE_MIGRATION", version);
      }
    }
  }

  if (remoteOpenApiPaths !== undefined) {
    const remotePaths = new Set(remoteOpenApiPaths);
    for (const path of criticalObjects) {
      if (state === "blocked" && remotePaths.has(path)) {
        pushIssue(issues, "UNEXPECTED_REMOTE_OBJECT", path);
      }
      if (state === "enabled" && !remotePaths.has(path)) {
        pushIssue(issues, "MISSING_REMOTE_OBJECT", path);
      }
    }
  }

  return {
    ok: issues.length === 0,
    state,
    issues,
  };
}
