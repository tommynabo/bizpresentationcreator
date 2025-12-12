function cleanConversation(text) {
    if (!text) return "";

    let clean = text;

    // Remove LinkedIn artifacts
    clean = clean.replace(/Eliminar reacción.*?(?=\s[A-ZÁÉÍÓÚÑ]|$)/gi, " ");
    clean = clean.replace(/\s+ha enviado los siguientes mensajes a las\s+\d{1,2}:\d{2}/gi, "");
    clean = clean.replace(/\s+ha enviado el siguiente mensaje a las\s+\d{1,2}:\d{2}/gi, "");
    clean = clean.replace(/Ver el perfil de /gi, "");
    clean = clean.replace(/\b\d{1,2}\s?(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/gi, ""); // Dates
    clean = clean.replace(/\b\d{1,2}:\d{2}\b/g, ""); // Times

    // Remove Emojis (Simple range)
    clean = clean.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/gu, "");

    // Normalize whitespace
    clean = clean.replace(/\s{2,}/g, " ").trim();

    return clean;
}

module.exports = { cleanConversation };
