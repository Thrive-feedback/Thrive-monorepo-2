---
title: "FE_12 · SEO standard"
id: "FE_12"
area: "FE"
tier: "P1"
status: "draft"
updated: "2026-08-31"
requires: [FE_11]
see_also: [FE_20]
---

[Conventions](../index.html) / Frontend / FE_12

# [FE] SEO standard

`P1` · `FE_12` · `draft` · `updated 2026-08-31`

**Open when:** you are adding a page that search engines should see.

Metadata per route, canonical URLs, sitemap and robots generation, structured data, Open Graph, hreflang, and the rendering choice (SSG / ISR / SSR) per page type.

## The rules

If you read nothing else:

1. <a id="R1"></a>Every indexable route declares its own title and description. No route inherits a generic one.
2. <a id="R2"></a>Render the content that must be indexed on the server. What only the client renders may not be seen.
3. <a id="R3"></a>Choose the rendering mode per page from how often its content changes, and state the choice.
4. <a id="R4"></a>Give every page one canonical URL, and make every other URL for that content point at it.
5. <a id="R5"></a>Decide indexability explicitly. A page that must not be indexed says so in a robots directive, not only in the sitemap.
6. <a id="R6"></a>Generate the sitemap and robots rules from the routes. Never hand-maintain a list of URLs.
7. <a id="R7"></a>Give every page a social preview, from the same source as its metadata.
8. <a id="R8"></a>Add structured data only where the page really is that thing, and keep it consistent with what the page shows.
9. <a id="R9"></a>Where a page exists in more than one language or region, declare the alternates in both directions.
10. <a id="R10"></a>One `h1` per page, headings in order, and links that say where they go.

## Why

Search visibility fails in ways that are invisible from inside the app. The page looks right in a browser, so nobody notices that its title is the site's default, that its content arrives after a client fetch, that four URLs serve it and search engines picked the wrong one, or that a staging robots rule shipped to production and removed the site from the index. None of this shows up in a review of the diff, and all of it shows up weeks later in traffic.

