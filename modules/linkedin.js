const { ApifyClient } = require('apify-client');
require('dotenv').config();

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

async function scrapeLinkedInProfile(profileUrl) {
    if (!profileUrl) throw new Error('No Profile URL provided');

    console.log(`Scraping LinkedIn Profile: ${profileUrl}`);

    // Input for the Actor
    const input = {
        "includeEmail": false,
        "username": profileUrl
    };

    // Run the Actor: VhxlqQXRwhW8H5hNV (LinkedIn Profile Scraper)
    const run = await client.actor("VhxlqQXRwhW8H5hNV").call(input);

    // Fetch results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
        throw new Error('No profile data found');
    }

    const profile = items[0];
    return processProfileData(profile);
}

function processProfileData(data) {
    const basic = data.basic_info || {};
    const expList = data.experience || [];
    const eduList = data.education || [];
    const langList = data.languages || [];

    // Structured Profile
    const profileStructured = {
        fullName: basic.fullname || "",
        headline: basic.headline || "",
        about: basic.about || "",
        location: basic.location?.full || "",
        profileUrl: basic.profile_url || "",
        currentCompany: basic.current_company || "",
        experience: expList.map(e => ({
            title: e.title || "",
            company: e.company || "",
            duration: e.duration || "",
            isCurrent: e.is_current || false
        })),
        education: eduList.map(ed => ({
            school: ed.school || "",
            degree: ed.degree || "",
            fieldOfStudy: ed.field_of_study || ""
        }))
    };

    // Text Profile for AI
    let profileText = `LEAD INFORMATION\n` +
        `Name: ${basic.fullname || ""}\n` +
        `Headline: ${basic.headline || ""}\n` +
        `Location: ${basic.location?.full || ""}\n` +
        `Current Company: ${basic.current_company || ""}\n` +
        `LinkedIn URL: ${basic.profile_url || ""}\n` +
        `About:\n${basic.about || ""}\n\n`;

    if (expList.length > 0) {
        profileText += `Experience:\n${expList.map(e => `- ${e.title} @ ${e.company} (${e.duration})`).join('\n')}\n\n`;
    }

    // Logic to find Target Website from Profile (ported from n8n)
    const targetWebsite = findTargetWebsite(data);

    return {
        profileStructured,
        profileText,
        targetWebsite
    };
}

function findTargetWebsite(profile) {
    // 1. Collect all text fields
    const texts = [];
    const collectText = (obj) => {
        if (obj && typeof obj === 'object') {
            for (const key in obj) {
                if (typeof obj[key] === 'string') texts.push({ text: obj[key], key });
                else collectText(obj[key]);
            }
        }
    };
    collectText(profile);

    // 2. Extract URLs
    const urlRegex = /https?:\/\/[^\s)"]+|www\.[^\s)"]+/gi;
    let candidates = [];

    for (const item of texts) {
        let match;
        while ((match = urlRegex.exec(item.text)) !== null) {
            let url = match[0].trim();
            if (!url.startsWith('http')) url = 'https://' + url;
            candidates.push({ url, source: item.key });
        }
    }

    // 3. Filter Blacklist
    const blacklist = ['linkedin.com', 'instagram.com', 'facebook.com', 'twitter.com', 'gmail.com', 'yahoo.com', 'hotmail.com'];
    candidates = candidates.filter(c => {
        try {
            const hostname = new URL(c.url).hostname.toLowerCase();
            return !blacklist.some(b => hostname.includes(b));
        } catch { return false; }
    });

    if (candidates.length === 0) return "";

    // 4. Score (Simple version: prefer company)
    // Simply taking the first valid one for now as per "best effort"
    return candidates[0].url;
}

module.exports = { scrapeLinkedInProfile };
