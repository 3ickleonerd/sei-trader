type TnCRequest = {
  telegram_id?: number;
  telegram_username?: string;
  tnc_version: string;
  tnc_hash: string;
  created_at: string;
  ip_address?: string;
  device?: string;
  method?: string;
};

export const tncRequestsStore: Record<string, TnCRequest> = {};

export function createTncRequest(slug: string, data: Partial<TnCRequest>): TnCRequest {
  const request: TnCRequest = {
    tnc_version: data.tnc_version || "1",
    tnc_hash: data.tnc_hash || "",
    created_at: new Date().toISOString(),
    telegram_id: data.telegram_id,
    telegram_username: data.telegram_username,
    ip_address: data.ip_address,
    device: data.device,
    method: data.method || "web_page"
  };
  
  tncRequestsStore[slug] = request;
  return request;
}

export function getTncRequest(slug: string): TnCRequest | undefined {
  return tncRequestsStore[slug];
}
