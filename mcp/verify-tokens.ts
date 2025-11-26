import dotenv from "dotenv";
import path from "path";

// Carregar variáveis de ambiente
const envPath = path.join(process.cwd(), "mcp", ".env");
dotenv.config({ path: envPath });

console.log("🔍 Verificando tokens do Slack...\n");

const botToken = process.env.SLACK_BOT_TOKEN;
const appToken = process.env.SLACK_APP_TOKEN;
const signingSecret = process.env.SLACK_SIGNING_SECRET;

// Verificar formato dos tokens
console.log("📋 Verificação de formato:\n");

if (!botToken) {
  console.log("❌ SLACK_BOT_TOKEN: NÃO ENCONTRADO");
} else if (!botToken.startsWith("xoxb-")) {
  console.log(`❌ SLACK_BOT_TOKEN: Formato inválido (deve começar com xoxb-)`);
  console.log(`   Valor atual: ${botToken.substring(0, 10)}...`);
} else {
  console.log(`✅ SLACK_BOT_TOKEN: Formato OK (${botToken.substring(0, 15)}...)`);
}

if (!appToken) {
  console.log("❌ SLACK_APP_TOKEN: NÃO ENCONTRADO");
} else if (!appToken.startsWith("xapp-")) {
  console.log(`❌ SLACK_APP_TOKEN: Formato inválido (deve começar com xapp-)`);
  console.log(`   Valor atual: ${appToken.substring(0, 10)}...`);
} else {
  console.log(`✅ SLACK_APP_TOKEN: Formato OK (${appToken.substring(0, 15)}...)`);
}

if (!signingSecret) {
  console.log("❌ SLACK_SIGNING_SECRET: NÃO ENCONTRADO");
} else if (signingSecret.length < 30) {
  console.log(`❌ SLACK_SIGNING_SECRET: Muito curto (pode estar incorreto)`);
  console.log(`   Valor atual: ${signingSecret.substring(0, 10)}...`);
} else {
  console.log(`✅ SLACK_SIGNING_SECRET: Formato OK (${signingSecret.substring(0, 15)}...)`);
}

console.log("\n📝 Dicas para corrigir:");
console.log("1. SLACK_BOT_TOKEN: Vá em OAuth & Permissions → Bot User OAuth Token");
console.log("2. SLACK_APP_TOKEN: Vá em Socket Mode → App-Level Tokens → Generate New Token");
console.log("3. SLACK_SIGNING_SECRET: Vá em Basic Information → App Credentials → Signing Secret");
console.log("\n💡 Certifique-se de copiar os tokens COMPLETOS, sem espaços extras!");

