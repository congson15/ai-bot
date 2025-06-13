const axios = require("axios");
const fs = require("fs");
const path = require("path");
const config = require("../config");
const cron = require("node-cron");

class UnltdaiClient {
  constructor() {
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.userAgent = config.userAgent;
    this.tokenData = {
      accessToken: null,
      refreshToken: null,
      expiresAt: 0,
    };

    this.tokenFile = path.resolve(config.cacheFile);
    this.loadTokenFromDisk();
    this.scheduleRefresh();
  }

  loadTokenFromDisk() {
    try {
      const data = JSON.parse(fs.readFileSync(this.tokenFile));
      this.tokenData = data;
    } catch {
      console.warn("[UNLTDAI] No token cache found.");
    }
  }

  saveTokenToDisk() {
    fs.writeFileSync(this.tokenFile, JSON.stringify(this.tokenData, null, 2));
  }

  async refreshTokenIfNeeded(force = false) {
    const now = Math.floor(Date.now() / 1000);
    if (!force && now < this.tokenData.expiresAt - 300) return;

    try {
      const res = await axios.post(
        this.baseURL + "/auth/v1/token?grant_type=refresh_token",
        { refresh_token: this.tokenData.refreshToken },
        { headers: { apikey: this.apiKey } }
      );

      this.tokenData.accessToken = res.data.access_token;
      this.tokenData.refreshToken = res.data.refresh_token;
      this.tokenData.expiresAt = now + res.data.expires_in;

      this.saveTokenToDisk();
      console.log("[UNLTDAI] ✅ Token refreshed");
    } catch (err) {
      console.error("[UNLTDAI] ❌ Failed to refresh token:", err.message);
    }
  }

  scheduleRefresh() {
    cron.schedule(config.refreshInterval, () =>
      this.refreshTokenIfNeeded(true)
    );
  }
  buildHeaders(extra = {}) {
    return {
      Authorization: `Bearer ${this.tokenData.accessToken}`,
      apikey: this.apiKey,
      "User-Agent": this.userAgent,
      "Content-Type": "application/json",
      ...extra,
    };
  }
  async request({
    uri,
    method = "GET",
    headers = {},
    body,
    transformToQuery = false,
  }) {
    await this.refreshTokenIfNeeded();
    const url = new URL(uri, this.baseURL);
    if (transformToQuery) {
      Object.entries(body).forEach(([k, v]) => url.searchParams.append(k, v));
    }
    const finalHeaders = this.buildHeaders(headers);

    console.log("[UNLTDAI] Request:", url.href);
    const res = await axios(url.href, {
      method,
      headers: finalHeaders,
      ...(!transformToQuery && { data: body }),
    });
    return res.data;
  }
  async stream({ uri, method = "POST", body = {}, headers = {}, onChunk }) {
    await this.refreshTokenIfNeeded();

    const url = new URL(uri, this.baseURL);
    const finalHeaders = this.buildHeaders(headers);

    try {
      const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: JSON.stringify(body),
      });
      console.log(response.headers)
      // if (!response.ok || !response.body) {
      //   throw new Error(`Streaming failed with status ${response.status}`);
      // }
    
      const decoder = new TextDecoder("utf-8");
      const reader = response.body.getReader();
    
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
    
        const chunk = decoder.decode(value, { stream: true });
        onChunk?.(chunk); // <-- dùng callback
      }
      
    } catch (error) {
      console.log(error);
    }
  }
}
module.exports = new UnltdaiClient();
