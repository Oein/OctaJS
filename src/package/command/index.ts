import {
  Client,
  CommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export interface OptionType {
  happy: [cat: number];
}

export type CommandListener = (
  bot: Client,
  interaction: CommandInteraction
) => Promise<any> | any;

export type OptionDefaultType = {
  description: string;
  required: boolean;
};

export type BooleanOption = {
  type: "Boolean";
  sans: string;
};

export type DoubleOption = {
  type: "Double";
  wa: number;
};

export type Option = (BooleanOption | DoubleOption) & OptionDefaultType;
export type Options = { [key: string]: Option };
export type SubCommands = {
  [key: string]: Omit<
    OptionCommand,
    | "subcommands"
    | "subcommandGroups"
    | "name"
    | "nsfw"
    | "DMPermission"
    | "defaultMemberPermissions"
  >;
};
export type SubCommandGroups = {
  [key: string]: {
    description: string;
    subcommands: SubCommands;
  };
};

export type DefaultMemberPermissions = string | number | bigint;

export type SlashCommandBuilderExecutable = Omit<
  SlashCommandBuilder,
  "addSubcommand" | "addSubcommandGroup"
>;

export type BaseCommandType = {
  name: string;
  description: string;
  executes?: CommandListener;
  DMPermission?: boolean;
  defaultMemberPermissions?: DefaultMemberPermissions;
  nsfw?: boolean;
  guild?: string;
};

export type OptionCommand = {
  options?: Options;
} & BaseCommandType;

export type SubcommandCommand = {
  subcommands?: SubCommands;
  subcommandGroups?: SubCommandGroups;
} & Omit<BaseCommandType, "executes">;

export type Command = OptionCommand | SubcommandCommand;

export class CommandBuilder {
  name: string;
  description: string;
  executes?: CommandListener;
  options?: Options;
  subcommands?: SubCommands;
  subcommandGroups?: SubCommandGroups;
  DMPermission?: boolean;
  defaultMemberPermissions?: DefaultMemberPermissions;
  nsfw?: boolean;
  guild?: string;

  constructor(props: Command) {
    this.guild = props.guild;
    this.name = props.name;
    this.description = props.description;
    if ((props as OptionCommand).executes)
      this.executes = (props as OptionCommand).executes;
    if ((props as OptionCommand).options)
      this.options = (props as BaseCommandType & OptionCommand).options;
    if ((props as SubcommandCommand).subcommands)
      this.subcommands = (props as SubcommandCommand).subcommands;
    if ((props as SubcommandCommand).subcommandGroups)
      this.subcommandGroups = (props as SubcommandCommand).subcommandGroups;
    this.DMPermission = props.DMPermission;
    this.defaultMemberPermissions = props.defaultMemberPermissions;
    this.nsfw = !!props.nsfw;
  }

  private addBooleanOption(
    slashCommand: SlashCommandBuilderExecutable,
    option: BooleanOption & OptionDefaultType,
    name: string
  ) {
    return slashCommand.addBooleanOption((inp) => {
      return inp
        .setName(name)
        .setDescription(option.description)
        .setRequired(option.required);
    });
  }

  private addOptionToCommand(
    slashCommand: SlashCommandBuilderExecutable,
    options: Options
  ) {
    let optionNames = Object.keys(options);

    optionNames.forEach((name) => {
      let option = options[name];
      switch (option.type) {
        case "Boolean":
          slashCommand = this.addBooleanOption(slashCommand, option, name);
          break;
        default:
          break;
      }
    });
    return slashCommand;
  }

  private addSubcommands(slashCommand: SlashCommandSubcommandsOnlyBuilder) {
    let subcommands = this.subcommands!;
    let subcommandNames = Object.keys(subcommands);
    subcommandNames.forEach((name) => {
      let subcommand = subcommands[name];
      slashCommand.addSubcommand((cmd) => {
        cmd.setName(name);
        cmd.setDescription(subcommand.description);
        if (subcommand.options)
          cmd = this.addOptionToCommand(
            cmd as any as SlashCommandBuilderExecutable,
            subcommand.options
          ) as any as SlashCommandSubcommandBuilder;
        return cmd;
      });
    });
    return slashCommand;
  }

  private addSubcommandGroups(
    slashCommand: SlashCommandSubcommandsOnlyBuilder
  ) {
    let subcommandGroups = this.subcommandGroups!;
    let names = Object.keys(subcommandGroups);
    names.forEach((name) => {
      let groupCommand = subcommandGroups[name];
      slashCommand = slashCommand.addSubcommandGroup((group) => {
        group.setName(name);
        group.setDescription(groupCommand.description);
        let subCommands = groupCommand.subcommands;
        let subNames = Object.keys(subCommands);
        subNames.forEach((name) => {
          let sub = subCommands[name];
          group.addSubcommand((inp) => {
            inp.setName(name);
            inp.setDescription(sub.description);
            if (sub.options)
              inp = this.addOptionToCommand(inp as any, sub.options) as any;
            return inp;
          });
        });
        return group;
      });
    });
    return slashCommand;
  }

  private getBaseBuilder() {
    return new SlashCommandBuilder()
      .setDMPermission(this.DMPermission)
      .setDescription(this.description)
      .setDefaultMemberPermissions(this.defaultMemberPermissions)
      .setName(this.name)
      .setNSFW(this.nsfw);
  }

  public build() {
    // Sub command가 없을때만 option을 추가
    if (this.options && !this.subcommands) {
      let slashCommand = this.addOptionToCommand(
        this.getBaseBuilder() as SlashCommandBuilderExecutable,
        this.options
      );

      return slashCommand;
    }

    // Option이 없을때만 Subcommand 추가
    if (!this.options && (this.subcommands || this.subcommandGroups)) {
      let slashCommand =
        this.getBaseBuilder() as SlashCommandSubcommandsOnlyBuilder;

      if (this.subcommands) slashCommand = this.addSubcommands(slashCommand);
      if (this.subcommandGroups)
        slashCommand = this.addSubcommandGroups(slashCommand);

      return slashCommand;
    }

    return this.getBaseBuilder();
  }
}
