import { GuildMember } from "discord.js";

const getDM = async (member: GuildMember) =>
  member.dmChannel ? member.dmChannel : await member.createDM();
export default getDM;
