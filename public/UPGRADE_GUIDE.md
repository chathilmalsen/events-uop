# Campus Connect — Production Hardening Upgrade

This pack upgrades the supplied React/Firebase app without redesigning the existing UI.

## What changed

1. **Admin authorization**
   - Removed the admin email from the React bundle.
   - Admin access is now controlled by the Firebase Auth `admin` custom claim.
   - A Cloud Function assigns the claim to the configured admin email.

2. **Firebase Storage**
   - New event posters and Lost & Found photos are compressed in the browser and uploaded to Firebase Storage.
   - Firestore stores only the resulting HTTPS download URL.
   - Existing base64 images remain readable for backward compatibility.

3. **Firestore rules**
   - Default deny remains enabled.
   - Event creation requires a verified account and a short server-side batch cooldown.
   - Ticket creation uses the same event/ticket cooldown.
   - Contact messages use a separate 60-second cooldown.
   - Public ticket documents no longer need to expose the reporter UID.
   - Admin status changes are protected by the custom claim.

4. **App Check**
   - `firebase.js` initializes reCAPTCHA v3 App Check when `VITE_RECAPTCHA_SITE_KEY` is present.
   - After testing, enable App Check enforcement in Firebase Console for Firestore and Storage.

5. **Image safety**
   - Browser uploads are restricted to images and compressed before upload.
   - Storage rules cap images at 5 MB after compression.

## Replace these files

- `src/App.jsx`
- `src/firebase.js`
- `firestore.rules`
- `storage.rules`
- `firebase.json`
- `firestore.indexes.json`
- `.env` based on `.env.example`
- `functions/index.js`
- `functions/package.json`
- `functions/.env` based on `functions/.env.example`

Keep your existing `index.html`, CSS/Tailwind setup, public intro videos/posters, manifest, and service worker unless you already have separate changes to those files.

## 1. Configure the web app

Copy `.env.example` to `.env` and put in the Firebase Web App values from Firebase Console.

Do **not** commit `.env`.

## 2. Enable Firebase services

In Firebase Console:

- Authentication: Email/Password and Anonymous providers as required by the existing app.
- Firestore: create/use the existing database.
- Storage: enable Firebase Storage.
- App Check: register the web app with reCAPTCHA v3.

## 3. Deploy Firestore and Storage rules

From the project root:

```bash
firebase deploy --only firestore:rules,storage
```

## 4. Configure and deploy the admin claim function

Create `functions/.env`:

```env
ADMIN_EMAIL=your-real-admin-email@example.com
ADMIN_CLAIM_REPAIR_SECRET=use-a-long-random-secret
```

Install dependencies:

```bash
cd functions
npm install
cd ..
```

Deploy:

```bash
firebase deploy --only functions
```

The `syncAdminClaimOnCreate` trigger automatically gives the configured admin email the `admin: true` claim when that account is created.

### Existing admin account

If the admin account already exists, call the deployed `repairAdminClaim` endpoint once with the secret configured above, or use a trusted Admin SDK script. The endpoint expects:

- HTTP method: `POST`
- header: `x-admin-repair-secret: <your secret>`

After the claim is set, sign out/in again in the admin browser so the ID token is refreshed.

## 5. Enable App Check enforcement

First test the app with App Check initialized but enforcement disabled. Confirm events, comments, likes, tickets, Storage uploads, and admin login work.

Then enable enforcement for:

- Cloud Firestore
- Cloud Storage

Do this only after legitimate traffic is receiving valid App Check tokens.

## Important migration note

The upgraded client sends new images to Storage. Existing events/tickets that contain compressed `data:image/...;base64,...` images continue to work because the rules intentionally allow legacy media URLs below the compatibility limit.

You can later migrate old images to Storage and remove the base64 compatibility branch from `firestore.rules`.

## Remaining architectural improvement for a future v2

The supplied application stores comments and event likes as arrays inside event documents. This upgrade protects those writes, but arrays still have a scalability ceiling because Firestore documents have a 1 MiB limit.

For a large production deployment, migrate to:

- `/events/{eventId}/comments/{commentId}`
- `/events/{eventId}/likes/{uid}`
- backend-generated view counters/analytics

That is a larger data-model migration and should be done separately rather than silently breaking your existing data.
