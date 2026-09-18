const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const robots = fs.readFileSync('robots.txt', 'utf8');
const sitemap = fs.readFileSync('sitemap.xml', 'utf8');

assert.match(html, /<link rel="canonical" href="https:\/\/a2ztec\.online\/">/);
assert.match(html, /<meta name="description" content="[^"]+">/);
assert.match(html, /<meta property="og:title" content="[^"]+">/);
assert.match(html, /<script type="application\/ld\+json">/);
assert.match(html, /"@type": \["LocalBusiness", "ComputerStore"\]/);
assert.match(html, /<h1>Computer repair and CCTV service in Paranthan<\/h1>/);
assert.match(html, /Computer &amp; laptop repair/);
assert.doesNotMatch(html, /<main[^>]*>\s*<p class="loading">/);
assert.match(robots, /Sitemap: https:\/\/a2ztec\.online\/sitemap\.xml/);
assert.match(sitemap, /<loc>https:\/\/a2ztec\.online\/<\/loc>/);

console.log('SEO static checks passed');
