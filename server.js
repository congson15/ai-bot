import express from 'express';
import axios from 'axios';
import cron from 'node-cron';

const app = express();
app.use(express.json());

const baseURL = 'https://zlqabhikjyyahrmpjvil.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpscWFiaGlranl5YWhybXBqdmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MTI5MDQsImV4cCI6MjAzMjk4ODkwNH0._MdlOdUp2ZVT8sv8huRY4Vb7OwaRCJxInFpuTzHGRy8';
let accessToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Ii9Id0xVaWZ3WTF4MFdHbFQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3pscWFiaGlranl5YWhybXBqdmlsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI5NDMxMTMzOS0yZDRkLTQ3MzYtYjlhMy0xN2NkZWUxM2U5ZWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5NjMxMzUxLCJpYXQiOjE3NDk2Mjc3NTEsImVtYWlsIjoiZGZkOHh5NDY4bUBwcml2YXRlcmVsYXkuYXBwbGVpZC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImFwcGxlIiwicHJvdmlkZXJzIjpbImFwcGxlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImN1c3RvbV9jbGFpbXMiOnsiYXV0aF90aW1lIjoxNzQ5NjI3NzQ4LCJpc19wcml2YXRlX2VtYWlsIjp0cnVlfSwiZW1haWwiOiJkZmQ4eHk0NjhtQHByaXZhdGVyZWxheS5hcHBsZWlkLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwcm92aWRlcl9pZCI6IjAwMTc1Mi42YzdjY2I0NTcxNmM0YWQ5OTI0Njg2MWM0YzRmMjhkZS4xMjQ4Iiwic3ViIjoiMDAxNzUyLjZjN2NjYjQ1NzE2YzRhZDk5MjQ2ODYxYzRjNGYyOGRlLjEyNDgifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTc0OTYyNzc1MX1dLCJzZXNzaW9uX2lkIjoiYTM3YTBiNTQtZjUyMy00N2ZmLTg0ZGYtOGI2MjM5MjI3ZmE4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.vNVLZ25fpERpfOEPnOLt-kbORvNI027Xa9dyJzIZ4G8';
let refreshToken = '46aai6zniaup';
let tokenExpiry = 1749631424;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function refreshTokenIfNeeded(force = false) {
    const now = Math.floor(Date.now() / 1000);
    if (!force && now < tokenExpiry - 300) {
        console.log(`[CRON] Token valid until ${new Date(tokenExpiry * 1000).toISOString()}`);
        return;
    };

    try {
        const res = await axios.post(`${baseURL}/auth/v1/token?grant_type=refresh_token`, {
            refresh_token: refreshToken
        }, {
            headers: { apikey: apiKey }
        });

        accessToken = res.data.access_token;
        refreshToken = res.data.refresh_token;
        tokenExpiry = now + res.data.expires_in;
        console.log(`[CRON] ✅ Token refreshed at ${new Date().toISOString()}`);
    } catch (err) {
        console.error('[CRON] ❌ Token refresh failed:', err.message);
    }
}

// 👉 Cron job: chạy mỗi 4 phút (*/4 * * * *)
cron.schedule('*/4 * * * *', async () => {
    await refreshTokenIfNeeded(true);
});

export async function fetchBotList({ sortBy = 'createdAt:desc', limit = 15 } = {}) {
    await refreshTokenIfNeeded();

    const { accessToken, apiKey } = getFullToken();

    const res = await axios.post(`${baseURL}/functions/v1/fetch-unltdai`, {
        uri: 'bots/',
        method: 'GET',
        options: {
            query: {
                sortBy,
                limit
            }
        }
    }, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: apiKey,
            'Content-Type': 'application/json',
            'User-Agent': 'UNLTDAI/37 CFNetwork/3826.500.131 Darwin/24.5.0'
        }
    });

    return res.data;
}

app.get('/bots', async (req, res) => {
    try {
        const { sortBy, limit } = req.query;
        const bots = await fetchBotList({ sortBy, limit: Number(limit) || 15 });
        res.json(bots);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bots', detail: err.message });
    }
});

app.get('/health', async (req, res) => {
    try {
        await refreshTokenIfNeeded();
        const response = await axios.get(`${baseURL}/auth/v1/user`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                apikey: apiKey
            }
        });
        res.json({ status: 'ok', email: response.data });
    } catch (err) {
        res.status(500).json({ status: 'bad', message: 'Token expired or key invalid' });
    }
});

app.listen(3000, () => {
    console.log("🧠 UNLTDAI Proxy (auto-refresh & cron) is live at http://localhost:3000");
});
