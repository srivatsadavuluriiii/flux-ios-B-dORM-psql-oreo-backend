import { p as push, n as head, l as push_element, m as pop_element, j as pop, F as FILENAME } from "../../chunks/index2.js";
_page[FILENAME] = "src/routes/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Flux Backend</title>`;
    $$payload2.out += `<meta name="description" content="Next-generation expense tracking backend"/>`;
    push_element($$payload2, "meta", 21, 2);
    pop_element();
  });
  $$payload.out += `<main class="container svelte-qaptfp">`;
  push_element($$payload, "main", 24, 0);
  $$payload.out += `<header class="svelte-qaptfp">`;
  push_element($$payload, "header", 25, 2);
  $$payload.out += `<h1 class="svelte-qaptfp">`;
  push_element($$payload, "h1", 26, 4);
  $$payload.out += `🚀 Flux Backend</h1>`;
  pop_element();
  $$payload.out += ` <p>`;
  push_element($$payload, "p", 27, 4);
  $$payload.out += `Next-generation expense tracking backend with AI, IoT, and blockchain integration</p>`;
  pop_element();
  $$payload.out += `</header>`;
  pop_element();
  $$payload.out += ` <section class="status">`;
  push_element($$payload, "section", 30, 2);
  $$payload.out += `<h2>`;
  push_element($$payload, "h2", 31, 4);
  $$payload.out += `System Status</h2>`;
  pop_element();
  $$payload.out += ` `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p>`;
    push_element($$payload, "p", 33, 6);
    $$payload.out += `Loading system status...</p>`;
    pop_element();
  }
  $$payload.out += `<!--]--></section>`;
  pop_element();
  $$payload.out += ` <section class="api-info svelte-qaptfp">`;
  push_element($$payload, "section", 58, 2);
  $$payload.out += `<h2>`;
  push_element($$payload, "h2", 59, 4);
  $$payload.out += `API Endpoints</h2>`;
  pop_element();
  $$payload.out += ` <ul class="svelte-qaptfp">`;
  push_element($$payload, "ul", 60, 4);
  $$payload.out += `<li class="svelte-qaptfp">`;
  push_element($$payload, "li", 61, 6);
  $$payload.out += `<code class="svelte-qaptfp">`;
  push_element($$payload, "code", 61, 10);
  $$payload.out += `GET /api/health</code>`;
  pop_element();
  $$payload.out += ` - System health check</li>`;
  pop_element();
  $$payload.out += ` <li class="svelte-qaptfp">`;
  push_element($$payload, "li", 62, 6);
  $$payload.out += `<code class="svelte-qaptfp">`;
  push_element($$payload, "code", 62, 10);
  $$payload.out += `HEAD /api/health</code>`;
  pop_element();
  $$payload.out += ` - Simple health check</li>`;
  pop_element();
  $$payload.out += `</ul>`;
  pop_element();
  $$payload.out += `</section>`;
  pop_element();
  $$payload.out += `</main>`;
  pop_element();
  pop();
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _page as default
};
