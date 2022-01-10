import { request } from "..";
import { Client } from "./Client";
import User from "./User";

export default class ClientUser extends User {
    servers: string[]
    /** The client's current global settings. This is always empty for bots. */
    settings: Settings

    constructor(client: Client, data: {[k: string]: any}) {
        super(client, data)
        this.servers = data.servers
        this.settings = data.settings
    }

    /** Delete the client's avatar, replacing it with the default. */
    async deleteAvatar() {
        await request("DELETE", "/avatars")
    }

    /** Edit this client's Phoenix account.*/
    async edit(data: AccountData, oldPassword?: string) {
        if (this.bot && (data.password || data.settings)) throw new Error(`Bots cannot edit password or settings.`)
        if (data.password && !oldPassword) throw new Error("Cannot edit password without old password")
        else data.password = oldPassword

        await request("PUT", "/accounts/me", {}, data).catch(e => { throw new Error(e) })
        if (data.settings) this.settings = data.settings
    }

    /**
     * Permanently delete the client's account.
     * @param deleteServers Whether to delete all user's servers or automatically pass ownership of them to other users. Defaults to true.
     */
    async delete(password: string, deleteServers: boolean=true) {
        if (!password) throw new Error("Cannot delete account without password")

        await request("DELETE", "/accounts/me", { "Transfer-Encoding": "chunked" }, { password: password, deleteServers: deleteServers }).catch(e => { throw new Error(e) })
        this.client.disconnect()
    }
}

interface AccountData {
    username?: string
    password?: string
    settings?: Settings
}

interface Settings {
    backgroundURL?: string
}