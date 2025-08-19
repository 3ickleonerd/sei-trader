import { generateTncHtml, createAcceptanceRecord } from "../utils/tncHtml.ts";

export function serveTncPage(theme: "light" | "dark" = "light"): string {
  return generateTncHtml({
    theme,
    onAcceptUrl: "/api/tnc/accept",
    onDeclineUrl: "/api/tnc/decline",
    title: "Terms & Conditions - Caret Sei Trading Bot",
  });
}

export function handleTncAcceptance(userId: string, version: string) {
  const record = createAcceptanceRecord(version, userId);

  console.log("TNC Accepted:", record);

  return {
    success: true,
    message: "Terms accepted successfully",
    redirectUrl: "/dashboard",
  };
}

export function handleTncDecline(userId: string, version: string) {
  const record = {
    ...createAcceptanceRecord(version, userId),
    accepted: false,
  };

  console.log("TNC Declined:", record);

  return {
    success: true,
    message: "Terms declined",
    redirectUrl: "/",
  };
}
