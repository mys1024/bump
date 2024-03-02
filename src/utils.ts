import { execa } from "execa";

export async function getCurrentVersion() {
  const filePath = "deno.json";
  const file = await Deno.readTextFile(filePath);
  const version = JSON.parse(file).version as string | undefined;
  return {
    file: filePath,
    version,
  };
}

export async function setCurrentVersion(version: string) {
  const filePath = "deno.json";
  const file = await Deno.readTextFile(filePath);
  const fileJson = JSON.parse(file);
  fileJson.version = version;
  await Deno.writeTextFile(
    filePath,
    JSON.stringify(fileJson, undefined, 2) + "\n",
  );
}

export async function run(command: string, args: string[] = []) {
  const { stderr, failed } = await execa(command, args);
  if (failed) {
    console.error(stderr);
    Deno.exit(-1);
  }
}
