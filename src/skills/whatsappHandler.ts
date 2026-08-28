import { orchestrate } from "./orchestrator.js";

export async function onWhatsAppMessage(
  message: string,
  userId: string,
  orchestrateFn: typeof orchestrate = orchestrate
): Promise<string> {
  try {
    const result = await orchestrateFn(message, userId);
    return result.response;
  } catch (err) {
    console.error("Orchestration error:", err);
    return "Sorry, I hit an issue. Please try again.";
  }
}
