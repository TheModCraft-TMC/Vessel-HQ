export interface EdgeAgentGenerateUrlResponse {
  EdgeID: string;
  Key: string;
  URL: string;
}

export interface EdgeAgentConnectivityResponse {
  success: boolean;
  message?: string;
}
