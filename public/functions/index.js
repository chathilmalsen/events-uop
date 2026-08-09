const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

function configuredAdminEmail() {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

// Server-side role assignment. The browser never decides who is an admin.
exports.syncAdminClaimOnCreate = functions.auth.user().onCreate(async (user) => {
  const adminEmail = configuredAdminEmail();
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL is not configured; no admin claim was assigned.");
    return null;
  }

  const isAdmin = (user.email || "").trim().toLowerCase() === adminEmail;
  await admin.auth().setCustomUserClaims(user.uid, {
    ...(user.customClaims || {}),
    admin: isAdmin,
  });

  return null;
});

// Run this after changing ADMIN_EMAIL or if the existing admin account was
// created before the trigger was deployed. Call it from a trusted server only.
exports.repairAdminClaim = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST required" });
  }

  const expectedSecret = process.env.ADMIN_CLAIM_REPAIR_SECRET;
  if (!expectedSecret || req.get("x-admin-repair-secret") !== expectedSecret) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const email = configuredAdminEmail();
  if (!email) {
    return res.status(500).json({ error: "ADMIN_EMAIL is not configured" });
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, {
      ...(user.customClaims || {}),
      admin: true,
    });

    return res.json({
      ok: true,
      uid: user.uid,
      email: user.email,
      message: "Admin claim set. The user must refresh/sign in again.",
    });
  } catch (error) {
    console.error("repairAdminClaim failed:", error);
    return res.status(500).json({ error: error.message || "Unable to set claim" });
  }
});
