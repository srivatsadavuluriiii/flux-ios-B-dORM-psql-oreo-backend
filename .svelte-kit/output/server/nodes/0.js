

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.BA2aH06z.js","_app/immutable/chunks/C9u5aXvY.js","_app/immutable/chunks/afGwa9RP.js"];
export const stylesheets = [];
export const fonts = [];
