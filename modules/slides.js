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



// Ensure "Clientes" folder exists and return its ID
async function ensureClientesFolder() {
    const folderName = 'Clientes';
    const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;

    try {
        const res = await drive.files.list({
            q: q,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (res.data.files.length > 0) {
            console.log(`Folder '${folderName}' found: ${res.data.files[0].id}`);
            return res.data.files[0].id;
        } else {
            console.log(`Folder '${folderName}' not found. Creating it...`);
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            };
            const file = await drive.files.create({
                resource: fileMetadata,
                fields: 'id',
            });
            console.log(`Folder '${folderName}' created: ${file.data.id}`);
            return file.data.id;
        }
    } catch (err) {
        console.error('Error ensuring Clientes folder:', err);
        throw err; // Propagate error
    }
}

async function createPresentation(title, data) {
    console.log(`Creating presentation: ${title}`);

    // 1. Copy Template
    const copyRes = await drive.files.copy({
        fileId: TEMPLATE_ID,
        requestBody: {
            name: title,
            parents: [await ensureClientesFolder()] // Move to 'Clientes' folder
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
                size: { height: { magnitude: 40, unit: 'PT' }, width: { magnitude: 650, unit: 'PT' } },
                transform: { scaleX: 1, scaleY: 1, translateX: 30, translateY: 20, unit: 'PT' }
            }
        }
    });
    const titleText = `${data.OUR_COMPANY_TITLE || 'CLIENTE'} (${data.BRIEF_CONTEXT_WHO || 'N/A'})`;
    requests.push({
        insertText: {
            objectId: titleBoxId,
            text: titleText.toUpperCase()
        }
    });
    requests.push({
        updateTextStyle: {
            objectId: titleBoxId,
            style: { fontSize: { magnitude: 14, unit: 'PT' }, bold: true, foregroundColor: { opaqueColor: { rgbColor: { red: 0, green: 0, blue: 0 } } } },
            fields: 'fontSize,bold,foregroundColor'
        }
    });

    // Add Battle Card Body
    const briefingText =
        `🧠 PARTE A: CONTEXTO RÁPIDO\n` +
        `• Quién es: ${data.BRIEF_CONTEXT_WHO || 'N/A'}\n` +
        `• Dolor: ${data.BRIEF_CONTEXT_PAIN || 'N/A'}\n` +
        `• Estado: ${data.BRIEF_CONTEXT_STATUS || 'N/A'}\n` +
        `• Gancho: ${data.BRIEF_CONTEXT_HOOK || 'N/A'}\n\n` +

        `📝 PARTE B: GUION ESCANEABLE\n` +
        `${data.BRIEF_SCRIPT_ICEBREAKER || 'N/A'}\n` +
        `\n❓ Diagnóstico:\n` +
        `- ${data.BRIEF_SCRIPT_DIAGNOSIS_1 || 'N/A'}\n` +
        `- ${data.BRIEF_SCRIPT_DIAGNOSIS_2 || 'N/A'}\n` +
        `- ${data.BRIEF_SCRIPT_DIAGNOSIS_3 || 'N/A'}\n` +
        `\n💡 Solución: ${data.BRIEF_SCRIPT_SOLUTION || 'N/A'}\n` +
        `🤝 Cierre: ${data.BRIEF_SCRIPT_CLOSING || 'N/A'}`;


    requests.push({
        createShape: {
            objectId: bodyBoxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
                pageObjectId: briefingSlideId,
                size: { height: { magnitude: 350, unit: 'PT' }, width: { magnitude: 650, unit: 'PT' } },
                transform: { scaleX: 1, scaleY: 1, translateX: 30, translateY: 60, unit: 'PT' }
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
            style: {
                fontSize: { magnitude: 9, unit: 'PT' },
                fontFamily: 'Roboto',
                foregroundColor: { opaqueColor: { rgbColor: { red: 0, green: 0, blue: 0 } } } // BLACK TEXT
            },
            fields: 'fontSize,fontFamily,foregroundColor'
        }
    });

    // Make Headers Bold using Range (Approximation: we just set base style, explicit bolding ranges requires more logic or pure text)
    // For simplicity, we keep it uniform but distinct by structure.



    if (requests.length > 0) {
        await slides.presentations.batchUpdate({
            presentationId,
            requestBody: { requests },
        });
    }

    return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}

module.exports = { createPresentation, getAuthUrl, getToken, setCredentials };
