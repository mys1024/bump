import { assertEquals } from "@std/assert";
import { run } from "./utils.ts";

Deno.test("run", async () => {
  assertEquals(await run("echo", ["foo"]), '"foo"');
});
