// Unit tests for pipeline value calculations.
import { describe, expect, it } from "vitest";

function pipelineTotal(deals: Array<{ value: number }>) {
  return deals.reduce((sum, deal) => sum + deal.value, 0);
}

describe("deal calculations", () => {
  it("calculates pipeline total value", () => {
    expect(pipelineTotal([{ value: 10 }, { value: 25 }, { value: 15 }])).toBe(50);
  });
});
