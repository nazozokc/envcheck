import { describe, expect, it } from "vitest";
import { validateConfig } from "../config.js";

describe("validateConfig", () => {
  it("defaults to an empty alias map", () => {
    expect(validateConfig({})).toEqual({ aliases: {} });
  });

  it("accepts a full configuration", () => {
    expect(
      validateConfig({
        defaultManager: "nix",
        aliases: { node: "nodejs" },
        autoManagers: ["nix", "apt"],
      }),
    ).toEqual({
      defaultManager: "nix",
      aliases: { node: "nodejs" },
      autoManagers: ["nix", "apt"],
    });
  });

  it("rejects a non-object document", () => {
    expect(() => validateConfig([])).toThrow("must contain an object");
  });

  it("rejects a non-string alias target", () => {
    expect(() => validateConfig({ aliases: { node: 1 } })).toThrow(
      "alias node must be a string",
    );
  });

  it("rejects a non-array autoManagers value", () => {
    expect(() => validateConfig({ autoManagers: "nix" })).toThrow(
      "autoManagers must be an array of strings",
    );
  });

  it("rejects a non-string defaultManager", () => {
    expect(() => validateConfig({ defaultManager: 1 })).toThrow(
      "defaultManager must be a string",
    );
  });
});
