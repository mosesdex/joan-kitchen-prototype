/**
 * Builds the Kitchen OS Blueprint documentation site from docs/saas-blueprint/*.md.
 *
 * The markdown is the source of truth; this script renders it into static pages
 * under public/blueprint/, which Vite copies into dist/ at build time. Regenerate
 * with `npm run build:blueprint`, or just `npm run build`.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const src = join(root, 'docs', 'saas-blueprint')
const out = join(root, 'public', 'blueprint')

const REPO = 'https://github.com/mosesdex/joan-kitchen-prototype'
const DEMO = 'https://mosesdex.github.io/joan-kitchen-prototype/demo'
const BUILT = '7 September 2026'

/** One-line summaries for the site index. Kept here so the markdown stays clean. */
const BLURBS = {
  '00-executive-summary':
    'The bet, the wedge, the numbers, and the four decisions that have to be made before any production code is written.',
  '01-market-and-competitors':
    'Market sizing, eighteen competitors dissected on pricing and positioning, the industry standards a 2026 platform is measured against, and the problems users still have.',
  '02-product-blueprint':
    'Product vision, target segments, six personas, the complete phased feature map, the customer journey, web and mobile strategy, analytics and customisation.',
  '03-saas-platform':
    'Multi-tenancy and isolation, the organisation lifecycle, subscriptions and billing built for Nigerian payment rails, pricing strategy, the platform admin console, and enterprise.',
  '04-automation-and-intelligence':
    'The rules engine first, then the five places AI genuinely earns its place — and the five where it does not.',
  '05-integrations':
    'Payments, messaging, accounting, delivery aggregators, hardware and the public API, sequenced by whether the product works without them.',
  '06-security-and-compliance':
    'Threat model, tenant isolation controls, the Nigeria Data Protection Act, FIRS e-invoicing, and PCI DSS 4.0 scope.',
  '07-technical-architecture':
    'The stack, the venue node and how offline actually works, the data model, the scaling path, and what carries over from the prototype.',
  '08-roadmap':
    'Six competitive positions ranked by how hard they are to copy, five phases with every feature scored on value, complexity and dependencies, and the metrics that decide whether it is working.',
  '09-sources': 'Every figure, price and claim in this blueprint, with its URL.',
}

const HERO_STATS = [
  { v: '$12.37b', cls: 'green', l: 'Nigeria foodservice, 2026', s: 'Reaching $21.38b by 2031 at 11.55% a year.' },
  { v: '70.62%', cls: 'ember', l: 'Outlets that are independents', s: 'The addressable base, still running on paper.' },
  { v: '55.92%', cls: '', l: 'Market held by quick service', s: 'Cloud kitchens grow fastest, at 12.05%.' },
  { v: '17.25%', cls: '', l: 'Growth in analytics and BI', s: 'The fastest-growing slice of restaurant software.' },
]

/* ---------------------------------------------------------------- helpers */

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)

/**
 * Plain text for a heading, for use in a contents list or a slug.
 *
 * The input is already-parsed inline HTML, so entities have to be decoded here —
 * otherwise `esc()` re-escapes the ampersand and the reader sees `&quot;`.
 */
