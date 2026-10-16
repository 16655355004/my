(async () => {
  const { default: assert } = await import('node:assert/strict');
  const { build } = await import('esbuild');
  const result = await build({
    entryPoints: ['src/services/apiKeyService.ts'], bundle: true, platform: 'node',
    format: 'cjs', write: false, define: { 'import.meta.env.VITE_API_BASE_URL': '""' },
  });
  const module = { exports: {} };
  new Function('module', 'exports', result.outputFiles[0].text)(module, module.exports);
  global.localStorage = { getItem: () => 'fixture-admin' };
  const service = module.exports.default;
  const key = { id: 3, apiKey: ' fixture-deepseek ', currency: 'USD' };
  const originalFetch = global.fetch;
  try {
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://api.deepseek.com/user/balance');
      assert.equal(options.method, 'GET');
      assert.equal(options.credentials, 'omit');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers.Authorization, 'Bearer fixture-deepseek');
      return Response.json({ balance_infos: [{ currency: 'CNY', total_balance: '110.82' }] });
    };
    const balance = await service.refreshBalance(key);
    assert.equal(balance.success, true);
    assert.equal(balance.data.balance, 110.82);
    assert.equal(balance.data.currency, 'CNY');
    assert(Number.isFinite(Date.parse(balance.data.balanceUpdatedAt)));

    global.fetch = async (url, options) => {
      assert.equal(url, '/api/apikeys/3');
      assert.equal(options.method, 'PUT');
      assert.equal(options.headers.Authorization, 'Bearer fixture-admin');
      const body = JSON.parse(options.body);
      assert.equal(body.balance, 110.82);
      assert.equal('apiKey' in body, false);
      return Response.json({ success: true });
    };
    assert.equal((await service.updateApiKey(key.id, balance.data)).success, true);

    for (const status of [401, 429, 502]) {
      global.fetch = async () => new Response('<html>error</html>', { status });
      const failed = await service.refreshBalance(key);
      assert.equal(failed.success, false);
      assert(failed.error.includes(String(status)));
      assert.equal(failed.data, undefined);
    }
    for (const data of [null, {}, { balance_infos: [null] }, { balance_infos: [{ currency: 'CNY', total_balance: 'NaN' }] }]) {
      global.fetch = async () => Response.json(data);
      assert.equal((await service.refreshBalance(key)).success, false);
    }
    global.fetch = async () => { throw new TypeError('Network failure'); };
    assert.equal((await service.refreshBalance(key)).success, false);
    console.log('PASS: direct official request, credential separation, currency fallback, balance persistence payload, upstream HTTP errors, invalid responses and network failure');
  } finally {
    global.fetch = originalFetch;
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
