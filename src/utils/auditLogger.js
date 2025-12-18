import { db } from "../config/db.js";
import { auditLogs } from "../config/schema.js";

export const logAdminAction = async ({
  adminId,
  action,
  target,
  metadata = {},
}) => {
  try {
    await db.insert(auditLogs).values({
      adminId,
      action,
      target,
      metadata,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
};