const plain = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*|`|\*|_/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim()

/* ------------------------------------------------------------- rendering */

function renderMarkdown(markdown) {
  const headings = []
  const renderer = new marked.Renderer()

  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens)
    const id = slugify(plain(text))
    if (depth === 2 || depth === 3) headings.push({ id, text: plain(text), depth })
    if (depth === 1) return `<h1>${text}</h1>\n`
    const anchor = `<a class="anchor" href="#${id}" aria-label="Link to this section">#</a>`
    return `<h${depth} id="${id}">${anchor}${text}</h${depth}>\n`
  }

  renderer.table = function (token) {
    const header = token.header
      .map((c, i) => `<th${token.align[i] ? ` style="text-align:${token.align[i]}"` : ''}>${this.parser.parseInline(c.tokens)}</th>`)
      .join('')
    const body = token.rows
      .map(
        (row) =>
          `<tr>${row
            .map((c, i) => `<td${token.align[i] ? ` style="text-align:${token.align[i]}"` : ''}>${this.parser.parseInline(c.tokens)}</td>`)
            .join('')}</tr>`,
      )
      .join('\n')
    return `<div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>\n${body}\n</tbody></table></div>\n`
  }

  renderer.link = function ({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens)
    let target = href
    // Sibling blueprint documents become sibling pages.
    if (/^\d\d-[a-z-]+\.md(#.*)?$/.test(href)) target = href.replace('.md', '.html')
    else if (href === 'README.md') target = './'
    // Links up into the repository resolve to GitHub.
    else if (href.startsWith('../')) target = `${REPO}/blob/main/${href.replace(/^\.\.\//, '')}`
    const external = /^https?:/.test(target)
    const attrs = external ? ' target="_blank" rel="noopener"' : ''
    return `<a href="${target}"${title ? ` title="${esc(title)}"` : ''}${attrs}>${text}</a>`
  }

  const html = marked.parse(markdown, { renderer, gfm: true, breaks: false })
  return { html, headings }
}

/* ---------------------------------------------------------------- layout */

function railNav(docs, currentSlug) {
  const items = docs
    .map((d) => {
      const current = d.slug === currentSlug
      return `<li><a href="${d.slug}.html"${current ? ' aria-current="page"' : ''}><span class="i">${d.num}</span><span>${esc(d.navTitle)}</span></a></li>`
    })
    .join('\n')
  const homeCurrent = currentSlug === null ? ' aria-current="page"' : ''
  return `<p class="rail-label">Contents</p>
<nav aria-label="Blueprint contents">
  <ol>
    <li><a href="./"${homeCurrent}><span class="i">—</span><span>Overview</span></a></li>
    ${items}
  </ol>
</nav>`
}

function tocMarkup(headings) {
  const items = headings.filter((h) => h.depth === 2)
  if (items.length < 2) return ''
  return `<div class="toc">
  <p class="rail-label">On this page</p>
  <ul>
    ${items.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join('\n    ')}
  </ul>
</div>`
}

function shell({ title, description, docs, currentSlug, headings = [], body, isHome = false }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#FAF7F0">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=JetBrains+Mono:wght@400;500;700&display=swap">
<link rel="stylesheet" href="style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="shell">
  <aside class="rail">
    <a class="rail-brand" href="./">
      <span class="n">Kitchen OS <em>Blueprint</em></span>
      <span class="s">Product specification · Rev 01</span>
    </a>
    ${railNav(docs, currentSlug)}
    ${isHome ? '' : tocMarkup(headings)}
    <div class="rail-foot">
      <a href="${DEMO}" target="_blank" rel="noopener">Live prototype ↗</a>
      <a href="${REPO}" target="_blank" rel="noopener">Source on GitHub ↗</a>
      <span>Built ${BUILT}</span>
    </div>
  </aside>
  <main id="main">
${body}
  </main>
</div>
<script>
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var map = {};
  links.forEach(function (a) {
    var el = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (el) map[el.id] = a;
  });
  var seen = new Set();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) seen.add(e.target.id); else seen.delete(e.target.id);
    });
    links.forEach(function (a) { a.classList.remove('on'); });
    var first = Object.keys(map).find(function (id) { return seen.has(id); });
    if (first) map[first].classList.add('on');
  }, { rootMargin: '0px 0px -70% 0px' });
  Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
})();
</script>
</body>
</html>
`
}

function pager(docs, index) {
  const prev = index > 0 ? docs[index - 1] : null
  const next = index < docs.length - 1 ? docs[index + 1] : null
  if (!prev && !next) return ''
  const prevHtml = prev
    ? `<a class="prev" href="${prev.slug}.html"><span class="d">← ${prev.num} Previous</span><span class="t">${esc(prev.navTitle)}</span></a>`
    : '<span></span>'
  const nextHtml = next
    ? `<a class="next" href="${next.slug}.html"><span class="d">${next.num} Next →</span><span class="t">${esc(next.navTitle)}</span></a>`
    : ''
  return `<nav class="pager" aria-label="Document navigation">${prevHtml}${nextHtml}</nav>`
}

/* ------------------------------------------------------------------ home */

function homePage(docs) {
  const stats = HERO_STATS.map(
    (s) =>
      `<div class="stat"><span class="v ${s.cls}">${s.v}</span><span class="l">${s.l}</span><span class="s">${s.s}</span></div>`,
  ).join('\n      ')

  const index = docs
    .map(
      (d) =>
        `<li><a href="${d.slug}.html"><span class="i">${d.num}</span><span><span class="h">${esc(d.navTitle)}</span><span class="b">${esc(BLURBS[d.slug] ?? '')}</span></span></a></li>`,
    )
    .join('\n      ')

  const body = `    <div class="doc-head hero">
      <p class="doc-eyebrow"><span>Product specification</span><span>Rev. <b>01</b></span><span>${BUILT}</span><span>Status <b>for review</b></span></p>
      <h1>Kitchen OS <em>Blueprint</em></h1>
      <p class="standfirst">Turning a working restaurant prototype into a multi-tenant SaaS platform for the 12.37&nbsp;billion dollar Nigerian foodservice market — where seven in ten outlets still run on paper.</p>
    </div>

    <div class="content">
      <blockquote><p>Build the restaurant operating system that keeps working when the light goes, gets bank transfers reconciled without anyone staring at a banking app, and publishes its price in naira.</p></blockquote>

      <p>Nigeria&rsquo;s foodservice market is worth $12.37bn in 2026 and grows to $21.38bn by 2031, and <strong>70.62% of its outlets are independents</strong> that run on paper. The software category serving them is consolidating around fintech distribution — Moniepoint has acquired Orda, the leading local restaurant OS — which means restaurant software here is increasingly a customer-acquisition channel for payments and lending rather than a product built for the restaurant floor.</p>

      <p>Meanwhile the global platforms that do build serious product — Toast, Square, Lightspeed, TouchBistro — are architected for a card-first, always-online, US-and-EU world, and their operators&rsquo; loudest complaint is fee opacity and lock-in. The opening is a guest-experience-led, offline-first, transfer-native restaurant operating system, priced transparently in naira, that treats Nigerian payment rails and Nigerian compliance as first-class product rather than as an afterthought.</p>
    </div>

    <div class="stats">
      ${stats}
    </div>

    <div class="content">
      <h2 id="the-wedge">The wedge</h2>
      <p>Six positions we can hold that the incumbents structurally will not, ranked by how hard each is to copy: <strong>offline-first architecture</strong> as a foundation rather than a feature; <strong>transfer-native payments</strong> with a dedicated virtual account per order that reconciles itself; <strong>pricing you can read</strong>, flat per location with processing passed through at cost; <strong>Flex ordering</strong> where guest and server write the same ticket; <strong>compliance as a shipped feature</strong> ahead of the FIRS e-invoicing mandate; and <strong>loss prevention</strong> as the return-on-investment story, since 75% of restaurant shrinkage is employee theft.</p>
    </div>

    <div class="callouts">
      <div class="callout">
        <span class="k">Read first</span>
        <p>The executive summary carries the whole argument, the commercial shape, and the four decisions that cannot be deferred past phase one.</p>
        <a href="00-executive-summary.html">Executive summary →</a>
      </div>
      <div class="callout">
        <span class="k">The evidence</span>
        <p>Eighteen competitors on published pricing, three failure patterns that repeat in every market, and the problems users still have.</p>
        <a href="01-market-and-competitors.html">Market and competitors →</a>
      </div>
      <div class="callout">
        <span class="k">The plan</span>
        <p>Five phases, every feature scored on business value, technical complexity and dependencies, with the metrics that decide whether it is working.</p>
        <a href="08-roadmap.html">Roadmap →</a>
      </div>
    </div>

    <div class="content">
      <h2 id="contents">The specification</h2>
      <p>Ten documents, roughly 16,800 words. Every market figure is sourced.</p>
    </div>

    <ol class="index-list">
      ${index}
    </ol>

    <div class="content" style="margin-top: 56px;">
      <h2 id="status">Status</h2>
      <p>Draft for review, revision 01, ${BUILT}. This blueprint describes what the prototype should become; <strong>no production work begins until the prototype is approved</strong> and the four open decisions in the executive summary are settled.</p>
      <p><a href="${DEMO}" target="_blank" rel="noopener">Open the working prototype ↗</a> &nbsp;·&nbsp; <a href="${REPO}" target="_blank" rel="noopener">Source and markdown on GitHub ↗</a></p>
    </div>
