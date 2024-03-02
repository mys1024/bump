import { canParse, parse } from "@std/semver";
import { gray, green } from "@std/fmt/colors";
import { increment } from "@std/semver/increment";
import { format } from "@std/semver/format";
import enquirer from "enquirer";
import { getCurrentVersion, run, setCurrentVersion } from "./utils.ts";

export async function bump() {
  // get current version
  const { version: currentVer, file } = await getCurrentVersion();
  if (!file) {
    console.error(
      `Could not find a version file. Expected: deno.json or deno.jsonc.`,
    );
    Deno.exit(-1);
  }
  if (!currentVer) {
    console.error(
      `Could not read the version from ${file}. Expected: "version" field.`,
    );
    Deno.exit(-1);
  }

  // select next version
  const currentSemver = parse(currentVer);
  const patchVer = format(increment(currentSemver, "patch"));
  const minorVer = format(increment(currentSemver, "minor"));
  const majorVer = format(increment(currentSemver, "major"));
  let { nextVersion } = await enquirer.prompt<{ nextVersion: string }>(
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
          name: "custom",
          message: `          Custom`,
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

  // custom version
  if (nextVersion === "custom") {
    const { customVersion } = await enquirer.prompt<{ customVersion: string }>({
      type: "input",
      name: "customVersion",
      message: "Enter a custom version",
      initial: currentVer,
    });
    if (!canParse(customVersion)) {
      console.error(`Invalid version: "${customVersion}".`);
      Deno.exit(-1);
    }
    nextVersion = customVersion;
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
  await setCurrentVersion(file, nextVersion);
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
