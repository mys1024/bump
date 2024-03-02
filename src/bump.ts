import { parse } from "@std/semver";
import { gray, green } from "@std/fmt/colors";
import { increment } from "@std/semver/increment";
import { format } from "@std/semver/format";
import enquirer from "enquirer";
import { getCurrentVersion, run, setCurrentVersion } from "./utils.ts";

export async function bump() {
  // get current version
  const { version: currentVer, file } = await getCurrentVersion();
  if (!currentVer) {
    console.error(`Could not read the version from ${file}`);
    Deno.exit(-1);
  }

  // select next version
  const currentSemver = parse(currentVer);
  const patchVer = format(increment(currentSemver, "patch"));
  const minorVer = format(increment(currentSemver, "minor"));
  const majorVer = format(increment(currentSemver, "major"));
  const { nextVersion } = await enquirer.prompt<{ nextVersion: string }>(
    {
      type: "select",
      name: "nextVersion",
      message: `Current version ${green(currentVer)} »`,
      choices: [
        {
          name: patchVer,
          message: `          Patch ${patchVer}`,
        },
        {
          name: minorVer,
          message: `          Minor ${minorVer}`,
        },
        {
          name: majorVer,
          message: `          Major ${majorVer}`,
        },
        {
          name: "cancel",
          message: `          Cancel`,
        },
      ],
    },
  );
  if (nextVersion === "cancel") {
    Deno.exit(0);
  }

  // print info
  console.log();
  console.log(`             ${gray("from")} ${currentVer}`);
  console.log(`               ${gray("to")} ${green(nextVersion)}`);
  // console.log();
  // console.log(`           ${gray("commit")} release: v${nextVersion}`);
  // console.log(`              ${gray("tag")} v${nextVersion}`);
  console.log();

  // confirm
  const { bump } = await enquirer.prompt<{ bump: boolean }>({
    type: "confirm",
    name: "bump",
    initial: true,
    message: "Bump?",
    skip: nextVersion === "cancel",
  });
  if (!bump) {
    Deno.exit(0);
  }
  console.log();

  // update version
  await setCurrentVersion(nextVersion);
  console.log(`${green("√")} Updated ${file}`);

  // git commit
  await run("git", ["add", "."]);
  await run("git", ["commit", "-m", `release: v${nextVersion}`]);
  console.log(`${green("√")} Git commit`);

  // git tag
  await run("git", ["tag", `v${nextVersion}`]);
  console.log(`${green("√")} Git tag`);

  // git push
  await run("git", ["push"]);
  await run("git", ["push", "origin", `v${nextVersion}`]);
  console.log(`${green("√")} Git push`);

  Deno.exit(0);
}
