import dotenv from "dotenv";
import { config } from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

console.log("🔍 Verificando configuração...\n");

const requiredVars = [
  "SLACK_BOT_TOKEN",
  "SLACK_SIGNING_SECRET",
  "SLACK_APP_TOKEN",
  "PIXEL_DB_HOST",
  "PIXEL_DB_PORT",
  "PIXEL_DB_NAME",
  "PIXEL_DB_USER",
  "PIXEL_DB_PASSWORD",
];

let allOk = true;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.includes("COLE") || value.includes("your-")) {
    console.log(`❌ ${varName}: NÃO CONFIGURADO`);
    allOk = false;
  } else {
    // Mascarar tokens sensíveis
    const masked =
      varName.includes("TOKEN") || varName.includes("SECRET") || varName.includes("PASSWORD")
        ? value.substring(0, 10) + "..." + value.substring(value.length - 4)
        : value;
    console.log(`✅ ${varName}: ${masked}`);
  }
});

console.log("\n");

if (allOk) {
  console.log("✅ Todas as variáveis estão configuradas!");
  console.log("🚀 Você pode executar o servidor com: npm run dev:mcp");
} else {
  console.log("❌ Por favor, complete o arquivo .env com os valores corretos");
}

