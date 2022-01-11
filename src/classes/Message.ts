import { hostname } from "..";
import Base from "./Base";
import { Client } from "./Client";
import Invite from "./Invite";
import Member from "./Member";
import Server from "./Server";
import ServerChannel, { AnyServerChannel } from "./ServerChannel";
import { AnyUser } from "./User";

const hostLength = hostname.length

/** Represents a message in a channel. */
export default class Message extends Base {
    private _invitesCached: boolean
    content: string
    edited: boolean
    /** Whether or not the client can edit this message. */
    editable: boolean
    /** Whether or not the client can delete this message. */
    deletable: boolean
    server: Server
    channel: AnyServerChannel
    /** The User who sent this message. Undefined if the message is a system message. */
    author?: AnyUser
    /** The Member who sent this message. Undefined if author is a DeletedUser or Phoenix (system message) */
    member?: Member 
    /** All *valid* invites contained within this message. */
    invites?: Map<string, Invite>
    /** if fetchInvites has been run, stores all the IDs that didn't match a valid invite. */
    invalidInvites?: string[]

    constructor(client: Client, data: any) {
        super(client, data)
        this._invitesCached = false

        this.content = data.content

        this.edited = !!data.edited

        let author = client.users.get(data.author)
        if (author) {
            this.author = author
        }

        let server = client.servers.get(data.server)
        if (server) this.server = server
        else this.server = data.server

        let channel = client.channels.get(data.channel)
        if (channel && channel instanceof ServerChannel) this.channel = channel
        else this.channel = data.channel

        if (this.author) {
            let member = this.server.members.get(this.author.id)
            if (member) this.member = member
        }

        this.editable = this.author?.id === this.client.user.id
        this.deletable = this.author?.id === this.client.user.id || this.server.owner.id === this.client.user.id
    }

    /** Edit this message. */
    async edit(newContent: string) {
        // would make this delete the message instead, but I don't want users accidentally deleting messages, so would want a popup window confirming it first
        if (!newContent) throw new Error("Cannot edit messages to contain nothing!")

        if (!this.editable) throw new Error(`Cannot edit messages not made by the client.`)
        else if (this.content === newContent) return;

        let res = await this.client.request("PUT", `/channels/${this.channel.id}/${this.id}`, { content: newContent })
        this.content = res.body.content
        this._invitesCached = false
        await this.fetchInvites()
    }

    /** Delete this message. */
    async delete() {
        if (!this.deletable) throw new Error(`Insufficient Permissions`)
        // else if (insert permissions stuff) { ... }

        await this.client.request("DELETE", `/channels/${this.channel.id}/${this.id}`)
    }

    /** Go through all Phoenix invites in this message and cache Invite objects for them, returning the invites. */
    async fetchInvites() {
        if (this._invitesCached) return this.invites;

        this.invites = new Map()
        this.invalidInvites = []

        const regex = new RegExp(`/${hostname}/invite/`, "gi")

        let result;
        while ( (result = regex.exec(this.content)) ) {
            let str = this.content.slice(result.index + hostLength),
            id = ""; 
            for (let char of str) {
                if ([" ", "\n"].includes(char)) break;
                id += char
            }

            if (id) {                                   
                let invite = await this.client.fetchInvite(id)
                if (!invite) this.invalidInvites.push(id)
                else this.invites.set(id, invite)
            }
        }
        this._invitesCached = true
        return this.invites
    }
}