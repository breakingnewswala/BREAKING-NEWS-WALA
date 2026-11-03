const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

const PROJECT_ID = "demo-no-project";

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8085
    }
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

test("unauthenticated user cannot read private profiles", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("users").doc("user123").get());
});

test("authenticated user can create their own profile", async () => {
  const authDb = testEnv.authenticatedContext("user123").firestore();
  await assertSucceeds(authDb.collection("users").doc("user123").set({
    id: "user123",
    displayName: "राजेश शर्मा",
    role: "READER"
  }));
});

test("user cannot create another user's profile", async () => {
  const authDb = testEnv.authenticatedContext("user123").firestore();
  await assertFails(authDb.collection("users").doc("other_user").set({
    id: "other_user",
    displayName: "अमित कुमार",
    role: "READER"
  }));
});

test("anyone can read published articles", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("articles").doc("art1").set({
      title: "भोपाल में भारी बारिश का अलर्ट",
      category: "मौसम",
      district: "भोपाल",
      authorId: "reporter1",
      status: "PUBLISHED"
    });
  });

  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(unauthDb.collection("articles").doc("art1").get());
});

test("author can create article", async () => {
  const authDb = testEnv.authenticatedContext("reporter1").firestore();
  await assertSucceeds(authDb.collection("articles").doc("art2").set({
    title: "इंदौर मेट्रो का नया ट्रायल सफल",
    category: "विकास",
    district: "इंदौर",
    authorId: "reporter1",
    status: "DRAFT"
  }));
});

test("unauthorized user cannot update someone else's draft", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("articles").doc("art3").set({
      title: "ग्वालियर में विकास कार्य",
      category: "विकास",
      district: "ग्वालियर",
      authorId: "reporter1",
      status: "DRAFT"
    });
  });

  const intruderDb = testEnv.authenticatedContext("intruder").firestore();
  await assertFails(intruderDb.collection("articles").doc("art3").update({
    title: "हैक किया गया शीर्षक"
  }));
});
