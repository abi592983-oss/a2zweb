# Activate website bookings

The A2Z website form sends a URL-encoded POST to an Apps Script web app. The script creates a response in the existing Google Form through FormApp, so the response also goes to its linked spreadsheet. It does not create a replacement form or write directly to a spreadsheet.

## One-time setup

1. Open the **same Apps Script project** where you ran `createA2ZBookingForm`.
2. Add a new **Script** file named `BookingBackend`, and paste the entire contents of `BookingBackend.gs`. Keep the original script.
3. Save, select `verifyWebsiteBackend`, and click **Run**. Authorize Google's requested access. The log should show the existing A2Z form. This check does not submit a response.
4. Choose **Deploy → New deployment → Web app**.
5. Set **Execute as: Me** and **Who has access: Anyone** (not “Anyone with Google account”). Deploy.
6. Copy the **Web app URL**, ending in `/exec`, and send it to the website maintainer. It is a public endpoint, not a password.
7. Set `booking.endpoint` in root `content.json` to that URL and deploy the website. The submit button activates only for a valid Apps Script `/exec` URL.

Google's guide: https://developers.google.com/apps-script/guides/web

If a Workspace administrator prevents anonymous deployments, the owner must resolve that restriction or choose a different backend. Do not change account security settings to bypass it.

## Verification before calling this live

After the deployment URL is configured, use the GitHub Pages website form to submit a clearly marked test. Verify the website displays the saved confirmation and the matching response appears in Google Forms / its linked sheet. Repeat for CCTV installation and a health check to verify the section mappings. The automated tests use a mock Forms service, not the live account.

Customer values are never stored in browser storage. Errors retain the fields in the current page. A request UUID is reused on retries; the backend prevents duplicate saves for seven days, and records the UUID in Additional information. After a page reload, contact A2Z if a submission outcome was uncertain. Script-created responses do not necessarily fire the same triggers as interactive Forms submissions; verify any separate notification automation independently.

The public endpoint validates fields and existing question/choice mappings, checks whether the form is accepting responses, and includes a honeypot. It is not a substitute for dedicated rate limiting if the site attracts abusive traffic. The backend returns no response data or credentials. Changes to the Google Form's English question suffixes or choices require matching backend updates.

When updating backend code later: Deploy → Manage deployments → Edit → New version → Deploy. Keep the same deployment URL.
