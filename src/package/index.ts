import {
  Awaitable,
  Client,
  ClientEvents,
  ClientOptions,
  GatewayIntentsString,
  REST,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import { EventBuilder, EventListener } from "./event";
import getDM from "./util/getDM";
import { Command, CommandBuilder } from "./command";

let logoPrinted = false;

const ALL_INTENTS: GatewayIntentsString[] = [
  "Guilds",
  "GuildMessageReactions",
  "GuildMessageTyping",
  "GuildMessages",
  "GuildMembers",
  "GuildModeration",
  "GuildEmojisAndStickers",
  "GuildIntegrations",
  "GuildWebhooks",
  "GuildInvites",
  "GuildVoiceStates",
  "GuildPresences",
  "GuildMessageReactions",
  "GuildMessageTyping",
  "DirectMessages",
  "DirectMessageReactions",
  "DirectMessageTyping",
  "MessageContent",
  "GuildScheduledEvents",
  "AutoModerationConfiguration",
  "AutoModerationExecution",
];

function printLogo() {
  if (logoPrinted) return;
  logoPrinted = true;
  console.log(`
                      ██████╗  ██████╗████████╗ █████╗ 
                     ██╔═══██╗██╔════╝╚══██╔══╝██╔══██╗
 You are powered by  ██║   ██║██║        ██║   ███████║
                     ██║   ██║██║        ██║   ██╔══██║
                     ╚██████╔╝╚██████╗   ██║   ██║  ██║
                      ╚═════╝  ╚═════╝   ╚═╝   ╚═╝  ╚═╝  v1
`);
}

export { getDM, EventBuilder, EventListener, ALL_INTENTS };

export type OctaInitProps = {
  token: string;
  catchError?: boolean;
  showLogo?: boolean;
};

export type WorkItem = {
  type: "EVENTS" | "EVENT" | "RAW_JOB";
  job: (...args: any[]) => Promise<any>;
  args?: any[];
};

export default class Octa {
  public bot: Client;
  private token: string;
  private workList: WorkItem[] = [];
  private catchError = false;
  private commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
  private guildCommands: {
    [key: string]: RESTPostAPIChatInputApplicationCommandsJSONBody[];
  } = {};
  constructor(props: OctaInitProps, discordBotOptions: ClientOptions) {
    this.bot = new Client(discordBotOptions);
    this.token = props.token;
    if (typeof props.catchError != "undefined")
      this.catchError = props.catchError;
    if (props.showLogo !== false) printLogo();
  }

  private joinListener<K extends keyof ClientEvents>(event: EventListener<K>) {
    if (!!event.once)
      this.bot.once<K>(event.type, (...l) => {
        if (this.catchError)
          try {
            event.listener(this.bot, ...l);
          } catch (e) {
            console.error(e);
          }
        else event.listener(this.bot, ...l);
      });
    else
      this.bot.on(event.type, (...l) => {
        if (this.catchError)
          try {
            event.listener(this.bot, ...l);
          } catch (e) {
            console.error(e);
          }
        else event.listener(this.bot, ...l);
      });
  }

  public events(eventAdder: (builder: EventBuilder) => EventBuilder) {
    const joinListener = this.joinListener.bind(this);
    this.workList.push({
      type: "EVENTS",
      async job() {
        await eventAdder(new EventBuilder()).listeners.forEach(joinListener);
      },
    });

    return this;
  }

  public event<K extends keyof ClientEvents>(eventListener: EventListener<K>) {
    const joinListener = this.joinListener.bind(this);
    this.workList.push({
      type: "EVENT",
      async job() {
        joinListener(eventListener);
      },
    });
    return this;
  }

  public command(command: Command) {
    let commandBuilded = new CommandBuilder(command);
    let buildedCommand = commandBuilded.build();

    if (!buildedCommand) return this;
    if (command.guild) {
      if (!this.guildCommands[command.guild])
        this.guildCommands[command.guild] = [buildedCommand.toJSON()];
      else this.guildCommands[command.guild].push(buildedCommand.toJSON());
    } else this.commands.push(buildedCommand.toJSON());
    const joinListener = this.joinListener.bind(this);
    this.workList.push({
      type: "EVENT",
      async job() {
        joinListener({
          type: "interactionCreate",
          listener(bot, interaction) {
            if (!interaction.isCommand()) return;
            if (!interaction.isChatInputCommand()) return;
            if (interaction.commandName != command.name) return;
            let sgroup = interaction.options.getSubcommandGroup(false);
            let scmd = interaction.options.getSubcommand(false);

            if (!sgroup && !scmd) {
              if (commandBuilded.executes)
                commandBuilded.executes(bot, interaction);
              return;
            }

            if (!sgroup && scmd) {
              if (
                commandBuilded.subcommands &&
                commandBuilded.subcommands[scmd] &&
                commandBuilded.subcommands[scmd].executes
              )
                commandBuilded.subcommands[scmd].executes!(bot, interaction);
              return;
            }

            if (sgroup && scmd) {
              if (
                commandBuilded.subcommandGroups &&
                commandBuilded.subcommandGroups[sgroup] &&
                commandBuilded.subcommandGroups[sgroup].subcommands[scmd] &&
                commandBuilded.subcommandGroups[sgroup].subcommands[scmd]
                  .executes
              )
                commandBuilded.subcommandGroups[sgroup].subcommands[scmd]
                  .executes!(bot, interaction);
              return;
            }
          },
        });
      },
    });
    return this;
  }

  public runRawJob(job: (bot: Client) => any) {
    this.workList.push({
      type: "RAW_JOB",
      async job(...args) {
        job(args[0]);
      },
      args: [this.bot],
    });
    return this;
  }

  public onStart(
    listener: (bot: Client, ...args: ClientEvents["ready"]) => Awaitable<void>,
    once: boolean = true
  ) {
    this.event({
      type: "ready",
      listener: listener,
      once,
    });
    return this;
  }

  public async start() {
    for (let i = 0; i < this.workList.length; i++) {
      await this.workList[i].job(...(this.workList[i].args || []));
    }
    this.bot.once("ready", async (client) => {
      const rest = new REST().setToken(this.token);
      await rest.put(Routes.applicationCommands(client.user.id), {
        body: this.commands,
      });
      const keys = Object.keys(this.guildCommands);
      for (let i = 0; i < keys.length; i++) {
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, keys[i]),
          {
            body: this.guildCommands[keys[i]],
          }
        );
      }
    });
    return await this.bot.login(this.token);
  }
}
