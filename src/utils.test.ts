import { assertEquals } from "@std/assert";
import { findVersionFile } from "./utils.ts";

Deno.test("utils", async (t) => {
  await t.step("findVersionFile()", async () => {
    assertEquals(await findVersionFile(), "deno.json");
  });
});
