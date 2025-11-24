// 九島鉄道 Discord Bot　©2025Mizuho
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require("discord.js");
const fs = require("fs");

// -----------------------------
// Logging
// -----------------------------
console.log("Bot starting…");

// -----------------------------
// Client設定
// -----------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// -----------------------------
// JSON 操作
// -----------------------------
function loadJson(file) {
    try {
        if (!fs.existsSync(file)) return {};
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
        console.error("JSON Load Error:", err);
        return {};
    }
}

function saveJson(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 4), "utf8");
    } catch (err) {
        console.error("JSON Save Error:", err);
    }
}

// -----------------------------
// スラッシュコマンド登録
// -----------------------------
const commands = [
    new SlashCommandBuilder()
        .setName("schedule")
        .setDescription("「運行情報通知」にメンションし、運行予定情報をチャネルに送信します。")

        .addStringOption(option =>
            option.setName("time")
                  .setDescription("開始時刻を入力してください 例: 10:30 ")
                  .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("line")
                  .setDescription("運行路線を入力してください")
                  .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("note")
                  .setDescription("備考を入力できます")
                  .setRequired(true)
        )
].map(cmd => cmd.toJSON());

// -----------------------------
// Discord APIにコマンド登録
// -----------------------------
const rest = new REST({ version: "10" }).setToken(""); // ← 自分のBotトークン

(async () => {
    try {
        console.log("Registering commands…");
        await rest.put(
            Routes.applicationGuildCommands("1442351250556457013", "1400379077898277005"),
            { body: commands }
        );
        console.log("Commands registered!");
    } catch (e) {
        console.error(e);
    }
})();

// -----------------------------
// Bot起動時イベント
// -----------------------------
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// -----------------------------
// スラッシュコマンド動作
// -----------------------------
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "schedule") {
        try {
            await interaction.deferReply();
            
            const today = new Date();
            const time = interaction.options.getString("time");
            const line = interaction.options.getString("line");
            const note = interaction.options.getString("note") || "なし";
            const month = today.getMonth() + 1;
            const day = today.getDate();
            const mentionRoleId = "1400818424384454748";
            const replyMessage = `<@&${mentionRoleId}>
【運行予定-Schedule】
${line}で運行予定です。
運行開始予定時刻: ${month}月${day}日  ${time}～
備考: ${note}
※まだサーバーは解放しておりませんのでキックはおやめください。`;

            await interaction.editReply(replyMessage);

        } catch (err) {
            console.error("Interaction Error:", err);

            // ここで reply() は使わず、editReply を優先
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: "⚠️ エラーが発生しました  みずほ(COO)に連絡してください", flags: 64 });
                } else {
                    await interaction.reply({ content: "⚠️ エラーが発生しました　みずほ(COO)に連絡してください", flags: 64 });
                }
            } catch (_) {
                console.error("二重応答回避: エラー通知できず");
            }
        }
    }
});

// -----------------------------
// Botログイン
// -----------------------------
client.login("");
