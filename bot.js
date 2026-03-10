import axios from "axios";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bot = new TelegramBot(TOKEN, { polling: false });

const url =
    "https://ticket-api.dramaten.se/api/v1/performances?StartDate=2026-03-10&EndDate=2026-12-31";

let lastStatus = {};

async function checkTickets() {
    try {
        console.log("🔄 Kollar biljetter...");

        const res = await axios.get(url);
        console.log("✅ API svar mottaget");

        const shows = res.data.data.filter(
            (s) => s.title.toLowerCase().includes("fäbodjäntan")
        );

        for (const show of shows) {
            const key = show.startDate;
            const status = show.availabilityStatus;

            if (lastStatus[key] !== status) {
                console.log(`⚠️ Statusändring upptäckt: ${status} (${show.startDate})`);
                lastStatus[key] = status;

                if (status !== "sold-out") {
                    const date = new Date(show.startDate).toLocaleString("sv-SE");
                    const msg =
                        `🎟️ Biljetter till Fäbodjäntan!

Datum: ${date}
Status: ${status}
Pris: ${show.price} kr

Köp biljett:
https://www.dramaten.se/biljetter/forestallningar/fabodjantan/`;
                    try {
                        await bot.sendMessage(CHAT_ID, msg);
                        console.log("📲 NOTIS SKICKAD");
                    } catch (err) {
                        console.error("❌ Telegram-fel:", err.response?.data || err.message);
                    }
                }
            }
        }
    } catch (err) {
        console.error("❌ API-fel:", err.message);
    }
}
checkTickets();