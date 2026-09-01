# A2Z Tec Solutions website

First visual concept for A2Z Tec Solutions (Pvt) Ltd, Paranthan.

## Edit content

Edit `web/content.json` to change the hero, services, contact details, gallery photos and deposit. Set service `active` to false to hide it. Gallery entries use `image`, `alt`, `title` and `caption`. Image paths can point to files under `web/images/`. WhatsApp must include the country code, e.g. 94 followed by the national number without its leading zero.

## Preview locally

Run `python3 -m http.server 8000 --directory web` and open http://localhost:8000. No dependencies, database or build tooling required. Hash navigation works on static hosts and repository subpaths.

## Hosting

Deploy the `web` directory to Netlify or another static host. A private ChatGPT Sites preview is configured through `.openai/hosting.json`. GitHub Pages is not enabled by these files; repository hosting settings must be configured separately.

## Current limits

This is an English first concept. Phone, WhatsApp, email, exact map pin, hours and actual work photos need confirmation. Booking creates a local request summary and can hand it to WhatsApp when configured; it does not create an appointment, accept payment or persist submissions. Policies must be finalised before customer launch. No fabricated testimonials or customer work photos are included.

Hero photograph: Oleg Gospodarec / Unsplash, https://unsplash.com/photos/a-close-up-of-a-motherboard-with-wires-and-connectors-Njw_--Fcu2U . Illustrative component photo, not A2Z customer work.
