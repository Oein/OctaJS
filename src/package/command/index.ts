import {
  APIApplicationCommandOptionChoice,
  ApplicationCommandOptionAllowedChannelTypes,
  Client,
  CommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

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
};
export type NumberOption = {
  minValue?: number;
  maxValue?: number;
  choices?: APIApplicationCommandOptionChoice<number>[];
  autocomplete?: boolean;
};
export type DoubleOption = {
  type: "Double";
} & NumberOption;
export type IntegerOption = {
  type: "Integer";
} & NumberOption;
export type UserOption = {
  type: "User";
};
export type ChannelOption = {
  type: "Channel";
  channelTypes?: ApplicationCommandOptionAllowedChannelTypes[];
};
export type RoleOption = {
  type: "Role";
};
export type AttachmentOption = {
  type: "Attachment";
};
export type MentionableOption = {
  type: "Mentionable";
};
export type StringOption = {
  type: "String";
  choices?: APIApplicationCommandOptionChoice<string>[];
  autocomplete?: boolean;
  minLength?: number;
  maxLength?: number;
};
export type Option = (
  | BooleanOption
  | DoubleOption
  | IntegerOption
  | UserOption
  | ChannelOption
  | RoleOption
  | AttachmentOption
  | MentionableOption
  | StringOption
) &
  OptionDefaultType;
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

  private addDoubleOption(
    slashCommand: SlashCommandBuilderExecutable,
    option: DoubleOption & OptionDefaultType,
    name: string
  ) {
    slashCommand.addNumberOption((inp) => {
      inp
        .setName(name)
        .setDescription(option.description)
        .setRequired(option.required);
      if (option.minValue) inp.setMinValue(option.minValue);
      if (option.maxValue) inp.setMaxValue(option.maxValue);
      if (option.choices) inp.setChoices(...option.choices);
      if (typeof option.autocomplete != "undefined")
        inp.setAutocomplete(option.autocomplete);
      return inp;
    });
    return slashCommand;
  }

  private addIntegerOption(
    slashCommand: SlashCommandBuilderExecutable,
    option: IntegerOption & OptionDefaultType,
    name: string
  ) {
    slashCommand.addIntegerOption((inp) => {
      inp
        .setName(name)
        .setDescription(option.description)
        .setRequired(option.required);
      if (option.minValue) inp.setMinValue(option.minValue);
      if (option.maxValue) inp.setMaxValue(option.maxValue);
      if (option.choices) inp.setChoices(...option.choices);
      if (typeof option.autocomplete != "undefined")
        inp.setAutocomplete(option.autocomplete);
      return inp;
    });
    return slashCommand;
  }

  private addUserOption(
    slashCommand: SlashCommandBuilderExecutable,
    option: UserOption & OptionDefaultType,
    name: string
  ) {
    return slashCommand.addUserOption((inp) => {
      inp.setName(name);
      inp.setDescription(option.description);
      inp.setRequired(option.required);
      return inp;
    });
  }

  private addChannelOption(
    slashCommand: SlashCommandBuilderExecutable,
    option: ChannelOption & OptionDefaultType,
    name: string
  ) {
    return slashCommand.addChannelOption((inp) => {
      inp.setName(name);
      inp.setDescription(option.description);
      inp.setRequired(option.required);
      if (option.channelTypes) inp.addChannelTypes(...option.channelTypes);
      return inp;
    });
  }

  private addRoleOption(
    slashCommand: SlashCommandBuilderExecutable,
    option: RoleOption & OptionDefaultType,
    name: string
  ) {
    return slashCommand.addRoleOption((inp) => {
      inp.setName(name);
      inp.setDescription(option.description);
      inp.setRequired(option.required);
      return inp;
    });
  }

  private addAttachmentOption(
    slashCommand: SlashCommandBuilderExecutable,
    option: AttachmentOption & OptionDefaultType,
    name: string
  ) {
    return slashCommand.addAttachmentOption((inp) => {
      inp.setName(name);
      inp.setDescription(option.description);
      inp.setRequired(option.required);
      return inp;
    });
  }

  private addMentionableOption(
    slashCommand: SlashCommandBuilderExecutable,
    option: MentionableOption & OptionDefaultType,
    name: string
  ) {
    return slashCommand.addMentionableOption((inp) => {
      inp.setName(name);
      inp.setDescription(option.description);
      inp.setRequired(option.required);
      return inp;
    });
  }

  private addStringOption(
    slashCommand: SlashCommandBuilderExecutable,
    option: StringOption & OptionDefaultType,
    name: string
  ) {
    return slashCommand.addStringOption((inp) => {
      inp.setName(name);
      inp.setDescription(option.description);
      inp.setRequired(option.required);
      if (typeof option.autocomplete != "undefined")
        inp.setAutocomplete(option.autocomplete);
      if (option.choices) inp.setChoices(...option.choices);
      if (typeof option.minLength != "undefined")
        inp.setMinLength(option.minLength);
      if (typeof option.maxLength != "undefined")
        inp.setMaxLength(option.maxLength);

      return inp;
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
        case "Double":
          slashCommand = this.addDoubleOption(slashCommand, option, name);
          break;
        case "Integer":
          slashCommand = this.addIntegerOption(slashCommand, option, name);
          break;
        case "User":
          slashCommand = this.addUserOption(slashCommand, option, name);
          break;
        case "Channel":
          slashCommand = this.addChannelOption(slashCommand, option, name);
          break;
        case "Role":
          slashCommand = this.addRoleOption(slashCommand, option, name);
          break;
        case "Attachment":
          slashCommand = this.addAttachmentOption(slashCommand, option, name);
          break;
        case "Mentionable":
          slashCommand = this.addMentionableOption(slashCommand, option, name);
          break;
        case "String":
          slashCommand = this.addStringOption(slashCommand, option, name);
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
