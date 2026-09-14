const OFFICIAL_PROJECT_ID = "prj_dErjl7LdzTL2412fsw0pyzo3bdp1";
const LEGACY_VALIDATION_PROJECT_ID = "prj_6xhfrAEbhDZCdcz4VrcVxwxlZdch";

export function evaluateDeployment({ projectId, branch }) {
  if (projectId === LEGACY_VALIDATION_PROJECT_ID) {
    return { ignore: true, reason: "legacy validation project is not an approved deployment target" };
  }

  if (projectId && projectId !== OFFICIAL_PROJECT_ID) {
    return { ignore: true, reason: "repository is linked to an unapproved Vercel project" };
  }

  if (branch === "main") {
    return { ignore: false, reason: "production branch" };
  }

  if (branch?.startsWith("preview-ready-")) {
    return { ignore: false, reason: "intentional preview snapshot" };
  }

  return { ignore: true, reason: "working branch; GitHub CI is sufficient" };
}

function runSelfTest() {
  const cases = [
    [{ projectId: OFFICIAL_PROJECT_ID, branch: "main" }, false],
    [{ projectId: OFFICIAL_PROJECT_ID, branch: "preview-ready-painel" }, false],
    [{ projectId: OFFICIAL_PROJECT_ID, branch: "fix/supabase" }, true],
    [{ projectId: OFFICIAL_PROJECT_ID, branch: "dependabot/npm_and_yarn/react" }, true],
    [{ projectId: LEGACY_VALIDATION_PROJECT_ID, branch: "main" }, true],
    [{ projectId: "prj_outro", branch: "preview-ready-painel" }, true],
  ];

  for (const [input, expectedIgnore] of cases) {
    const result = evaluateDeployment(input);
    if (result.ignore !== expectedIgnore) {
      console.error("Vercel deployment policy self-test failed", { input, expectedIgnore, result });
      process.exit(2);
    }
  }

  console.log("Vercel deployment policy self-test passed");
}

if (process.argv.includes("--self-test")) {
  runSelfTest();
} else {
  const projectId = process.env.VERCEL_PROJECT_ID ?? "";
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "";
  const decision = evaluateDeployment({ projectId, branch });

  console.log(`[vercel-deploy-policy] ${decision.ignore ? "ignore" : "build"}: ${decision.reason}`);
  process.exit(decision.ignore ? 0 : 1);
}
