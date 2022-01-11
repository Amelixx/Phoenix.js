import Base from "./Base";
import { Client } from "./Client";
import DeletedUser from "./DeletedUser";
import Server from "./Server";
import ServerChannel, { AnyServerChannel } from "./ServerChannel";
import User from "./User";

/** Represents an invite by which servers can be joined. */
export default class Invite extends Base {
    /** The current amount of times this invite has been used. */
    uses: number
    /** The maximum times this invite can be used. 0 means there is no limit. */
    maxUses: number
    /** The UNIX timestamp for when this invite expires. */
    expires: number
    /** An array of users that are allowed to use this invite. */
    invitedUsers: string[]
    /** The user who created the invite. */
    createdBy: User | DeletedUser
    /** The server this invite was created in. */
    server: Server
    /** The channel this invite leads to. */
    channel: AnyServerChannel

    constructor(client: Client, data: any) {
        super(client, data)

        this.uses = data.uses
        this.maxUses = data.maxUses

        this.expires = data.expires

        this.invitedUsers = data.invitedUsers

        let createdBy = client.users.get(data.createdBy)
        if (createdBy) this.createdBy = createdBy
        else this.createdBy = data.createdBy

        let server = client.servers.get(data.server)
        if (server) this.server = server
        else this.server = data.server

        let channel = client.channels.get(data.channel)
        if (channel && channel instanceof ServerChannel) this.channel = channel
        else this.channel = data.channel
    }

    /** Edit this invite. */
    async edit(data: InviteData) {
        if ((data.expires && data.expires < Date.now()+60000) || (data.expiresAfter && data.expiresAfter > 60000)) throw new Error("Expiry time has either already passed or is too short. Minimum expiry time is 1 minute")
        if (data.maxUses && data.maxUses <= this.uses) throw new Error(`Property "maxUses" cannot be equal to or smaller than the uses of this invite.`)

        if (this.client.user.id !== this.createdBy.id && this.client.user.id !== this.server.owner.id) throw new Error("Insufficient Permissions")

        const res = await this.client.request<Invite>("PUT", `/channels/${this.channel.id}/invites/${this.id}`, {}, data)
        this.id = res.body.id
        this.maxUses = res.body.maxUses
        this.expires = res.body.expires
        this.invitedUsers = res.body.invitedUsers
    }

    /** Permanently delete this invite. */
    async delete() {
        if (this.client.user.id !== this.createdBy.id && this.client.user.id !== this.server.owner.id) throw new Error("Insufficient Permissions")

        await this.client.request("DELETE", `/channels/${this.channel.id}/invites/${this.id}`)
    }
}

interface InviteData {
    id?: string
    maxUses?: number
    expires?: number
    expiresAfter?: number
    invitedUsers?: string[]
}