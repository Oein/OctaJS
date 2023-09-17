import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import Octa, { ALL_INTENTS } from "../package";
import { TOKEN } from "./env";
const octabot = new Octa(
  {
    token: TOKEN,
    catchError: true,
    showLogo: true,
  },
  {
    intents: ALL_INTENTS,
  }
);
octabot.command({
  name: "makebtn",
  description: "Make a button",
  async executes(bot, interaction) {
    const confirm = new ButtonBuilder()
      .setCustomId("confirm")
      .setLabel("Confirm")
      .setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder().addComponents(confirm);

    await interaction.reply({
      content: `Hi`,
      components: [row] as any,
    });
  },
});
octabot.event({
  type: "interactionCreate",
  async listener(bot, interaction) {
    if (!interaction.isButton()) return;
    console.log(interaction.customId);
    await interaction.reply({
      content: `You clicked the button!`,
      ephemeral: true,
    });
  },
});
octabot.start();
