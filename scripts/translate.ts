import OpenAI from "openai";
import fs from "fs";
import path from "path";

const LOCALES_DIR = path.resolve(
    __dirname,
    "../apps/extension/src/i18n/locales"
);
const EN_PATH = path.join(LOCALES_DIR, "en.json");
const LANGUAGES_PATH = path.resolve(__dirname, "../languages.json");

interface Language {
    code: string;
    name: string;
    englishName: string;
}

async function main() {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const enContent = JSON.parse(fs.readFileSync(EN_PATH, "utf-8"));
    const languages: Language[] = JSON.parse(
        fs.readFileSync(LANGUAGES_PATH, "utf-8")
    );

    console.log(`Source: en.json`);
    console.log(`Target languages: ${languages.map((l) => l.name).join(", ")}\n`);

    for (const lang of languages) {
        console.log(`Translating to ${lang.name} (${lang.code})...`);

        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.2,
            messages: [
                {
                    role: "system",
                    content: `You are a professional translator specializing in software localization. You are translating the UI of a browser extension that helps users compose emails. The extension provides a form where users define their communicative goal (e.g. inform, request, apologize), set the tone, length, and urgency of the email, and then generates a draft reply.

Translate the following JSON i18n file from English to ${lang.englishName} (${lang.code}).

Rules:
- Preserve ALL JSON keys exactly as they are (do not translate keys).
- Only translate the string values.
- Translations should feel natural and idiomatic in ${lang.englishName}, not overly literal.
- Use terminology conventional for email and messaging UIs in ${lang.englishName}.
- Preserve interpolation placeholders like {{number}} exactly as they are.
- Return ONLY valid JSON, no markdown, no explanation.`,
                },
                {
                    role: "user",
                    content: JSON.stringify(enContent, null, 2),
                },
            ],
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
            console.error(`  No response for ${lang.name}, skipping.`);
            continue;
        }

        try {
            const translated = JSON.parse(content);
            const outPath = path.join(LOCALES_DIR, `${lang.code}.json`);
            fs.writeFileSync(outPath, JSON.stringify(translated, null, 2) + "\n");
            console.log(`  Saved ${outPath}`);
        } catch {
            console.error(`  Failed to parse response for ${lang.name}:`);
            console.error(`  ${content.substring(0, 200)}`);
        }
    }

    console.log("\nDone!");
}

main().catch(console.error);
