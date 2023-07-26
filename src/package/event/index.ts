import { Awaitable, Client, ClientEvents } from "discord.js";

export type EventListener<K extends keyof ClientEvents> = {
  type: K;
  listener: (bot: Client, ...args: ClientEvents[K]) => Awaitable<void>;
  once?: boolean;
};

export class EventBuilder {
  listeners: EventListener<any>[] = [];
  constructor() {}

  register<K extends keyof ClientEvents>(eventListener: EventListener<K>) {
    this.listeners.push(eventListener);

    return this;
  }
}
