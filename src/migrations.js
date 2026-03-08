// ─── Data Migration Utilities ────────────────────────────────────────────────
// One-time migration helpers to move data from legacy flat Firebase paths
// to the new /pools/{poolId}/ structure.
//
// These functions are called from the GlobalAdminHub UI.
// They READ from old paths and WRITE to new paths.
// They do NOT delete old data — admin should verify the new paths work, then
// manually remove the old paths from the Firebase console.

import { ref, get, set } from "firebase/database";
import { db } from "./firebase";

/**
 * Migrates NBA pool data from flat paths to /pools/nba-2026/.
 *
 * Old paths:  /participants/   /results/   /settings/
 * New paths:  /pools/nba-2026/participants/   /pools/nba-2026/results/   /pools/nba-2026/settings/
 *
 * @param {function} onProgress - callback(message: string) for UI status updates
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function migrateNBAData(onProgress = () => {}) {
  if (!db) {
    return { success: false, message: "Firebase not configured — check environment variables." };
  }

  const TARGET = "pools/nba-2026";

  try {
    // ── Read old paths ────────────────────────────────────────────────────────
    onProgress("📖 Reading /participants/ ...");
    const participantsSnap = await get(ref(db, "participants"));
    const participants = participantsSnap.exists() ? participantsSnap.val() : null;
    if (participants) {
      onProgress(`   Found ${Object.keys(participants).length} participant(s).`);
    } else {
      onProgress("   No data at /participants/ — skipping.");
    }

    onProgress("📖 Reading /results/ ...");
    const resultsSnap = await get(ref(db, "results"));
    const results = resultsSnap.exists() ? resultsSnap.val() : null;
    onProgress(results ? "   Found results data." : "   No data at /results/ — skipping.");

    onProgress("📖 Reading /settings/ ...");
    const settingsSnap = await get(ref(db, "settings"));
    const settings = settingsSnap.exists() ? settingsSnap.val() : null;
    onProgress(settings ? "   Found settings data." : "   No data at /settings/ — skipping.");

    // ── Write new paths ───────────────────────────────────────────────────────
    if (participants) {
      onProgress(`✍️  Writing participants to /${TARGET}/participants/ ...`);
      await set(ref(db, `${TARGET}/participants`), participants);
      onProgress("   ✓ Participants written.");
    }

    if (results) {
      onProgress(`✍️  Writing results to /${TARGET}/results/ ...`);
      await set(ref(db, `${TARGET}/results`), results);
      onProgress("   ✓ Results written.");
    }

    if (settings) {
      onProgress(`✍️  Writing settings to /${TARGET}/settings/ ...`);
      await set(ref(db, `${TARGET}/settings`), settings);
      onProgress("   ✓ Settings written.");
    }

    onProgress("─────────────────────────────────");
    onProgress("✅ Migration complete!");
    onProgress("   Old data preserved at original paths.");
    onProgress("   Verify the app works with new paths, then");
    onProgress("   remove /participants/, /results/, /settings/");
    onProgress("   from the Firebase console manually.");

    return {
      success: true,
      message: `Data migrated to /${TARGET}/. Old paths preserved — delete manually after verifying.`,
    };
  } catch (e) {
    console.error("Migration error:", e);
    const msg = `Migration failed: ${e.message}`;
    onProgress(`❌ ${msg}`);
    return { success: false, message: msg };
  }
}
