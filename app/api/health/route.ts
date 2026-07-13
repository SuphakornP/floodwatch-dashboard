import { checkDatabaseConnection } from "../../../db/database";
import { ensureSchema } from "../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    const connected = await checkDatabaseConnection();
    if (!connected) {
      return Response.json(
        { status: "unavailable", database: "unavailable" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      { status: "ok", database: "connected" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Database health check failed:",
      error instanceof Error ? error.message : "Unknown database error",
    );
    return Response.json(
      { status: "unavailable", database: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
