import { execa } from "execa";

const filePaths = ["deno.json", "deno.jsonc"];

export async function findVersionFile() {
  for (const filePath of filePaths) {
    try {
      await Deno.stat(filePath);
      return filePath;
    } catch {
      continue;
    }
  }
  return undefined;
}

export async function getCurrentVersion() {
  const filePath = await findVersionFile();
  if (!filePath) {
    return {
      file: undefined,
      version: undefined,
    };
  }
  const file = await Deno.readTextFile(filePath);
  const version = JSON.parse(file).version as string | undefined;
  return {
    file: filePath,
    version,
  };
}

export async function setCurrentVersion(filePath: string, version: string) {
  const file = await Deno.readTextFile(filePath);
  const fileJson = JSON.parse(file);
  fileJson.version = version;
  await Deno.writeTextFile(
    filePath,
    JSON.stringify(fileJson, undefined, 2) + "\n",
  );
}

export async function run(command: string, args: string[] = []) {
  const { stdout, stderr, failed } = await execa(command, args);
  if (failed) {
    console.error(stderr);
    Deno.exit(-1);
  }
  return stdout;
}
