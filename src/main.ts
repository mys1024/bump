import { parse } from "@std/semver";
import { gray, green } from "@std/fmt/colors";
import { increment } from "@std/semver/increment";
import { format } from "@std/semver/format";
import enquirer from "enquirer";
import { getCurrentVersion, run, setCurrentVersion } from "./utils.ts";

async function main() {
  const { version: currentVer, file } = await getCurrentVersion();
  if (!currentVer) {
    console.error(`Could not read the version from ${file}`);
    Deno.exit(-1);
  }

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
    console.log("Cancelled.");
    Deno.exit(0);
  }

  console.log();
  console.log(`             ${gray("from")} ${currentVer}`);
  console.log(`               ${gray("to")} ${green(nextVersion)}`);
  // console.log();
  // console.log(`           ${gray("commit")} release: v${nextVersion}`);
  // console.log(`              ${gray("tag")} v${nextVersion}`);
  console.log();

  const { bump } = await enquirer.prompt<{ bump: boolean }>({
    type: "confirm",
    name: "bump",
    initial: true,
    message: "Bump?",
    skip: nextVersion === "cancel",
  });
  if (!bump) {
    console.log("Cancelled.");
    Deno.exit(0);
  }
  console.log();

  await setCurrentVersion(nextVersion);
  console.log(`${green("√")} Updated ${file}`);

  await run("git", ["add", "."]);
  await run("git", ["commit", "-m", `release: v${nextVersion}`]);
  console.log(`${green("√")} Git commit`);

  await run("git", ["tag", `v${nextVersion}`]);
  console.log(`${green("√")} Git tag`);

  Deno.exit(0);
}

main();
