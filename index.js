import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle 
} from 'discord.js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// ===== DATABASE SIMPLA =====
const DB_FILE = './database.json';

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ sessions: {} }, null, 2));
}

function saveSession(userId, sessionId) {
  const data = JSON.parse(fs.readFileSync(DB_FILE));
  data.sessions[userId] = sessionId;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getSession(userId) {
  const data = JSON.parse(fs.readFileSync(DB_FILE));
  return data.sessions[userId];
}

// ===== INITIALIZARE CLIENT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

// ====== INREGISTRARE COMANDA /security_training ======
const commands = [
  new SlashCommandBuilder()
    .setName('security_training')
    .setDescription('Inveti cum functioneaza modalurile si sesiunile')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

async function registerCommands() {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✓ Comenzi înregistrate");
  } catch (err) {
    console.error(err);
  }
}
registerCommands();

// ===== EVENT READY =====
client.on('ready', () => {
  console.log(`Bot online ca ${client.user.tag}`);
});

// ===== INTERACTION HANDLER =====
client.on('interactionCreate', async interaction => {

  // ===== SLASH COMMAND =====
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'security_training') {

      const modal = new ModalBuilder()
        .setCustomId('sessionModal')
        .setTitle('Introdu Session-ID (doar educativ)');

      const sessionInput = new TextInputBuilder()
        .setCustomId('sessionField')
        .setLabel('Session-ID')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(sessionInput);

      modal.addComponents(row);

      await interaction.showModal(modal);
    }
  }

  // ===== MODAL SUBMIT =====
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'sessionModal') {
      
      const sessionId = interaction.fields.getTextInputValue('sessionField');

      // salvam session ID local (exercitiu)
      saveSession(interaction.user.id, sessionId);

      const button = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('changeNameBtn')
          .setLabel('Simulare Change Username')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({
        content: "Session-ID salvat în mod sigur (doar pentru simulare).",
        components: [button],
        ephemeral: true
      });
    }
  }

  // ===== BUTTON =====
  if (interaction.isButton()) {
    if (interaction.customId === 'changeNameBtn') {
      
      const modal2 = new ModalBuilder()
        .setCustomId('changeNameModal')
        .setTitle('Simulare schimbare username');

      const nameInput = new TextInputBuilder()
        .setCustomId('newUsername')
        .setLabel('Noul username (simulat)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row2 = new ActionRowBuilder().addComponents(nameInput);

      modal2.addComponents(row2);

      await interaction.showModal(modal2);
    }
  }

  // ===== MODAL 2: CHANGE NAME SIMULATION =====
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'changeNameModal') {
      
      const newName = interaction.fields.getTextInputValue('newUsername');
      const session = getSession(interaction.user.id);

      await interaction.reply({
        content: `✔ Username schimbat (simulare).\n🧩 Session folosit: **${session.substring(0, 6)}...**`,
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
