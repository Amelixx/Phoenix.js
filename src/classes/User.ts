import Base from "./Base";
import { Client } from "./Client";
import Server from "./Server";

import DeletedUser from "./DeletedUser";
import { apiPath, defaultIcon, hostname } from "..";

export type AnyUser = User | DeletedUser

export default class User extends Base {
    username: string
    avatarLastUpdated?: number
    /** The image URL to this user's profile picture. */
    avatarURL: string
    /** Whether or not this user is a bot. */
    bot: boolean

    /** The mutual servers returned by getMutualServers(). */
    mutualServers?: Map<string, Server>

    constructor(client: Client, data: {[k: string]: any}) {
        super(client, data)

        this.username = data.username

        this.avatarLastUpdated = data.avatarLastUpdated
        if (data.defaultAvatar) {
            this.avatarURL = defaultIcon
        }
        else {
            this.avatarURL = `https://${hostname}${apiPath}/avatars/${this.id}`
        }

        this.bot = data.bot
        
        if (data.mutualServers) this.mutualServers = data.mutualServers
    }

    /** Calculate all the mutual servers between the client and this user. */
    getMutualServers() {
        if (this.mutualServers) return this.mutualServers

        let mutualServers = new Map<string, Server>()
        this.client.servers.forEach(server => {
            if (server.members.has(this.id)) mutualServers.set(server.id, server)
        })
        this.mutualServers = mutualServers
        return mutualServers
    }
}