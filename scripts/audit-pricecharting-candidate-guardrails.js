const assert = require("node:assert/strict");
const { platformMatchStatus, titleMatchStatus } = require("./propose-pricecharting-image-candidates");

const cases = [
  {
    platform: "3ds",
    rowTitle: "Binding of Isaac: Rebirth",
    sourceTitle: "Binding of Isaac Rebirth Playstation Vita",
    expectedTitle: "exact",
    expectedPlatform: "mismatch",
  },
  {
    platform: "switch",
    rowTitle: "Amairo Chocolate",
    sourceTitle: "Amairo Chocolate JP Nintendo Switch",
    expectedTitle: "close",
    expectedPlatform: "match",
  },
  {
    platform: "ps3",
    rowTitle: "Alone in the Dark: Inferno",
    sourceTitle: "Alone in the Dark Inferno Playstation 3",
    expectedTitle: "close",
    expectedPlatform: "match",
  },
];

for (const testCase of cases) {
  assert.equal(titleMatchStatus(testCase.rowTitle, testCase.sourceTitle), testCase.expectedTitle, `${testCase.rowTitle} title match`);
  assert.equal(platformMatchStatus(testCase.platform, testCase.sourceTitle), testCase.expectedPlatform, `${testCase.rowTitle} platform match`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checkedCases: cases.length,
      guardrail: "PriceCharting candidate matching rejects right-title/wrong-platform cover art.",
    },
    null,
    2
  )
);
