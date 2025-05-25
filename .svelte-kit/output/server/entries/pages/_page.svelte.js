import { h as head, c as pop, p as push } from "../../chunks/index2.js";
function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Flux Backend</title>`;
    $$payload2.out += `<meta name="description" content="Next-generation expense tracking backend"/>`;
  });
  $$payload.out += `<main class="container svelte-qaptfp"><header class="svelte-qaptfp"><h1 class="svelte-qaptfp">🚀 Flux Backend</h1> <p>Next-generation expense tracking backend with AI, IoT, and blockchain integration</p></header> <section class="status"><h2>System Status</h2> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p>Loading system status...</p>`;
  }
  $$payload.out += `<!--]--></section> <section class="api-info svelte-qaptfp"><h2>API Endpoints</h2> <ul class="svelte-qaptfp"><li class="svelte-qaptfp"><code class="svelte-qaptfp">GET /api/health</code> - System health check</li> <li class="svelte-qaptfp"><code class="svelte-qaptfp">HEAD /api/health</code> - Simple health check</li></ul></section></main>`;
  pop();
}
export {
  _page as default
};
