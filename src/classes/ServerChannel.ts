import Channel from "./Channel";
import { Client } from "./Client";
import DeletedUser from "./DeletedUser";
import Invite from "./Invite";
import Server from "./Server";
import TextChannel from "./TextChannel";
import User from "./User";

export type AnyServerChannel = TextChannel

export default class ServerChannel extends Channel {
    /** The position of this channel in the server, channels are ordered starting from 0 at the top. */
    position: number
    /** Whether or not the client can edit this channel. */
    editable: boolean
    /** Whether or not the client can delete this channel. */
    deletable: boolean
    /** The User who created the channel. */
    createdBy: User | DeletedUser
    server: Server
    invites: Map<string, Invite>

    constructor(client: Client, data: any) {
        super(client, data)

        this.position = data.position
        this.createdBy = data.createdBy

        let server = client.servers.get(data.server)
        if (server) this.server = server
        else this.server = data.server

        // These are changed later in Client.ts
        this.editable = false
        this.deletable = false

        this.invites = new Map()
    }
}

export interface ServerChannelData {
    name: string
    type?: string
    position?: number
}