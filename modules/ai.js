const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateSlideContent(profileText, conversationText, websiteUrl) {
    console.log('Generating slide content with OpenAI...');

    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY in .env");
    }

    // ESTRATEGIA DE VENTAS: GAP SELLING / SPIN SELLING SIMPLIFICADO
    // OBJETIVO: Vender una "Demo de Bajo Coste" (Paid Pilot).
    // TONO: Joven experto, directo, entusiasta pero "al grano".

    const systemPrompt = `Eres un "Sales Coach" de élite para un consultor joven de IA.
    Tu objetivo NO es vender un proyecto millonario hoy, sino VENDER LA IDEA DE UNA DEMO DE BAJO COSTE.
    
    Genera una presentación que sirva de GUIÓN para que el usuario tome el control de la llamada.
    El usuario tiene problemas para "hacer preguntas dolorosas" y "cerrar".
    Tú debes escribir esas preguntas por él.
    
    ESTRUCTURA DE LA LLAMADA (Reflejada en las slides):
    1. CONTEXTO: Entendemos tu negocio (Rapport rápido).
    2. EL DOLOR (The Gap): Preguntas incómodas para ver por qué no venden más.
    3. LA SOLUCIÓN: Automatización con IA.
    4. EL CIERRE: Proponemos una "Demo Piloto" para validar sin riesgo.
    
    REGLAS DE ORO (AAT - Anti-Text-Overflow):
    - CADA HUECO TIENE UN LIMITE DE PALABRAS ESTRICTO.
    - Si te pasas, el diseño se rompe. SÉ EXTREMADAMENTE CONCISO.
    - No uses frases de relleno. Ve al grano.
    
    Formato de salida: JSON válido.`;

    const userPrompt = `
    LEAD: ${profileText}
    CONVERSACIÓN PREVIA: ${conversationText}
    WEB: ${websiteUrl || "N/A"}

    Completa este JSON (respeta los límites de palabras MÁXIMOS):

    {
    // SLIDE 1: PORTADA
    "OUR_COMPANY_TITLE": "Texto corto y punchy sobre SU empresa (máx 5 palabras)",
    "OUR_COMPANY_PARAGRAPH": "Resumen de a qué se dedican (máx 15 palabras)",

    // SLIDE 4: FRASE "YO ELIJO" (Rapport)
    "AWESOME_WORDS_QUOTE": "Frase sobre su éxito o visión (máx 12 palabras)",
    "AWESOME_WORDS_AUTHOR": "Nombre del Lead",

    // SLIDE 5: ASPIRACIONES (GAP ACTUAL VS FUTURO)
    "ASPIRATIONS_NOW": "Estado actual con problema (ej: 'Ventas manuales lentas') (máx 6 palabras)",
    "ASPIRATIONS_FUTURE": "Estado deseado (ej: 'Cierres automáticos 24/7') (máx 6 palabras)",

    // SLIDE 6: DISCOVERY - LOS 4 PILARES (Preguntas de "Dolor")
    // Aquí el usuario necesita ayuda. Escribe QUÉ DEBE INVESTIGAR en cada área.
    "REQUIREMENTS_INTELLIGENCE": "¿Tienen datos claros o van a ciegas? (máx 8 palabras)",
    "REQUIREMENTS_ADAPTABILITY": "¿Su proceso actual escala o colapsa? (máx 8 palabras)",
    "REQUIREMENTS_SKILLS": "¿El equipo pierde tiempo en tareas admin? (máx 8 palabras)",
    "REQUIREMENTS_FOCUS": "¿Dónde pierden más dinero hoy? (máx 8 palabras)",

    // SLIDE 13: PREGUNTAS INCÓMODAS (El Guión para el usuario)
    // Escribe 3 preguntas DIRECTAS que el usuario debe leerle al cliente para "hacer daño" (sacar el dolor).
    "PROJECT_GOAL_1": "Ej: ¿Cuánto dinero dejáis en la mesa por X? (máx 10 palabras)",
    "PROJECT_GOAL_2": "Ej: ¿Qué pasa si no arregláis esto en 6 meses? (máx 10 palabras)",
    "PROJECT_GOAL_3": "Ej: ¿Por qué arreglarlo ahora y no luego? (máx 10 palabras)",

    // SLIDE 15: OPORTUNIDADES DE LA DEMO (El "Queso")
    // 3 cosas concretas que la Demo/Piloto demostrará.
    "AI_NUTSHELL_LIST": [
        "Demo: Automatizar cualificación (máx 6 palabras)",
        "Demo: Reactivación de leads (máx 6 palabras)",
        "Demo: Agendamiento automático (máx 6 palabras)"
    ],

    // SLIDE 20: HOJA DE RUTA (El Cierre de la Demo)
    "PROJECT_STAGE_1": "Fase 1: Auditoría Express (máx 4 palabras)",
    "PROJECT_STAGE_2": "Fase 2: Creación Demo Piloto (máx 4 palabras)",
    "PROJECT_STAGE_3": "Fase 3: Validación y Rollout (máx 4 palabras)",

    // SLIDE 21: AGENDA DE LA LLAMADA (Para que el usuario controle el tiempo)
    "TIMELINE_DAY_1": "0-5': Tu Situación",
    "TIMELINE_DAY_2": "5-10': Tus Cuellos de Botella",
    "TIMELINE_DAY_3": "10-20': Cómo la IA lo soluciona",
    "TIMELINE_DAY_4": "20-30': Acuerdo Demo Piloto",

    // SLIDE 24: EQUIPO
    "TEAM_MEMBER_1_NAME": "Nombre Lead",
    "TEAM_MEMBER_1_DESC": "Cliente",
    "TEAM_MEMBER_2_NAME": "Tomás (Tú)",
    "TEAM_MEMBER_2_DESC": "Sales Engineer",

    // SLIDE 25: CONTACTO
    "THANKS_EMAIL": "tomas@email.com",
    "THANKS_PHONE": "+34 600 000 000",
    "THANKS_WEBSITE": "BizSlides.ai",

    // INTERNAL SLIDE: BRIEFING (SALES BATTLE CARD)
    // PARTE A: CONTEXTO RÁPIDO
    "BRIEF_CONTEXT_WHO": "Quién es (máx 20 palabras)",
    "BRIEF_CONTEXT_PAIN": "Su Dolor principal (máx 20 palabras)",
    "BRIEF_CONTEXT_STATUS": "Estado actual / Sistema híbrido (máx 20 palabras)",
    "BRIEF_CONTEXT_HOOK": "Tu Gancho / Propuesta de valor (máx 20 palabras)",

    // PARTE B: GUION ESCANEABLE
    "BRIEF_SCRIPT_ICEBREAKER": "1. Hielo: Frase de rapport sobre su contexto (máx 30 palabras)",
    "BRIEF_SCRIPT_DIAGNOSIS_1": "2. Diagnóstico: Pregunta clave 1 (máx 20 palabras)",
    "BRIEF_SCRIPT_DIAGNOSIS_2": "2. Diagnóstico: Pregunta clave 2 (máx 20 palabras)",
    "BRIEF_SCRIPT_DIAGNOSIS_3": "2. Diagnóstico: Pregunta clave 3 (máx 20 palabras)",
    "BRIEF_SCRIPT_SOLUTION": "3. La Solución (Tu IA): Pitch corto (máx 40 palabras)",
    "BRIEF_SCRIPT_CLOSING": "4. Cierre: Propuesta de piloto (máx 30 palabras)"
    }
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
    });

    const content = JSON.parse(response.choices[0].message.content);
    return content;
}

module.exports = { generateSlideContent };
