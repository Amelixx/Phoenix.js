import { Client } from "./Client";
import Server from "./Server"
import User from "./User"

/** Represents a user inside a server. */
export default class Member extends User {
    user: User
    nickname: string
    server: Server

    constructor(client: Client, data: {[k: string]: any}) {
        super(client, data)

        let server = client.servers.get(data.server)
        if (server) this.server = server
        else this.server = data.server

        let user = client.users.get(data.user)
        if (user) this.user = user
        else this.user = data.user

        this.nickname = data.nickname || this.user.username
    }
}