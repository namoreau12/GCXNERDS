const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");

// Separate workers simulate serverless instances without writing local score files.
const worker = String.raw`
  const { server } = require('./server');
  const mode = process.argv[1];
  const realFetch = global.fetch;
  if (mode === 'failure') {
    global.fetch = (url, options) => {
      if (String(url).includes('/rest/v1/arcade_scores') && options?.method === 'POST') {
        return Promise.resolve(new Response('Storage unavailable', { status: 503 }));
      }
      return realFetch(url, options);
    };
  }
  server.listen(0, '127.0.0.1', async () => {
    try {
      const base = 'http://127.0.0.1:' + server.address().port;
      const daily = await realFetch(base + '/api/arcade/daily').then(r => r.json());
      let result = daily;
      let status = 200;
      if (mode !== 'read') {
        const challenge = daily.data.challenge;
        const response = await realFetch(base + '/api/arcade/scores', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: challenge.gameId, seed: challenge.seed,
            playerKey: 'gcx-storage-regression-20261024',
            playerName: 'Storage regression', score: mode === 'lower' ? 1 : 2,
            hits: 1, level: 1, durationMs: 6000
          })
        });
        result = await response.json();
        status = response.status;
      }
      console.log(JSON.stringify({ status, result }));
      server.close(() => process.exit(0));
    } catch (error) { console.error(error.message); process.exit(1); }
  });
`;

function run(mode) {
  const child = spawnSync(process.execPath, ["-e", worker, mode], {
    cwd: require("node:path").join(__dirname, ".."),
    env: { ...process.env, GCX_DISABLE_LOCAL_WRITES: "true" },
    encoding: "utf8",
    timeout: 30000,
  });
  assert.equal(child.status, 0, child.stderr);
  return JSON.parse(child.stdout.trim().split(/\r?\n/).at(-1));
}

const failure = run("failure");
assert.equal(failure.status, 503);
assert.match(failure.result.error, /could not be saved/);
const saved = run("save");
assert.equal(saved.status, 201);
const reloaded = run("read");
assert.equal(reloaded.result.data.leaderboard.find(row => row.playerName === "Storage regression")?.score, 2);
const lower = run("lower");
assert.equal(lower.status, 201);
assert.equal(lower.result.data.leaderboard.find(row => row.playerName === "Storage regression")?.score, 2);
console.log("Passed: save failure returns 503, score survives a new server process, lower score preserves best.");
