import { createRequire } from "node:module";
import { test, before, after, beforeEach } from "node:test";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const MASTER_ADMIN_UID = "master_admin_01";
const MASTER_ADMIN_EMAIL = "breakingnewswala.com@gmail.com";
const REPORTER_UID = "reporter_01";
const READER_UID = "reader_01";

const [emulatorHost, emulatorPortStr] = (
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085"
).split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

function masterAdminDb() {
  return testEnv
    .authenticatedContext(MASTER_ADMIN_UID, {
      email: MASTER_ADMIN_EMAIL,
      email_verified: true,
    })
    .firestore();
}

function spoofedMasterAdminDb() {
  return testEnv
    .authenticatedContext("spoof_uid", {
      email: MASTER_ADMIN_EMAIL,
      email_verified: false,
    })
    .firestore();
}

function reporterDb() {
  return testEnv
    .authenticatedContext(REPORTER_UID, {
      email: "reporter@example.com",
      email_verified: true,
    })
    .firestore();
}

function readerDb() {
  return testEnv
    .authenticatedContext(READER_UID, {
      email: "reader@example.com",
      email_verified: true,
    })
    .firestore();
}

function pastDate(msOffset = 2000) {
  return new Date(Date.now() - msOffset);
}

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test("Unauthenticated users cannot read or write any collection", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("articles").where("status", "==", "PUBLISHED").get());
  await assertFails(unauthDb.collection("users").doc(READER_UID).get());
  await assertFails(unauthDb.collection("users").doc(READER_UID).collection("bookmarks").get());
});

