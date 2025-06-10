import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const baseURL = 'https://zlqabhikjyyahrmpjvil.supabase.co';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpscWFiaGlranl5YWhybXBqdmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MTI5MDQsImV4cCI6MjAzMjk4ODkwNH0._MdlOdUp2ZVT8sv8huRY4Vb7OwaRCJxInFpuTzHGRy8';
let accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpscWFiaGlranl5YWhybXBqdmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MTI5MDQsImV4cCI6MjAzMjk4ODkwNH0._MdlOdUp2ZVT8sv8huRY4Vb7OwaRCJxInFpuTzHGRy8';
let refreshToken = 'zty5pzfhwx6q';
let tokenExpiry = 1749527555;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function refreshTokenIfNeeded() {
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime < tokenExpiry - 300) return; // Valid for >5 min

    try {
        const response = await axios.post(`${baseURL}/auth/v1/token?grant_type=refresh_token`, {
            refresh_token: refreshToken
        }, {
            headers: { apikey: apiKey }
        });

        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
        tokenExpiry = currentTime + response.data.expires_in;
        console.log("[INFO] Token refreshed successfully.");
    } catch (error) {
        console.error("[ERROR] Failed to refresh token:", error.message);
        throw new Error("Token refresh failed");
    }
}

async function callUnltdAI(prompt) {
    await refreshTokenIfNeeded();

    try {
        const response = await axios.post(`${baseURL}/functions/v1/fetch-unltdai`, {
            uri: 'bots/',
            method: 'POST',
            options: { body: { prompt } }
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                apikey: apiKey,
                'Content-Type': 'application/json',
                'User-Agent': 'UNLTDAI/37 CFNetwork/3826.400.120 Darwin/24.3.0'
            }
        });

        return response.data;
    } catch (error) {
        console.error("[ERROR] Failed to call UNLTDAI API:", error.message);
        throw error;
    }
}

app.post('/ask', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    try {
        const result = await callUnltdAI(prompt);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'AI service failed', detail: error.message });
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
    } catch (error) {
        res.status(500).json({ status: 'bad', message: 'Token expired or key invalid' });
    }
});

app.listen(3000, () => {
    console.log("🧠 UNLTDAI Proxy (auto-refresh) is live at http://localhost:3000");
});
