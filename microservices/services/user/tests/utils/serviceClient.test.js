describe('user serviceClient', () => {
  let client, fetchMock;
  beforeEach(() => {
    jest.resetModules();
    jest.useRealTimers();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    process.env.SERVICE_REQUEST_TIMEOUT_MS = '100';
    process.env.SERVICE_REQUEST_RETRIES = '2';
    process.env.SERVICE_RETRY_DELAY_MS = '0';
    process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD = '5';
    process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS = '100';
    delete process.env.INTERNAL_SERVICE_TOKEN;
    client = require('../../src/utils/serviceClient');
  });
  afterEach(() => { delete global.fetch; jest.useRealTimers(); });
  const response = (status, body, ok = status >= 200 && status < 300) => ({ ok, status, text: jest.fn().mockResolvedValue(body) });

  test('successful GET returns parsed JSON and normalizes trailing slash', async () => {
    fetchMock.mockResolvedValue(response(200, JSON.stringify({ success: true })));
    const r = await client.getJson('http://service/', '/health');
    expect(r).toEqual({ ok: true, status: 200, data: { success: true }, error: null, attempts: 1 });
    expect(fetchMock.mock.calls[0][0]).toBe('http://service/health');
  });
  test('invalid base URL is tolerated for circuit key', async () => { fetchMock.mockResolvedValue(response(200, '{}')); await client.getJson('not-a-url', '/x'); expect(fetchMock).toHaveBeenCalled(); });
  test('empty response body gives null data', async () => { fetchMock.mockResolvedValue(response(204, '')); const r = await client.getJson('http://service','/empty'); expect(r.data).toBeNull(); });
  test('invalid JSON is represented safely', async () => { fetchMock.mockResolvedValue(response(200, 'not json')); const r = await client.getJson('http://service','/x'); expect(r.data).toEqual({ success:false, message:'Invalid JSON response from downstream service.', raw:'not json' }); });
  test('adds internal token and request id', async () => { process.env.INTERNAL_SERVICE_TOKEN='secret-token'; fetchMock.mockResolvedValue(response(200,'{}')); await client.getJson('http://service','/x'); const opts=fetchMock.mock.calls[0][1]; expect(opts.headers['x-internal-service-token']).toBe('secret-token'); expect(opts.headers['x-request-id']).toBeDefined(); });
  test('preserves supplied request id and does not overwrite internal token', async () => { process.env.INTERNAL_SERVICE_TOKEN='env'; fetchMock.mockResolvedValue(response(200,'{}')); await client.getJson('http://service','/x',{ 'x-request-id':'req', 'x-internal-service-token':'custom' }); const h=fetchMock.mock.calls[0][1].headers; expect(h).toEqual(expect.objectContaining({ 'x-request-id':'req', 'x-internal-service-token':'custom' })); });
  test('preserves uppercase request id and content type', async () => { fetchMock.mockResolvedValue(response(200,'{}')); await client.postJson('http://service','/x',{a:1},{'X-Request-Id':'R','Content-Type':'text/plain'}); const h=fetchMock.mock.calls[0][1].headers; expect(h['X-Request-Id']).toBe('R'); expect(h['x-request-id']).toBeUndefined(); expect(h['content-type']).toBe('text/plain'); });
  test('serializes object body with default JSON content type', async () => { fetchMock.mockResolvedValue(response(200,'{}')); await client.postJson('http://service','/x',{a:1}); const o=fetchMock.mock.calls[0][1]; expect(o.body).toBe('{"a":1}'); expect(o.headers['content-type']).toBe('application/json'); });
  test('keeps string and Buffer bodies unchanged', async () => { fetchMock.mockResolvedValue(response(200,'{}')); await client.postJson('http://service','/x','raw'); expect(fetchMock.mock.calls[0][1].body).toBe('raw'); fetchMock.mockResolvedValue(response(200,'{}')); const b=Buffer.from('b'); await client.postJson('http://service','/x',b); expect(fetchMock.mock.calls[1][1].body).toBe(b); });
  test('retries safe GET on retryable status', async () => { fetchMock.mockResolvedValueOnce(response(503,'{"e":1}',false)).mockResolvedValueOnce(response(200,'{}')); const r=await client.getJson('http://retry-service','/x',{},{retries:1}); expect(r.ok).toBe(true); expect(r.attempts).toBe(2); });
  test('does not retry unsafe write unless retrySafe', async () => { fetchMock.mockResolvedValue(response(503,'{}',false)); const r=await client.postJson('http://service','/x',{a:1},{},{retries:3}); expect(r.attempts).toBe(1); expect(fetchMock).toHaveBeenCalledTimes(1); });
  test('retries unsafe write when explicitly safe', async () => { fetchMock.mockResolvedValueOnce(response(503,'{}',false)).mockResolvedValueOnce(response(200,'{}')); const r=await client.postJson('http://service','/x',{a:1},{},{retries:1,retrySafe:true}); expect(r.attempts).toBe(2); });
  test('does not retry non-retryable 4xx', async () => { fetchMock.mockResolvedValue(response(400,'{}',false)); const r=await client.getJson('http://service','/x'); expect(r.attempts).toBe(1); });
  test('retryable status exhausts attempts and records circuit failure', async () => { fetchMock.mockResolvedValue(response(503,'{}',false)); const r=await client.getJson('http://service','/x',{},{retries:1}); expect(r.ok).toBe(false); expect(r.attempts).toBe(2); });
  test('network error returns unavailable response', async () => { fetchMock.mockRejectedValue(new Error('network')); const r=await client.getJson('http://network','/x',{},{retries:0}); expect(r).toMatchObject({ok:false,status:503,data:{code:'DOWNSTREAM_UNAVAILABLE'},error:{type:'NETWORK_ERROR'},attempts:1}); });
  test('network error can retry for safe method', async () => { fetchMock.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(response(200,'{}')); const r=await client.getJson('http://network2','/x',{},{retries:1}); expect(r.ok).toBe(true); expect(r.attempts).toBe(2); });
  test('unsafe network error is not retried automatically', async () => { fetchMock.mockRejectedValue(new Error('network')); const r=await client.postJson('http://network3','/x',{}, {}, {retries:2}); expect(r.attempts).toBe(1); });
  test('timeout maps AbortError to 504', async () => { jest.useFakeTimers(); try { fetchMock.mockImplementation((_url,opts)=>new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'}))))); const p=client.getJson('http://timeout','/x',{},{retries:0}); await jest.advanceTimersByTimeAsync(100); const r=await p; expect(r.status).toBe(504); expect(r.data.code).toBe('DOWNSTREAM_TIMEOUT'); expect(r.error.type).toBe('TIMEOUT'); } finally { jest.useRealTimers(); } });
  test('convenience methods use correct HTTP methods', async () => { fetchMock.mockResolvedValue(response(200,'{}')); await client.getJson('http://methods','/g'); await client.postJson('http://methods','/p',{}); await client.putJson('http://methods','/u',{}); await client.patchJson('http://methods','/pa',{}); await client.deleteJson('http://methods','/d'); expect(fetchMock.mock.calls.map(c=>c[1].method)).toEqual(['GET','POST','PUT','PATCH','DELETE']); });
  test('circuit opens after threshold and rejects requests', async () => { fetchMock.mockRejectedValue(new Error('x')); for(let i=0;i<5;i++) await client.postJson('http://circuit','/'+i,{}); const r=await client.postJson('http://circuit','/open',{}); expect(r.status).toBe(503); expect(r.error.type).toBe('CIRCUIT_OPEN'); expect(r.attempts).toBe(0); });
  test('4xx does not trip circuit', async () => { fetchMock.mockResolvedValue(response(429,'{}',false)); for(let i=0;i<6;i++) await client.getJson('http://circuit4xx','/x'); expect(client.getCircuitStatus()['http://circuit4xx'].state).toBe('CLOSED'); });
  test('half-open success closes circuit', async () => { jest.useFakeTimers(); fetchMock.mockRejectedValue(new Error('x')); for(let i=0;i<5;i++) await client.postJson('http://half-open','/'+i,{}); jest.advanceTimersByTime(101); fetchMock.mockResolvedValue(response(200,'{}')); const r=await client.getJson('http://half-open','/recover'); expect(r.ok).toBe(true); expect(client.getCircuitStatus()['http://half-open'].state).toBe('CLOSED'); });
  test('half-open failure reopens circuit', async () => { jest.useFakeTimers(); fetchMock.mockRejectedValue(new Error('x')); for(let i=0;i<5;i++) await client.postJson('http://half-fail','/'+i,{}); jest.advanceTimersByTime(101); const r=await client.postJson('http://half-fail','/again',{}); expect(r.status).toBe(503); expect(client.getCircuitStatus()['http://half-fail'].state).toBe('OPEN'); });
  test('getCircuitStatus reports circuits', async () => { fetchMock.mockResolvedValue(response(200,'{}')); await client.getJson('http://status','/x'); expect(client.getCircuitStatus()['http://status']).toEqual(expect.objectContaining({state:'CLOSED',failures:0,openedAt:null})); });
  test('defensive fallback can be reached with NaN retries', async () => { fetchMock.mockResolvedValue(response(200,'{}')); const r=await client.getJson('http://nan','/x',{},{retries:Number.NaN}); expect(r).toMatchObject({ok:false,status:503,data:{success:false,message:'Downstream service unavailable.'},attempts:Number.NaN}); });
});
