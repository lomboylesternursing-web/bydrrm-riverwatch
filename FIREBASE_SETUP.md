# BYDRRM RiverWatch — Shared Cloud Setup

RiverWatch can run fully in local-only mode. To enable shared realtime readings across devices, connect a Firebase project.

## 1. Create/register the Firebase web app
1. Create a Firebase project.
2. Register a Web app for RiverWatch.
3. Copy the Firebase configuration object (apiKey, authDomain, projectId, appId, etc.).

## 2. Enable products
- Authentication: enable **Google** sign-in.
- Cloud Firestore: create the default database.

## 3. Publish security rules
Use the repository's `firestore.rules` file. The design is:
- `riverwatch_readings`: public read; approved operators only can write.
- `riverwatch_audit`: approved operators only can read/write.
- `operators/{uid}`: a signed-in user can check only their own operator record; operator records are managed manually by an administrator.

Never use an allow-all Firestore ruleset for production.

## 4. Connect the RiverWatch website
1. Open RiverWatch.
2. Tap **Cloud: Local only**.
3. Paste the Firebase web configuration JSON.
4. Tap **Save & Connect**.
5. Tap **Sign in with Google**.
6. Copy the UID shown by RiverWatch.

## 5. Approve an operator
In Firestore, create a document:

`operators/<USER_UID>`

Suggested fields (the rules only require the document to exist):

```json
{
  "name": "Volunteer Name",
  "role": "BYDRRM Volunteer",
  "active": true
}
```

After the operator document exists, reload/sign in again. RiverWatch will display **Cloud: Operator online**.

## Data model
### Public shared readings
Collection: `riverwatch_readings`

Contains station ID, water level, status/classification, observation timestamp, public source/note, and reading ID.

### Restricted audit trail
Collection: `riverwatch_audit`

Contains verifier, role, observation method, evidence reference, account UID/email, and verification timestamps.

### Field photos
In v1 shared cloud mode, field photos stay on the entering browser/device and are not uploaded to Firestore. This avoids putting large image blobs or sensitive evidence in public/shared records. A future upgrade can use Firebase Storage with separate security rules.

## Safety
- Manual observations default to `READING ONLY`.
- Do not classify NORMAL/WATCH/ALARM/CRITICAL without an official threshold/advisory basis.
- RiverWatch does not establish bridge structural safety.
