import{d as T,r as p,o as K,q as y,g as i,c,a,f as l,l as b,w as M,v as S,t as q,F as Y,j as x,e as v,n as I,h as e,_ as C}from"./index-9D5d5A6B.js";class D{tutorialToken=null;TUTORIAL_PASSWORD="jisoo521";setTutorialToken(d){this.tutorialToken=d,localStorage.setItem("tutorial_token",d)}getTutorialToken(){return this.tutorialToken||(this.tutorialToken=localStorage.getItem("tutorial_token")),this.tutorialToken}clearTutorialToken(){this.tutorialToken=null,localStorage.removeItem("tutorial_token")}verifyTutorialPassword(d){return d===this.TUTORIAL_PASSWORD}isAuthenticated(){return this.getTutorialToken()===this.TUTORIAL_PASSWORD}}const g=new D,O={class:"tutorial-view"},A={class:"container"},P={key:0,class:"login-section"},W={class:"login-card"},L={class:"form-group"},N=["disabled"],R=["disabled"],U={key:0},$={key:1},E={key:0,class:"error-message"},J={key:1,class:"tutorial-section"},j={class:"tutorial-content"},B={class:"tutorial-nav"},F={class:"nav-list"},z=["onClick"],G={class:"nav-icon"},H={class:"nav-text"},Q={class:"tutorial-main"},X={key:0,class:"content-section"},Z={key:1,class:"content-section"},aa={key:2,class:"content-section"},ta={key:3,class:"content-section"},ca={key:4,class:"content-section"},ea={key:5,class:"content-section"},da=T({__name:"TutorialView",setup(k){const d=p(!1),o=p(""),u=p(!1),r=p(null),s=p("introduction"),m=async()=>{if(!o.value.trim()){r.value="请输入访问密码";return}u.value=!0,r.value=null;try{g.verifyTutorialPassword(o.value)?(g.setTutorialToken(o.value),d.value=!0,y(()=>{f()})):r.value="密码错误"}catch{r.value="验证失败"}finally{u.value=!1}},_=()=>{g.clearTutorialToken(),d.value=!1,o.value="",s.value="introduction"},w=h=>{s.value=h,y(()=>{i.fromTo(".content-section",{opacity:0,y:30},{opacity:1,y:0,duration:.6,ease:"power2.out"})})};K(()=>{g.isAuthenticated()?(d.value=!0,y(()=>{f()})):y(()=>{i.fromTo(".login-card",{opacity:0,scale:.9,y:50},{opacity:1,scale:1,y:0,duration:.8,ease:"back.out(1.7)"})})});const f=()=>{i.fromTo(".page-title",{opacity:0,y:-30},{opacity:1,y:0,duration:.8,ease:"power2.out"}),i.fromTo(".nav-item",{opacity:0,x:-30},{opacity:1,x:0,duration:.6,stagger:.1,ease:"power2.out",delay:.2}),i.fromTo(".content-section",{opacity:0,y:30},{opacity:1,y:0,duration:.8,ease:"power2.out",delay:.4}),i.fromTo(".feature-card",{opacity:0,scale:.9},{opacity:1,scale:1,duration:.6,stagger:.1,ease:"back.out(1.7)",delay:.6}),i.fromTo(".step-card",{opacity:0,x:-50},{opacity:1,x:0,duration:.6,stagger:.2,ease:"power2.out",delay:.8})},V=[{id:"introduction",title:"简介",icon:"📚"},{id:"setup",title:"环境设置",icon:"⚙️"},{id:"basic-operations",title:"基础操作",icon:"🔧"},{id:"advanced-features",title:"高级特性",icon:"🚀"},{id:"best-practices",title:"最佳实践",icon:"💡"},{id:"examples",title:"实战示例",icon:"💻"}];return(h,t)=>(e(),c("div",O,[a("div",A,[d.value?(e(),c("div",J,[a("div",{class:"tutorial-header"},[t[2]||(t[2]=a("div",{class:"header-left"},[a("h1",{class:"page-title"},"Cloudflare KV 教程"),a("p",{class:"page-subtitle"},"全面掌握 Cloudflare Key-Value 存储的使用")],-1)),a("div",{class:"header-right"},[a("button",{onClick:_,class:"logout-btn"},"退出")])]),a("div",j,[a("nav",B,[t[3]||(t[3]=a("h3",{class:"nav-title"},"目录",-1)),a("ul",F,[(e(),c(Y,null,x(V,n=>a("li",{key:n.id,class:I(["nav-item",{active:s.value===n.id}]),onClick:sa=>w(n.id)},[a("span",G,q(n.icon),1),a("span",H,q(n.title),1)],10,z)),64))])]),a("main",Q,[s.value==="introduction"?(e(),c("div",X,t[4]||(t[4]=[v('<h2 class="section-title" data-v-45d987cc>📚 Cloudflare KV 简介</h2><div class="intro-card" data-v-45d987cc><h3 data-v-45d987cc>什么是 Cloudflare KV？</h3><p data-v-45d987cc> Cloudflare KV (Key-Value) 是一个全球分布式的键值存储系统，专为高性能和低延迟而设计。它允许你在 Cloudflare 的边缘网络中存储和检索数据。 </p></div><div class="features-grid" data-v-45d987cc><div class="feature-card" data-v-45d987cc><div class="feature-icon" data-v-45d987cc>🌍</div><h4 data-v-45d987cc>全球分布</h4><p data-v-45d987cc>数据在全球 200+ 个数据中心中复制，确保低延迟访问</p></div><div class="feature-card" data-v-45d987cc><div class="feature-icon" data-v-45d987cc>⚡</div><h4 data-v-45d987cc>高性能</h4><p data-v-45d987cc>亚毫秒级的读取性能，适合高频访问的数据</p></div><div class="feature-card" data-v-45d987cc><div class="feature-icon" data-v-45d987cc>💰</div><h4 data-v-45d987cc>成本效益</h4><p data-v-45d987cc>按使用量付费，免费套餐包含 100,000 次读取操作</p></div><div class="feature-card" data-v-45d987cc><div class="feature-icon" data-v-45d987cc>🔧</div><h4 data-v-45d987cc>易于使用</h4><p data-v-45d987cc>简单的 API 接口，与 Workers 无缝集成</p></div></div><div class="use-cases" data-v-45d987cc><h3 data-v-45d987cc>常见使用场景</h3><ul class="use-case-list" data-v-45d987cc><li data-v-45d987cc><strong data-v-45d987cc>配置存储：</strong>应用程序配置、功能开关</li><li data-v-45d987cc><strong data-v-45d987cc>缓存数据：</strong>API 响应、计算结果缓存</li><li data-v-45d987cc><strong data-v-45d987cc>用户数据：</strong>用户偏好设置、会话数据</li><li data-v-45d987cc><strong data-v-45d987cc>内容管理：</strong>静态内容、模板数据</li><li data-v-45d987cc><strong data-v-45d987cc>计数器：</strong>访问统计、限流计数</li></ul></div>',4)]))):l("",!0),s.value==="setup"?(e(),c("div",Z,t[5]||(t[5]=[v(`<h2 class="section-title" data-v-45d987cc>⚙️ 环境设置</h2><div class="setup-steps" data-v-45d987cc><div class="step-card" data-v-45d987cc><div class="step-number" data-v-45d987cc>1</div><div class="step-content" data-v-45d987cc><h3 data-v-45d987cc>创建 Cloudflare 账户</h3><p data-v-45d987cc> 访问 <a href="https://cloudflare.com" target="_blank" class="external-link" data-v-45d987cc>cloudflare.com</a> 注册免费账户 </p></div></div><div class="step-card" data-v-45d987cc><div class="step-number" data-v-45d987cc>2</div><div class="step-content" data-v-45d987cc><h3 data-v-45d987cc>安装 Wrangler CLI</h3><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>npm install -g wrangler</code></pre></div><p data-v-45d987cc>Wrangler 是 Cloudflare Workers 的官方 CLI 工具</p></div></div><div class="step-card" data-v-45d987cc><div class="step-number" data-v-45d987cc>3</div><div class="step-content" data-v-45d987cc><h3 data-v-45d987cc>登录 Wrangler</h3><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>wrangler login</code></pre></div><p data-v-45d987cc>这将打开浏览器进行身份验证</p></div></div><div class="step-card" data-v-45d987cc><div class="step-number" data-v-45d987cc>4</div><div class="step-content" data-v-45d987cc><h3 data-v-45d987cc>创建 KV 命名空间</h3><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>wrangler kv:namespace create &quot;MY_KV&quot;</code></pre></div><p data-v-45d987cc>记录返回的命名空间 ID，稍后会用到</p></div></div></div><div class="config-example" data-v-45d987cc><h3 data-v-45d987cc>wrangler.toml 配置示例</h3><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>name = &quot;my-worker&quot;
main = &quot;src/index.js&quot;
compatibility_date = &quot;2024-01-15&quot;

[[kv_namespaces]]
binding = &quot;MY_KV&quot;
id = &quot;your-namespace-id-here&quot;
preview_id = &quot;your-preview-namespace-id-here&quot;</code></pre></div></div>`,3)]))):l("",!0),s.value==="basic-operations"?(e(),c("div",aa,t[6]||(t[6]=[v(`<h2 class="section-title" data-v-45d987cc>🔧 基础操作</h2><div class="operation-section" data-v-45d987cc><h3 data-v-45d987cc>📝 写入数据 (PUT)</h3><p data-v-45d987cc>向 KV 存储中写入键值对数据</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 在 Worker 中写入数据
await MY_KV.put(&quot;user:123&quot;, JSON.stringify({
  name: &quot;张三&quot;,
  email: &quot;zhangsan@example.com&quot;,
  created: new Date().toISOString()
}));

// 写入带过期时间的数据
await MY_KV.put(&quot;session:abc123&quot;, &quot;session-data&quot;, {
  expirationTtl: 3600 // 1小时后过期
});</code></pre></div></div><div class="operation-section" data-v-45d987cc><h3 data-v-45d987cc>📖 读取数据 (GET)</h3><p data-v-45d987cc>从 KV 存储中读取数据</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 读取字符串数据
const userData = await MY_KV.get(&quot;user:123&quot;);
if (userData) {
  const user = JSON.parse(userData);
  console.log(user.name); // &quot;张三&quot;
}

// 直接读取为 JSON
const user = await MY_KV.get(&quot;user:123&quot;, &quot;json&quot;);

// 读取为 ArrayBuffer
const binaryData = await MY_KV.get(&quot;file:image.jpg&quot;, &quot;arrayBuffer&quot;);</code></pre></div></div><div class="operation-section" data-v-45d987cc><h3 data-v-45d987cc>🗑️ 删除数据 (DELETE)</h3><p data-v-45d987cc>从 KV 存储中删除指定的键</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 删除单个键
await MY_KV.delete(&quot;user:123&quot;);

// 批量删除
const keysToDelete = [&quot;user:123&quot;, &quot;user:456&quot;, &quot;user:789&quot;];
await Promise.all(keysToDelete.map(key =&gt; MY_KV.delete(key)));</code></pre></div></div><div class="operation-section" data-v-45d987cc><h3 data-v-45d987cc>📋 列出键 (LIST)</h3><p data-v-45d987cc>列出 KV 存储中的键</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 列出所有键
const allKeys = await MY_KV.list();
console.log(allKeys.keys); // 键的数组

// 按前缀过滤
const userKeys = await MY_KV.list({ prefix: &quot;user:&quot; });

// 分页列出
const firstPage = await MY_KV.list({ limit: 10 });
const nextPage = await MY_KV.list({
  limit: 10,
  cursor: firstPage.cursor
});</code></pre></div></div>`,5)]))):l("",!0),s.value==="advanced-features"?(e(),c("div",ta,t[7]||(t[7]=[v(`<h2 class="section-title" data-v-45d987cc>🚀 高级特性</h2><div class="feature-section" data-v-45d987cc><h3 data-v-45d987cc>⏰ 数据过期 (TTL)</h3><p data-v-45d987cc>KV 支持自动过期功能，可以设置数据的生存时间</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 设置绝对过期时间 (Unix 时间戳)
const expireAt = Math.floor(Date.now() / 1000) + 3600; // 1小时后
await MY_KV.put(&quot;temp-data&quot;, &quot;value&quot;, { expiration: expireAt });

// 设置相对过期时间 (秒)
await MY_KV.put(&quot;cache-data&quot;, &quot;value&quot;, { expirationTtl: 1800 }); // 30分钟</code></pre></div></div><div class="feature-section" data-v-45d987cc><h3 data-v-45d987cc>🏷️ 元数据存储</h3><p data-v-45d987cc>每个键可以存储额外的元数据信息</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 写入带元数据的数据
await MY_KV.put(&quot;user:123&quot;, userData, {
  metadata: {
    version: &quot;1.0&quot;,
    lastModified: new Date().toISOString(),
    tags: [&quot;user&quot;, &quot;active&quot;]
  }
});

// 读取时获取元数据
const result = await MY_KV.getWithMetadata(&quot;user:123&quot;);
console.log(result.value);    // 数据内容
console.log(result.metadata); // 元数据对象</code></pre></div></div><div class="feature-section" data-v-45d987cc><h3 data-v-45d987cc>🔄 条件写入</h3><p data-v-45d987cc>使用 ETag 实现乐观锁，避免并发写入冲突</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 读取数据和 ETag
const result = await MY_KV.getWithMetadata(&quot;counter&quot;);
const currentValue = parseInt(result.value || &quot;0&quot;);
const etag = result.metadata?.etag;

// 条件更新
try {
  await MY_KV.put(&quot;counter&quot;, (currentValue + 1).toString(), {
    metadata: { etag }
  });
} catch (error) {
  // 处理并发冲突
  console.log(&quot;数据已被其他进程修改&quot;);
}</code></pre></div></div><div class="feature-section" data-v-45d987cc><h3 data-v-45d987cc>📊 批量操作</h3><p data-v-45d987cc>高效处理多个键值对操作</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 批量写入
const operations = [
  MY_KV.put(&quot;key1&quot;, &quot;value1&quot;),
  MY_KV.put(&quot;key2&quot;, &quot;value2&quot;),
  MY_KV.put(&quot;key3&quot;, &quot;value3&quot;)
];
await Promise.all(operations);

// 批量读取
const keys = [&quot;key1&quot;, &quot;key2&quot;, &quot;key3&quot;];
const values = await Promise.all(
  keys.map(key =&gt; MY_KV.get(key))
);</code></pre></div></div>`,5)]))):l("",!0),s.value==="best-practices"?(e(),c("div",ca,t[8]||(t[8]=[v(`<h2 class="section-title" data-v-45d987cc>💡 最佳实践</h2><div class="practice-section" data-v-45d987cc><h3 data-v-45d987cc>🔑 键命名规范</h3><div class="practice-card good" data-v-45d987cc><h4 data-v-45d987cc>✅ 推荐做法</h4><ul data-v-45d987cc><li data-v-45d987cc>使用有意义的前缀：<code data-v-45d987cc>user:123</code>, <code data-v-45d987cc>cache:api:users</code></li><li data-v-45d987cc>保持键名简短但描述性强</li><li data-v-45d987cc>使用一致的分隔符（如冒号）</li><li data-v-45d987cc>避免特殊字符和空格</li></ul></div><div class="practice-card bad" data-v-45d987cc><h4 data-v-45d987cc>❌ 避免做法</h4><ul data-v-45d987cc><li data-v-45d987cc>过长的键名（超过 512 字节）</li><li data-v-45d987cc>包含敏感信息的键名</li><li data-v-45d987cc>随机或无意义的键名</li><li data-v-45d987cc>频繁变化的键名模式</li></ul></div></div><div class="practice-section" data-v-45d987cc><h3 data-v-45d987cc>📈 性能优化</h3><div class="tip-card" data-v-45d987cc><h4 data-v-45d987cc>缓存策略</h4><p data-v-45d987cc>合理设置 TTL，避免存储过期数据</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 根据数据更新频率设置不同的 TTL
await MY_KV.put(&quot;config&quot;, data, { expirationTtl: 86400 }); // 配置数据：1天
await MY_KV.put(&quot;cache&quot;, data, { expirationTtl: 3600 });   // 缓存数据：1小时</code></pre></div></div><div class="tip-card" data-v-45d987cc><h4 data-v-45d987cc>数据压缩</h4><p data-v-45d987cc>对大型数据进行压缩以节省存储空间</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 压缩 JSON 数据
const compressed = JSON.stringify(data);
await MY_KV.put(&quot;large-data&quot;, compressed);</code></pre></div></div></div><div class="practice-section" data-v-45d987cc><h3 data-v-45d987cc>🛡️ 安全考虑</h3><div class="security-tips" data-v-45d987cc><div class="security-tip" data-v-45d987cc><h4 data-v-45d987cc>🔐 数据加密</h4><p data-v-45d987cc>敏感数据在存储前进行加密</p></div><div class="security-tip" data-v-45d987cc><h4 data-v-45d987cc>🚫 访问控制</h4><p data-v-45d987cc>使用 Worker 实现访问权限验证</p></div><div class="security-tip" data-v-45d987cc><h4 data-v-45d987cc>📝 审计日志</h4><p data-v-45d987cc>记录重要操作的日志信息</p></div></div></div>`,4)]))):l("",!0),s.value==="examples"?(e(),c("div",ea,t[9]||(t[9]=[v(`<h2 class="section-title" data-v-45d987cc>💻 实战示例</h2><div class="example-section" data-v-45d987cc><h3 data-v-45d987cc>📚 示例 1：用户会话管理</h3><p data-v-45d987cc>实现一个简单的用户会话存储系统</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 创建会话
async function createSession(userId, sessionData) {
  const sessionId = crypto.randomUUID();
  const session = {
    userId,
    ...sessionData,
    createdAt: new Date().toISOString()
  };

  await MY_KV.put(\`session:\${sessionId}\`, JSON.stringify(session), {
    expirationTtl: 86400 // 24小时过期
  });

  return sessionId;
}

// 验证会话
async function validateSession(sessionId) {
  const sessionData = await MY_KV.get(\`session:\${sessionId}\`);
  return sessionData ? JSON.parse(sessionData) : null;
}

// 删除会话
async function destroySession(sessionId) {
  await MY_KV.delete(\`session:\${sessionId}\`);
}</code></pre></div></div><div class="example-section" data-v-45d987cc><h3 data-v-45d987cc>🔢 示例 2：访问计数器</h3><p data-v-45d987cc>实现一个分布式访问计数器</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 增加访问计数
async function incrementCounter(key) {
  const current = await MY_KV.get(\`counter:\${key}\`);
  const count = parseInt(current || &quot;0&quot;) + 1;

  await MY_KV.put(\`counter:\${key}\`, count.toString());
  return count;
}

// 获取计数
async function getCounter(key) {
  const count = await MY_KV.get(\`counter:\${key}\`);
  return parseInt(count || &quot;0&quot;);
}

// 重置计数器
async function resetCounter(key) {
  await MY_KV.delete(\`counter:\${key}\`);
}</code></pre></div></div><div class="example-section" data-v-45d987cc><h3 data-v-45d987cc>⚙️ 示例 3：配置管理</h3><p data-v-45d987cc>动态配置管理系统</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>// 获取配置
async function getConfig(key, defaultValue = null) {
  const config = await MY_KV.get(\`config:\${key}\`);
  return config ? JSON.parse(config) : defaultValue;
}

// 更新配置
async function updateConfig(key, value) {
  await MY_KV.put(\`config:\${key}\`, JSON.stringify({
    value,
    updatedAt: new Date().toISOString()
  }));
}

// 批量获取配置
async function getBatchConfig(keys) {
  const configs = await Promise.all(
    keys.map(async key =&gt; {
      const value = await getConfig(key);
      return { key, value };
    })
  );

  return Object.fromEntries(
    configs.map(({ key, value }) =&gt; [key, value])
  );
}</code></pre></div></div><div class="example-section" data-v-45d987cc><h3 data-v-45d987cc>🎯 完整的 Worker 示例</h3><p data-v-45d987cc>一个完整的 Cloudflare Worker 示例，展示 KV 的综合使用</p><div class="code-block" data-v-45d987cc><pre data-v-45d987cc><code data-v-45d987cc>export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API 路由处理
    if (path.startsWith(&#39;/api/&#39;)) {
      return handleAPI(request, env);
    }

    // 静态资源缓存
    return handleStatic(request, env);
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  const method = request.method;

  if (method === &#39;GET&#39; &amp;&amp; url.pathname === &#39;/api/data&#39;) {
    // 从 KV 读取数据
    const data = await env.MY_KV.get(&#39;api-data&#39;);
    return new Response(data || &#39;{}&#39;, {
      headers: { &#39;Content-Type&#39;: &#39;application/json&#39; }
    });
  }

  if (method === &#39;POST&#39; &amp;&amp; url.pathname === &#39;/api/data&#39;) {
    // 写入数据到 KV
    const body = await request.text();
    await env.MY_KV.put(&#39;api-data&#39;, body);
    return new Response(&#39;OK&#39;);
  }

  return new Response(&#39;Not Found&#39;, { status: 404 });
}</code></pre></div></div>`,5)]))):l("",!0)])])])):(e(),c("div",P,[a("div",W,[t[1]||(t[1]=a("div",{class:"login-header"},[a("div",{class:"tutorial-icon"},"📖"),a("h1",{class:"login-title"},"Cloudflare KV 教程"),a("p",{class:"login-subtitle"},"请输入访问密码以查看教程内容")],-1)),a("form",{onSubmit:b(m,["prevent"]),class:"login-form"},[a("div",L,[M(a("input",{"onUpdate:modelValue":t[0]||(t[0]=n=>o.value=n),type:"password",placeholder:"访问密码",class:"form-input",disabled:u.value},null,8,N),[[S,o.value]])]),a("button",{type:"submit",class:"login-btn",disabled:u.value||!o.value.trim()},[u.value?(e(),c("span",U,"验证中...")):(e(),c("span",$,"进入教程"))],8,R)],32),r.value?(e(),c("div",E,q(r.value),1)):l("",!0)])]))])]))}}),na=C(da,[["__scopeId","data-v-45d987cc"]]);export{na as default};
