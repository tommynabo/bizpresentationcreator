const { google } = require('googleapis');
require('dotenv').config();

// Initialize OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// We will set credentials dynamically when passed from the server
// Or we can rely on the global client if we manage tokens globally (simple for single user)
// For this simple app, we'll assign the global tokens.

const slides = google.slides({ version: 'v1', auth: oauth2Client });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

const TEMPLATE_ID = '14Gc4mhOtCVoZbOj-L3m_ELHFm-oWPuQAoWF2RKZIHqA';

function setCredentials(tokens) {
    oauth2Client.setCredentials(tokens);
}

function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/presentations'
        ],
    });
}

async function getToken(code) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

async function createPresentation(title, data) {
    console.log(`Creating presentation: ${title}`);

    // 1. Copy Template
    const copyRes = await drive.files.copy({
        fileId: TEMPLATE_ID,
        requestBody: {
            name: title,
        },
    });
    const presentationId = copyRes.data.id;
    console.log(`Presentation copied: ${presentationId}`);

    // 2. Prepare Requests
    // ... [Logic remains mostly the same, simplified for brevity as logic is identical] ...

    // --- Deletions ---
    // User requested to keep all slides (10 slides in total).
    // Removing the deletion logic.
    const requests = [];

    // --- Replacements ---
    const replacements = {
        "{{OUR_COMPANY_TITLE}}": data.OUR_COMPANY_TITLE,
        "{{OUR_COMPANY_PARAGRAPH}}": data.OUR_COMPANY_PARAGRAPH,
        "{{QUOTE_TEXT}}": data.AWESOME_WORDS_QUOTE,
        "{{QUOTE_AUTHOR}}": data.AWESOME_WORDS_AUTHOR,
        "{{ASPIRATIONS_NOW_TITLE}}": "Ahora",
        "{{ASPIRATIONS_NOW_TEXT}}": data.ASPIRATIONS_NOW,
        "{{ASPIRATIONS_FUTURE_TITLE}}": "Futuro",
        "{{ASPIRATIONS_FUTURE_TEXT}}": data.ASPIRATIONS_FUTURE,
        "{{REQUIREMENTS_INTELLIGENCE}}": data.REQUIREMENTS_INTELLIGENCE,
        "{{REQUIREMENTS_ADAPTABILITY}}": data.REQUIREMENTS_ADAPTABILITY,
        "{{REQUIREMENTS_SKILLS}}": data.REQUIREMENTS_SKILLS,
        "{{REQUIREMENTS_FOCUS}}": data.REQUIREMENTS_FOCUS,
        "{{PROJECT_GOAL_1}}": data.PROJECT_GOAL_1,
        "{{PROJECT_GOAL_2}}": data.PROJECT_GOAL_2,
        "{{PROJECT_GOAL_3}}": data.PROJECT_GOAL_3,
        "{{AI_NUTSHELL_1}}": data.AI_NUTSHELL_LIST?.[0] || "",
        "{{AI_NUTSHELL_2}}": data.AI_NUTSHELL_LIST?.[1] || "",
        "{{AI_NUTSHELL_3}}": data.AI_NUTSHELL_LIST?.[2] || "",
        "{{PROJECT_STAGE_1}}": data.PROJECT_STAGE_1,
        "{{PROJECT_STAGE_2}}": data.PROJECT_STAGE_2,
        "{{PROJECT_STAGE_3}}": data.PROJECT_STAGE_3,
        "{{TIMELINE_DAY_1}}": data.TIMELINE_DAY_1,
        "{{TIMELINE_DAY_2}}": data.TIMELINE_DAY_2,
        "{{TIMELINE_DAY_3}}": data.TIMELINE_DAY_3,
        "{{TIMELINE_DAY_4}}": data.TIMELINE_DAY_4,
        "{{TEAM_MEMBER_1_NAME}}": data.TEAM_MEMBER_1_NAME,
        "{{TEAM_MEMBER_1_DESC}}": data.TEAM_MEMBER_1_DESC,
        "{{TEAM_MEMBER_2_NAME}}": data.TEAM_MEMBER_2_NAME,
        "{{TEAM_MEMBER_2_DESC}}": data.TEAM_MEMBER_2_DESC,
        "{{THANKS_EMAIL}}": data.THANKS_EMAIL,
        "{{THANKS_PHONE}}": data.THANKS_PHONE,
        "{{THANKS_WEBSITE}}": data.THANKS_WEBSITE
    };

    for (const [key, value] of Object.entries(replacements)) {
        requests.push({
            replaceAllText: {
                containsText: { text: key, matchCase: true },
                replaceText: String(value || "")
            }
        });
    }

    // --- NEW: Internal Briefing Slide (Index 0) ---
    // We add a blank slide at the beginning and populate it.
    const briefingSlideId = 'briefing_slide_01';
    const titleBoxId = 'briefing_title_box';
    const bodyBoxId = 'briefing_body_box';

    requests.push({
        createSlide: {
            objectId: briefingSlideId,
            insertionIndex: 0,
            slideLayoutReference: { predefinedLayout: 'BLANK' }
        }
    });

    // Add Title
    requests.push({
        createShape: {
            objectId: titleBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
                pageObjectId: briefingSlideId,
                size: { height: { magnitude: 50, unit: 'PT' }, width: { magnitude: 600, unit: 'PT' } },
                transform: { scaleX: 1, scaleY: 1, translateX: 50, translateY: 50, unit: 'PT' }
            }
        }
    });
    requests.push({
        insertText: {
            objectId: titleBoxId,
            text: `INTERNAL BRIEFING - ${data.OUR_COMPANY_TITLE || 'CLIENTE'}`
        }
    });
    requests.push({
        updateTextStyle: {
            objectId: titleBoxId,
            style: { fontSize: { magnitude: 18, unit: 'PT' }, bold: true, foregroundColor: { opaqueColor: { rgbColor: { red: 0.8, green: 0, blue: 0 } } } },
            fields: 'fontSize,bold,foregroundColor'
        }
    });

    // Add Body Text
    const briefingText =
        `RESUMEN:\n${data.INTERNAL_BRIEF_SUMMARY || 'N/A'}\n\n` +
        `SISTEMA SUGERIDO:\n${data.INTERNAL_BRIEF_SYSTEM || 'N/A'}\n\n` +
        `INFO RELEVANTE:\n${data.INTERNAL_BRIEF_INFO || 'N/A'}`;

    requests.push({
        createShape: {
            objectId: bodyBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
                pageObjectId: briefingSlideId,
                size: { height: { magnitude: 300, unit: 'PT' }, width: { magnitude: 600, unit: 'PT' } },
                transform: { scaleX: 1, scaleY: 1, translateX: 50, translateY: 120, unit: 'PT' }
            }
        }
    });
    requests.push({
        insertText: {
            objectId: bodyBoxId,
            text: briefingText
        }
    });
    requests.push({
        updateTextStyle: {
            objectId: bodyBoxId,
            style: { fontSize: { magnitude: 10, unit: 'PT' }, fontFamily: 'Arial' },
            fields: 'fontSize,fontFamily'
        }
    });


    if (requests.length > 0) {
        await slides.presentations.batchUpdate({
            presentationId,
            requestBody: { requests },
        });
    }

    return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}

module.exports = { createPresentation, getAuthUrl, getToken, setCredentials };