That is why these rules are about *declaring* rather than optimizing. This document contains no advice about keywords or rankings, which change and are not engineering decisions. It fixes the things that are: where the content renders, which URL is authoritative, what a crawler is told, and whether the markup says what the page is. The performance half — how fast that page then loads — is [FE_20](../index.html#FE_20)'s.

## Rule detail

### [R1](#R1) Metadata belongs to the route

Each indexable route declares its title and description beside the route, derived from what the page actually contains. For a dynamic route that means generating them from the resource — the order, the article, the profile — and handling the case where the resource is missing, which resolves to not-found rather than to a page titled `undefined` ([FE_11](../index.html#FE_11)).

A default in the root layout is a fallback for pages nobody has thought about yet, not a strategy. When several routes share a title, they are competing with each other for the same query.

**Enforcement:** review — a route file with no metadata export is detectable and is a candidate guardrail ([INFRA_06](../index.html#INFRA_06)).

### [R2](#R2) and [R3](#R3) Rendering is an SEO decision

Content that matters for search renders on the server ([FE_08](../index.html#FE_08), [FE_09](../index.html#FE_09)). A crawler that has to execute the page to see the product description may do it late, or partially, or not at all — and the same content is invisible to link previews and to anything else reading the HTML.

Then choose the mode by how the content changes, and say which you chose:

| Content | Mode |
| --- | --- |
| Fixed until someone edits it — marketing, docs, legal | Prerendered at build |
| Changes on its own schedule — catalog, articles, listings | Prerendered with revalidation |
| Different per request — personalized, session-dependent | Rendered per request, usually not indexable |

The third row carries a warning: a page that renders per request because *one element* is personalized has made the whole page uncacheable. Split it — the indexable shell is static, the personal part arrives inside it.

**Enforcement:** review — the caching intent is stated per read ([FE_09](../index.html#FE_09)); nothing checks that it matches the page's kind.

### [R4](#R4) and [R5](#R5) One canonical URL, one explicit answer about indexing

The same content is usually reachable more than one way: with and without a trailing slash, with tracking parameters, with filters that reorder but do not change the set, through an old path that still redirects. Pick one form as canonical, declare it on the page, and make sure the others resolve to it — a redirect where the URL is wrong, a canonical link where the URL is legitimate but not primary ([FE_11](../index.html#FE_11)).

Indexability is a decision, not a default. Staging environments, search-result pages, one-time links, and anything behind authentication say so in a robots directive on the page itself. Leaving a page out of the sitemap does not stop it being indexed — the sitemap is a suggestion about what to crawl, not a rule about what to include. The reverse error is worse and more common: a blanket disallow written for a preview environment reaching production. That rule is generated from configuration, never hardcoded ([BE_10](../index.html#BE_10) is the equivalent discipline server-side).

**Enforcement:** review — a hardcoded disallow is greppable, and is the single highest-consequence candidate guardrail in this document ([INFRA_06](../index.html#INFRA_06)).

### [R6](#R6) Generate the sitemap

The sitemap is derived from the routes and the data behind them, not typed into a file. A hand-maintained list is wrong the day after it is written: the new page is missing and the deleted one is still there, and nothing fails when that happens.

Generation also makes the sitemap a place where a mistake is visible — if a route cannot say whether it is indexable or what its last change was, that is a gap in the route, not a reason to leave it out.

**Enforcement:** review.

### [R7](#R7) and [R8](#R8) Previews and structured data

A social preview comes from the same title and description as the page metadata, plus an image with a declared size. Deriving it separately guarantees they drift, and the version people see is the one in the link they were sent.

Structured data is a claim about what the page *is* — a product, an article, an event, an organization. Add it only where the claim is true, keep every value consistent with what is rendered, and prefer omitting a field to inventing one. Structured data that contradicts the page is worse than none: it can remove the page from the enhanced results it was added to earn.

**Enforcement:** review — structured data can be validated mechanically against its schema, though not against the page's content ([INFRA_06](../index.html#INFRA_06)).

### [R9](#R9) and [R10](#R10) Alternates, and the markup underneath

Where the same content exists per language or region, each version lists all of them, including itself, and every one points back — one-directional declarations are ignored. Which locales exist and how routing expresses them is [FE_23](../index.html#FE_23)'s.

The last rule is the oldest and the most often broken by component composition: one `h1` per page, heading levels in order with none skipped, and link text that says where it goes. These are accessibility rules first ([FE_06](../index.html#FE_06)) and they are the same rules search engines read the page with — which is the useful thing to know about search: almost everything it rewards is something a person using a screen reader needed anyway.

**Enforcement:** review — heading order and empty link text are checkable by accessibility linting ([FE_06](../index.html#FE_06)).

## Worked example

A product catalog: a listing at `/products`, a detail page at `/products/[slug]`, and a checkout flow.

The detail page generates its title and description from the product, and resolves to not-found when the slug matches nothing ([R1](#R1)). Its content renders on the server, so the description and price are in the HTML ([R2](#R2)). Products change on their own schedule, so it is prerendered with revalidation, and the choice is stated in the pull request ([R3](#R3)).

The listing accepts filter and sort params ([FE_11](../index.html#FE_11)). Those produce many URLs for overlapping content, so the unfiltered listing is canonical and every filtered variant declares it ([R4](#R4)). The variants stay crawlable — they are useful to a person — but they do not compete with the page they are variants of.

Checkout is the opposite case. It is personalized, useless in a search result, and carries a cart state in the URL, so it declares itself non-indexable on the page rather than merely being absent from the sitemap ([R5](#R5)).

The sitemap is generated: static routes from the route tree, product URLs from the same data source the pages read, each with the product's last update ([R6](#R6)). The robots rules come from configuration, so the preview deployment disallows everything and production does not, and neither is a literal in the repository ([R5](#R5)).

The detail page adds product structured data — name, image, price, availability — every field matching what is rendered, and omits ratings entirely because the page does not show any ([R8](#R8)). It has one `h1`, the product name; the "related products" heading below it is an `h2`, not an `h1` that a component chose for its size ([R10](#R10)).

## Checklist

- The route declares its own title and description, and handles the missing-resource case ([R1](#R1)).
- Indexable content renders on the server ([R2](#R2)); the rendering mode is chosen and stated ([R3](#R3)).
- One canonical URL is declared, and duplicates redirect or point at it ([R4](#R4)).
- Indexability is explicit on the page, and robots rules come from configuration ([R5](#R5)).
- The sitemap is generated from routes and data ([R6](#R6)).
- The social preview derives from the page metadata ([R7](#R7)).
- Structured data is true, complete for what it claims, and consistent with the page ([R8](#R8)).
- Locale alternates are declared in both directions ([R9](#R9)).
- One `h1`, headings in order, links that name their destination ([R10](#R10)).

## Open questions

- Nothing here verifies its own rules after deployment. A crawl of the built site checking titles, canonicals, robots directives and heading order would catch most of this document mechanically, and belongs to [INFRA_09](../index.html#INFRA_09).
- [R5](#R5)'s failure mode — a preview disallow reaching production — is the most damaging thing in this document and is guarded only by review.
- The split in [R3](#R3) between a static shell and a personalized part is stated as a principle with no pattern behind it. The first page that needs it will set the precedent; it should be written down when it does.

## Related

Requires [FE_11](../index.html#FE_11). See also [FE_20](../index.html#FE_20).

---

[← All conventions](../index.html)