`
  return shell({
    title: 'Kitchen OS Blueprint',
    description:
      'Turning the Joan Kitchen prototype into a multi-tenant restaurant SaaS for Nigeria — market, competitors, pricing, architecture and a five-phase roadmap.',
    docs,
    currentSlug: null,
    body,
    isHome: true,
  })
}

/* ------------------------------------------------------------------ build */

function build() {
  const files = readdirSync(src)
    .filter((f) => /^\d\d-.*\.md$/.test(f))
    .sort()

  const docs = files.map((file) => {
    const slug = file.replace(/\.md$/, '')
    const markdown = readFileSync(join(src, file), 'utf8')
    const h1 = markdown.match(/^#\s+(.+)$/m)
    const rawTitle = h1 ? h1[1].trim() : slug
    // "01 — Market, competitors and unsolved problems" → num "01", title after the dash.
    const parts = rawTitle.split(/\s+—\s+/)
    const num = parts.length > 1 ? parts[0].trim() : slug.slice(0, 2)
    const navTitle = parts.length > 1 ? parts.slice(1).join(' — ').trim() : rawTitle
    return { file, slug, markdown, rawTitle, num, navTitle }
  })

  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })
  copyFileSync(join(here, 'blueprint-site.css'), join(out, 'style.css'))

  docs.forEach((doc, i) => {
    const { html, headings } = renderMarkdown(doc.markdown)
    const body = `    <div class="doc-head">
      <p class="doc-eyebrow"><span>Kitchen OS Blueprint</span><span>Document <b>${doc.num}</b></span><span>Rev. 01</span></p>
    </div>
    <article class="content">
${html}
    </article>
    ${pager(docs, i)}
`
    writeFileSync(
      join(out, `${doc.slug}.html`),
      shell({
        title: `${doc.navTitle} — Kitchen OS Blueprint`,
        description: BLURBS[doc.slug] ?? doc.navTitle,
        docs,
        currentSlug: doc.slug,
        headings,
        body,
      }),
    )
  })

  writeFileSync(join(out, 'index.html'), homePage(docs))

  console.log(`blueprint: ${docs.length + 1} pages → public/blueprint/`)
  docs.forEach((d) => console.log(`  ${d.num}  ${d.navTitle}`))
}

build()
