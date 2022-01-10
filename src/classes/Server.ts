import { apiPath, defaultIcon, hostname, request } from "..";
import Base from "./Base";
import { Client } from "./Client";
import Member from "./Member";
import { AnyServerChannel, ServerChannelData } from "./ServerChannel";
import TextChannel from "./TextChannel";

export default class Server extends Base {
    name: string
    /** The CSS of this server, if any has been uploaded. */
    css?: string
    cssLastUpdated: number
    /** The image URL for this server's icon. */
    iconURL: string
    iconLastUpdated: number
    /** The member who owns this server. */
    owner: Member
    channels: Map<string, AnyServerChannel>
    members: Map<string, Member>
    /** Whether or not every single member in this server is cached or not. */
    membersCached: boolean

    constructor(client: Client, data: { [k: string]: any }) {
        super(client, data)

        this.name = data.name

        this.cssLastUpdated = data.cssLastUpdated

        if (data.defaultIcon) this.iconURL = defaultIcon
        else this.iconURL = `https://${hostname}${apiPath}/servers/${this.id}/icon`
        this.iconLastUpdated = data.iconLastUpdated

        this.owner = data.owner

        this.channels = new Map()

        this.members = new Map()
        this.membersCached = false
    }

    /**
     * Create a channel in this server. Defaults to a text channel if not specified.
     * @returns Created channel
     */
    async createChannel(data: ServerChannelData): Promise<AnyServerChannel> {
        const res = await request("POST", `/servers/${this.id}/channels`, {}, data)
        let channel = res.body;
        if (data.type === "text") channel = new TextChannel(this.client, channel);

        this.client.channels.set(channel.id, channel)
        this.channels.set(channel.id, channel)
        return channel
    }

    /** Fetch and cache a single member from this server. */
    async fetchMember(id: string) {
        if (this.members.has(id)) return this.members.get(id)

        const res = await request("GET", `/servers/${this.id}/members/${id}`).catch(e => {})
        if (!res) return;

        const member = new Member(this.client, res.body)
        this.members.set(id, member)
        return member
    }

    async fetchMembers() {
        if (this.membersCached) return this.members

        let res = await request<Map<string, Member>>("GET", `/servers/${this.id}/members`)
        for (let arr of res.body) {
            let user = this.client.users.get(arr[0])
            if (user) arr[1].user = user
            this.members.set(arr[0], new Member(this.client, arr[1]))
        }
        this.membersCached = true
        return this.members
    }

    /** Delete the server's icon, replacing it with the defualt. */
    async deleteIcon() {
        if (this.client.user.id !== this.owner.id) throw new Error("Insufficient Permissions")

        await request("DELETE", `/servers/${this.id}/icon`)
    }

    /** Fetch this server's CSS. */
    async fetchCSS() {
        if (this.css) return this.css

        let res = await request<string>(`GET`, `/servers/${this.id}/css`)
        this.css = res.body
        return res.body
    }

    /** Post new CSS to this server.
     * This is not available to bots as there is no permission system yet and bots cannot own servers.
     * @returns Minified CSS */
    async editCSS(css: string) {
        if (this.client.user.id !== this.owner.id) throw new Error("Insufficient Permissions")
        else if (!css) throw new Error("No CSS provided")

        let res = await request<string>("POST", `/servers/${this.id}/css`, {}, css)
        return res.body;
    }

    /** Delete this server's custom CSS.
     * This is not available to bots as there is no permission system yet and bots cannot own servers.
     */
    async deleteCSS() {
        if (this.client.user.id !== this.owner.id) throw new Error("Insufficient Permissions")
        
        await request("DELETE", `/servers/${this.id}/css`);
        delete this.css
    }

    /** Edit this server's name or transfer ownership. */
    async edit(data: ServerData, password?: string) {
        // Permission stuffs
        if (this.client.user.id !== this.owner.id) throw new Error("Insufficient Permissions")

        if (!Object.keys(data)) throw new Error("No data provided")

        let write: {[k: string]: any} = data
        if (data.owner && !password) throw new Error("Transferring ownership requires password!")
        else write.password = password

        await request("PUT", `/servers/${this.id}`, write)
        return this;
    }

    /** Delete the server. */
    async delete(password: string) {
        // Permission stuff ...
        if (this.client.user.id !== this.owner.id) throw new Error(`Insufficient Permissions`)

        if (!password) throw new Error("Password required to delete servers")
        await request("DELETE", `/servers/${this.id}`, {"Transfer-Encoding": "chunked"}, `{"password": "${password}"}`)
    }
}

interface ServerData {
    name?: string
    /** ID of user to transfer ownership to */
    owner?: string
}