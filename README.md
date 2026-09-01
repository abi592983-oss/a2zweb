# A2Z Tec Solutions website

First visual concept for A2Z Tec Solutions (Pvt) Ltd, Paranthan.

## Edit content

Edit `content.json` to change the hero, services, contact details, gallery photos and deposit. Set service `active` to false to hide it. Gallery entries use `image`, `alt`, `title` and `caption`. Image paths can point to files under `images/`. WhatsApp must include the country code, e.g. 94 followed by the national number without its leading zero.

The `plusCode` field sets the shop location used by the Google Maps button. Current confirmed location: CCP6+HJ, Parantan.

## Brand identity

The original supplied logo is stored at `images/a2z-logo.png`. Change `logo.src` and `logo.alt` in `content.json` to replace it. The image is preserved as supplied, including its light background.

The `theme` object controls seven colours: `ink`, `paper`, `surface`, `line`, `accent`, `accentText`, and `muted`. Use six-digit hex colours. Bright orange (#ff5a00) is a visual match to the supplied logo; darker orange is used for readable links on white. Primary orange buttons use near-black text. CSS includes matching defaults while JSON loads.

## Preview locally

Run `python3 -m http.server 8000` and open http://localhost:8000. No dependencies, database or build tooling required. Hash navigation works on static hosts and repository subpaths.

## Hosting on GitHub Pages

The website files are in the repository root. In Settings → Pages, select “Deploy from a branch”, branch “main”, folder “/ (root)”, and Save. No npm installation or build is required. The .nojekyll file disables Jekyll processing.

GitHub Pages must be enabled in repository settings. This source change does not enable Pages by itself. Private repositories require a GitHub plan supporting Pages for private repositories; otherwise the repository must be made public by its owner.

Edit content.json for content and image paths. Relative URLs support the /a2zweb/ project path. For Netlify, publish the repository root. The optional npm run build command copies the website into dist for the existing ChatGPT Sites preview configuration; it does not deploy either host.

## Current limits

This is an English first concept. Phone, WhatsApp, email, hours and actual work photos need confirmation. Booking creates a local request summary and can hand it to WhatsApp when configured; it does not create an appointment, accept payment or persist submissions. Policies must be finalised before customer launch. No fabricated testimonials or customer work photos are included.

Hero photograph: Oleg Gospodarec / Unsplash, https://unsplash.com/photos/a-close-up-of-a-motherboard-with-wires-and-connectors-Njw_--Fcu2U . Illustrative component photo, not A2Z customer work.
