import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/components/JsonLd";

describe("serializeJsonLd", () => {
  it("escapuje </script> żeby nie domknąć tagu script", () => {
    const html = serializeJsonLd({ name: "</script><img onerror=alert(1)>" });
    expect(html).not.toContain("</script>");
    expect(html).toContain("\\u003c/script\\u003e");
  });

  it("escapuje & i znaki Unicode line/paragraph separator", () => {
    const html = serializeJsonLd({ a: "a&b", b: "x\u2028y\u2029z" });
    expect(html).toContain("\\u0026");
    expect(html).toContain("\\u2028");
    expect(html).toContain("\\u2029");
  });
});
