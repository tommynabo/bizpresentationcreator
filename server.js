const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Import Modules
const linkedin = require('./modules/linkedin');
const ai = require('./modules/ai');
const slides = require('./modules/slides');
const utils = require('./modules/utils');
const fs = require('fs');
const path = require('path');

// Token Storage
const TOKEN_PATH = path.join(__dirname, 'tokens.json');

// Load tokens on startup (File System or Env Var)
let tokensLoaded = false;

// 1. Try Environment Variable (Vercel / Production)
if (process.env.GOOGLE_TOKENS) {
    try {
        const tokens = JSON.parse(process.env.GOOGLE_TOKENS);
        slides.setCredentials(tokens);
        console.log('Loaded Google Auth tokens from GOOGLE_TOKENS env var.');
        tokensLoaded = true;
    } catch (e) {
        console.error('Failed to parse GOOGLE_TOKENS env var:', e);
    }
}

// 2. Try Local File (Development)
if (!tokensLoaded && fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    slides.setCredentials(tokens);
    console.log('Loaded Google Auth tokens from disk.');
    tokensLoaded = true;
}

// OAuth Routes
app.get('/auth/google', (req, res) => {
    const url = slides.getAuthUrl();
    res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    try {
        const tokens = await slides.getToken(code);
        slides.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        res.redirect('/?auth=success');
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.status(500).send('Authentication failed');
    }
});

app.get('/api/check-auth', (req, res) => {
    res.json({ authenticated: fs.existsSync(TOKEN_PATH) });
});

// Main API Endpoint
app.post('/api/generate-presentation', async (req, res) => {
    try {
        // Enforce Auth
        if (!fs.existsSync(TOKEN_PATH)) {
            return res.status(401).json({ error: 'Google Auth Required. Please visit /auth/google' });
        }

        const { conversation, linkedinUrl } = req.body;

        if (!conversation || !linkedinUrl) {
            return res.status(400).json({ error: 'Missing conversation or linkedinUrl' });
        }

        console.log(`Starting generation for: ${linkedinUrl}`);

        // 1. Scrape LinkedIn & Website
        const profileData = await linkedin.scrapeLinkedInProfile(linkedinUrl);
        // Note: For now we skip separate Website scraping as profileData includes scraping targetWebsite candidate logic
        // If we wanted to scrape the content of that website, we would add another call here.

        // 2. Clean Conversation
        const cleanConv = utils.cleanConversation(conversation);

        // 3. Generate Content (AI)
        const slideContent = await ai.generateSlideContent(
            profileData.profileText,
            cleanConv,
            profileData.targetWebsite
        );

        // 4. Create Slides
        const title = `Sales Lead – ${profileData.profileStructured.fullName}`;
        const presentationUrl = await slides.createPresentation(title, slideContent);

        res.json({
            success: true,
            message: 'Presentation generated successfully',
            presentationUrl,
            data: {
                profile: profileData.profileStructured,
                slideContent
            }
        });

    } catch (error) {
        console.error('Error generating presentation:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
