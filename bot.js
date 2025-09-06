[08:20, 6/9/2025] Lc Proyectos: 738,-70.726685,15z
[11:21, 6/9/2025] LCR Proyectos: require('dotenv').config();
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
    }
});

client.on('qr', (qr) => {
    console.log('🔄 [QR] Escanéame desde WhatsApp Web en tu celular:');
    require('qrcode-terminal').generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('✅ WhatsApp Bot listo y conectado!');
});

async function askAI(prompt) {
    try {
        const systemPrompt = `
Eres un erudito en Torá, Tanaj, Talmud y Parashot Semanales. 
Responde con claridad, citas exactas (capítulo:versículo), y menciona fuentes clásicas cuando sea posible (Rashi, Ramban, Midrash, etc.).
Si no estás seguro, di "No tengo una fuente clara sobre esto" en lugar de inventar.
Habla con respeto y tono educativo.
`;

        const fullPrompt = ${systemPrompt}\n\nPregunta del usuario: ${prompt};

        const response = await axios.post(
            "https://api-inference.huggingface.co/models/SaulBareli/judaica-llama3",
            {
                inputs: fullPrompt,
                parameters: {
                    max_new_tokens: 512,
                    temperature: 0.3,
                    return_full_text: false
                }
            },
            {
                headers: { Authorization: Bearer ${process.env.HF_API_TOKEN} }
            }
        );

        let text = response.data[0]?.generated_text || "Lo siento, no pude generar una respuesta.";
        
        if (text.includes("Pregunta del usuario:")) {
            text = text.split("Pregunta del usuario:")[0].trim();
        }

        return text;

    } catch (error) {
        console.error("Error con IA:", error.response?.data || error.message);
        return "Estoy consultando las fuentes... ¡Vuelve a intentarlo en 1 minuto! (Puede que el modelo esté cargando)";
    }
}

client.on('message', async (msg) => {
    try {
        const body = msg.body.trim().toLowerCase();

        if (body === "ayuda" || body === "comandos") {
            await msg.reply(`
📖 Comandos disponibles:
- "Parashá de esta semana"
- "Explícame [capítulo:versículo]"
- "¿Qué dice la Torá sobre [tema]?"
- "Comentario de Rashi sobre [versículo]"
- "Resumen de [nombre de parashá]"

🤖 Pregunta con claridad y citaré fuentes siempre que pueda.
`);
            return;
        }

        if (body.includes("parashá de esta semana") || body.includes("parashat hashavua")) {
            await msg.reply("📆 Esta semana leemos Parashat [Nombre]. ¿Quieres un resumen, los temas principales o los comentarios de Rashi?");
            return;
        }

        if (body.includes("bereshit 1") || body.includes("génesis 1")) {
            await msg.reply("🌌 Bereshit 1 relata la Creación del mundo en 6 días. ¿Quieres el texto, el comentario de Rashi, o una explicación jasídica?");
            return;
        }

        if (body.includes("qué dice la torá sobre")) {
            await msg.reply("📚 Por favor, completa tu pregunta: ¿Qué dice la Torá sobre [tema]? y te daré una respuesta con fuentes.");
            return;
        }

        console.log(📩 Pregunta recibida: ${msg.body});
        const respuesta = await askAI(msg.body);
        await msg.reply(respuesta);

    } catch (error) {
        console.error("Error respondiendo:", error);
        await msg.reply("⚠️ Lo siento, hubo un error. Estoy aprendiendo de la Torá también 😊");
    }
});

client.initialize();

app.get('/', (req, res) => {
    res.send('🤖 WhatsApp + Torá Bot activo en Render.com');
});

app.listen(PORT, () => {
    console.log(🌐 Servidor web corriendo en puerto ${PORT});
});
