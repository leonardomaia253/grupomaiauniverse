import { assertProductionEnvironment } from "@/lib/env-validation";
import type { Instrumentation } from "next";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    assertProductionEnvironment();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const safeError =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };

  console.error(
    JSON.stringify({
      level: "error",
      event: "request_error",
      error: safeError,
      request: { path: request.path, method: request.method },
      context,
      timestamp: new Date().toISOString(),
    }),
  );
};
