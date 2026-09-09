# Activate website bookings

The A2Z website form sends a URL-encoded POST to an Apps Script web app. The script creates a response in the existing Google Form through FormApp, so the response also goes to its linked spreadsheet. It does not create a replacement form or write directly to a spreadsheet.

## One-time setup

1. Open the **same Apps Script project** where you ran `createA2ZBookingForm`.
2. Add a new **Script** file named `BookingBackend`, and paste the entire contents of `BookingBackend.gs`. Keep the original script.
3. Save, select `verifyWebsiteBackend`, and click **Run**. Authorize Google's requested access. The log should show the existing A2Z form. This check does not submit a response.
4. Select `configureErpIntegration` and click **Run** once. This creates a private Drive folder named **A2Z Health Check JSON Archive** and logs a generated ERP sync secret. Copy that secret into the ERP `.env`; never put it in website files.
5. Choose **Deploy → New deployment → Web app**.
6. Set **Execute as: Me** and **Who has access: Anyone** (not “Anyone with Google account”). Deploy.
7. Copy the **Web app URL**, ending in `/exec`. Use it for both `booking.endpoint` in root `content.json` and `BOOKING_SYNC_URL` in the ERP `.env`.
8. Deploy the website. The submit button activates only for a valid Apps Script `/exec` URL.

ERP `.env` values:

```env
BOOKING_SYNC_ENABLED=true
BOOKING_SYNC_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
BOOKING_SYNC_SECRET=THE_SECRET_LOGGED_BY_CONFIGURE_ERP_INTEGRATION
BOOKING_SYNC_INTERVAL_MS=300000
HEALTH_ARCHIVE_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
HEALTH_ARCHIVE_SECRET=THE_SAME_SECRET
```

Apps Script remains available while the local ERP is off. Google Form responses wait there; the ERP pulls unacknowledged responses at startup and every five minutes while it is running. Only rows accepted by the ERP are acknowledged, and the ERP's external reference makes retries idempotent.

Google's guide: https://developers.google.com/apps-script/guides/web

If a Workspace administrator prevents anonymous deployments, the owner must resolve that restriction or choose a different backend. Do not change account security settings to bypass it.

## Verification before calling this live

After the deployment URL is configured, use the website form to submit a clearly marked test with a serial number. Verify the website displays the saved confirmation and the matching response appears in Google Forms / its linked sheet. Start the ERP and confirm the request appears under Service Requests. Enter the displayed customer ID and the same serial number, then use **Verify & create appointment**. A mismatched customer/serial pair must be rejected. Repeat for CCTV installation and a health check to verify the section mappings. The automated tests use a mock Forms service, not the live account.

For a diagnostic import, the JSON must include `diagnostic_version` plus at least one supported section (`device`, `cpu`, `memory`, `storage`, `battery`, `os`, `thermal`, `events`, or `scores`). In the ERP, select the customer and enter that customer's registered serial number. The ERP stores the original JSON immutably, calculates the human-readable section and overall percentages, and asks this Apps Script deployment to archive a copy in the private Drive folder.

Customer values are never stored in browser storage. Errors retain the fields in the current page. A request UUID is reused on retries; the backend prevents duplicate saves for seven days, and records the UUID in Additional information. After a page reload, contact A2Z if a submission outcome was uncertain. Script-created responses do not necessarily fire the same triggers as interactive Forms submissions; verify any separate notification automation independently.

The public endpoint validates fields and existing question/choice mappings, checks whether the form is accepting responses, and includes a honeypot. It is not a substitute for dedicated rate limiting if the site attracts abusive traffic. The backend returns no response data or credentials. Changes to the Google Form's English question suffixes or choices require matching backend updates.

When updating backend code later: Deploy → Manage deployments → Edit → New version → Deploy. Keep the same deployment URL. Do not run `configureErpIntegration` again unless you intentionally need to recreate missing configuration; it preserves an existing secret and folder.