test("User registration prevents self-assigned role escalation & PII leaks", async () => {
  const rDb = readerDb();
  const ts = pastDate(5000);

  // Regular reader cannot create self as ADMIN or REPORTER
  await assertFails(
    rDb.collection("users").doc(READER_UID).set({
      uid: READER_UID,
      email: "reader@example.com",
      displayName: "Sneaky Reader",
      role: "ADMIN",
      district: "भोपाल",
      coins: 0,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Regular reader cannot write @DocumentId `id` or future timestamp
  await assertFails(
    rDb.collection("users").doc(READER_UID).set({
      id: READER_UID,
      uid: READER_UID,
      email: "reader@example.com",
      displayName: "Reader",
      role: "READER",
      district: "भोपाल",
      coins: 0,
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertFails(
    rDb.collection("users").doc(READER_UID).set({
      uid: READER_UID,
      email: "reader@example.com",
      displayName: "Reader",
      role: "READER",
      district: "भोपाल",
      coins: 0,
      createdAt: new Date(Date.now() + 60000),
      updatedAt: ts,
    })
  );

  // Valid READER create succeeds
  await assertSucceeds(
    rDb.collection("users").doc(READER_UID).set({
      uid: READER_UID,
      email: "reader@example.com",
      displayName: "राम शर्मा",
      role: "READER",
      district: "भोपाल",
      coins: 0,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Cross-user PII read fails
  await assertFails(reporterDb().collection("users").doc(READER_UID).get());
  // Non-master-admin cannot list all users
  await assertFails(rDb.collection("users").get());

  // Spoofed unverified email cannot bootstrap MASTER ADMIN
  await assertFails(
    spoofedMasterAdminDb().collection("users").doc("spoof_uid").set({
      uid: "spoof_uid",
      email: MASTER_ADMIN_EMAIL,
      displayName: "Spoof",
      role: "ADMIN",
      district: "नई दिल्ली",
      coins: 0,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Verified Master Admin bootstraps ADMIN and promotes Reporter
  const adminDb = masterAdminDb();
  await assertSucceeds(
    adminDb.collection("users").doc(MASTER_ADMIN_UID).set({
      uid: MASTER_ADMIN_UID,
      email: MASTER_ADMIN_EMAIL,
      displayName: "मास्टर एडमिन",
      role: "ADMIN",
      district: "नई दिल्ली",
      coins: 0,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  await assertSucceeds(adminDb.collection("users").orderBy("updatedAt", "desc").get());
  await assertSucceeds(
    adminDb.collection("users").doc(READER_UID).update({
      role: "REPORTER",
      updatedAt: pastDate(1000),
    })
  );

  // Owner cannot mutate their own role or coins
  await assertFails(
    rDb.collection("users").doc(READER_UID).update({
      coins: 9999,
      updatedAt: pastDate(500),
    })
  );

  // Owner can update displayName and district
  await assertSucceeds(
    rDb.collection("users").doc(READER_UID).update({
      district: "इंदौर",
      updatedAt: pastDate(500),
    })
  );
});

test("User bookmarks subcollection enforces strict path ownership", async () => {
  const rDb = readerDb();
  const ts = pastDate(2000);

  await assertSucceeds(
    rDb.collection("users").doc(READER_UID).collection("bookmarks").doc("art_1").set({
      userId: READER_UID,
      articleId: "art_1",
      articleTitle: "ब्रेकिंग न्यूज़ हेडलाइन",
      articleCategory: "राष्ट्रीय",
      articleDistrict: "नई दिल्ली",
      createdAt: ts,
    })
  );

  // List bookmarks owned by user succeeds (even when empty for another user's own path)
  await assertSucceeds(
    rDb.collection("users").doc(READER_UID).collection("bookmarks").get()
  );
  await assertSucceeds(
    reporterDb().collection("users").doc(REPORTER_UID).collection("bookmarks").get()
  );

  // Cross-user bookmark read/write fails
  await assertFails(
    reporterDb().collection("users").doc(READER_UID).collection("bookmarks").get()
  );
  await assertFails(
    reporterDb().collection("users").doc(READER_UID).collection("bookmarks").doc("art_1").delete()
  );
});

test("Articles enforce reporter submission, admin publishing, and query alignment", async () => {
  const ts = pastDate(10000);
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.collection("users").doc(REPORTER_UID).set({
      uid: REPORTER_UID,
      email: "reporter@example.com",
      displayName: "संवाददाता",
      role: "REPORTER",
      district: "भोपाल",
      coins: 0,
      createdAt: ts,
      updatedAt: ts,
    });
    await db.collection("users").doc(READER_UID).set({
      uid: READER_UID,
      email: "reader@example.com",
      displayName: "पाठक",
      role: "READER",
      district: "इंदौर",
      coins: 0,
      createdAt: ts,
      updatedAt: ts,
    });
  });

  const repDb = reporterDb();
  const rDb = readerDb();
  const adminDb = masterAdminDb();

  // Reader cannot submit articles
  await assertFails(
    rDb.collection("articles").doc("art_reader").set({
      title: "अवैध खबर",
      summary: "सारांश",
      content: "यह पाठक द्वारा लिखी खबर है।",
      category: "स्थानीय",
      district: "इंदौर",
      state: "मध्य प्रदेश",
      authorId: READER_UID,
      authorName: "पाठक",
      authorRole: "REPORTER",
      status: "PENDING_VERIFICATION",
      breaking: false,
      live: false,
      viewCount: 0,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Reporter cannot self-publish or set breaking = true
  await assertFails(
    repDb.collection("articles").doc("art_self_pub").set({
      title: "भोपाल में नई मेट्रो लाइन शुरू",
      summary: "संक्षिप्त विवरण",
      content: "भोपाल में आज नई मेट्रो लाइन का सफल ट्रायल रन पूरा हुआ।",
      category: "विकास",
      district: "भोपाल",
      state: "मध्य प्रदेश",
      authorId: REPORTER_UID,
      authorName: "संवाददाता",
      authorRole: "REPORTER",
      status: "PUBLISHED",
      breaking: false,
      live: false,
      viewCount: 0,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Reporter submits valid PENDING_VERIFICATION article
  await assertSucceeds(
    repDb.collection("articles").doc("art_pending_1").set({
      title: "भोपाल में नई मेट्रो लाइन का ट्रायल सफल",
      summary: "शहरवासियों को बड़ी सौगात मिली।",
      content: "राजधानी भोपाल में आज सुभाष नगर से रानी कमलापति स्टेशन तक मेट्रो का सफल परीक्षण किया गया।",
      category: "विकास",
      district: "भोपाल",
      state: "मध्य प्रदेश",
      authorId: REPORTER_UID,
      authorName: "संवाददाता",
      authorRole: "REPORTER",
      status: "PENDING_VERIFICATION",
      breaking: false,
      live: false,
      viewCount: 0,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Unfiltered articles query fails for non-admin; filtered own query succeeds for reporter
  await assertFails(rDb.collection("articles").get());
  await assertFails(rDb.collection("articles").where("status", "==", "PENDING_VERIFICATION").get());
  await assertSucceeds(
    repDb.collection("articles").where("authorId", "==", REPORTER_UID).get()
  );

  // Master Admin approves & publishes article with breaking flag
  await assertSucceeds(
    adminDb.collection("articles").where("status", "==", "PENDING_VERIFICATION").get()
  );
  await assertSucceeds(
    adminDb.collection("articles").doc("art_pending_1").update({
      status: "PUBLISHED",
      breaking: true,
      live: true,
      editorialNote: "10-पॉइंट सत्यापन पूर्ण",
      aiScore: 92,
      updatedAt: pastDate(1000),
    })
  );

  // Reader can query PUBLISHED articles & increment viewCount by +1
  await assertSucceeds(
    rDb.collection("articles").where("status", "==", "PUBLISHED").get()
  );
  await assertSucceeds(
    rDb.collection("articles").doc("art_pending_1").update({
      viewCount: 1,
    })
  );

  // Reader cannot jump viewCount by +50 or change title
  await assertFails(
    rDb.collection("articles").doc("art_pending_1").update({
      viewCount: 50,
    })
  );
  await assertFails(
    repDb.collection("articles").doc("art_pending_1").update({
      title: "प्रकाशित खबर बदलने की कोशिश",
      updatedAt: pastDate(500),
    })
  );
});
