import { stripIndents } from "common-tags";
import { Message } from "discord.js";
import BaseEvent from "../Base/BaseEvent";
import { LensClient } from "../Base/Client";
import { Collection } from "discord.js";

const cooldowns: Collection<`${string}-${bigint}`, number> = new Collection();

export default class MessageEvent extends BaseEvent {
	constructor(client: LensClient) {
		super(client, "message");
	}

	public async listener(message: Message) {
		if(message.partial) await message.fetch();
		if(message.author.bot || message.webhookId) return;

		let prefix = "";

		for(const { string, type } of this.client.prefixes) {
			if(message.content.toLowerCase().startsWith(string)) {
				// @ts-ignore
				if(type === "ping") message.mentions.users.delete(message.mentions.users.first()?.id);

				prefix = string;
				break;
			}
		}

		if(prefix.length === 0) return;

		const [commandName, ...args] = message.content.slice(prefix.length).split(/ +/g);

		const command = this.client.commands.get(commandName);
		if(!command) return;

		const timestamp = cooldowns.get(`${command.name}-${message.author.id}`);
		const now = Date.now();

		if(timestamp && (timestamp - now) < command.cooldown) return message.channel.send(`Please wait for ${((timestamp - now) / 1000).toFixed(2)} seconds before trying this command again.`);

		cooldowns.set(`${command.name}-${message.author.id}`, now);

		setTimeout(() => cooldowns.delete(`${command.name}-${message.author.id}`));

		try {
			await command.handler(message, args);
		}
		catch(err) {
			this.client.logger.error("client/commands", stripIndents`
				Error on command ${command.name}
				Message: ${err.message}
				Stack: ${err.stack}
			`);
		}
	}
}