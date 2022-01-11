import * as https from 'https'

import { io, Socket } from "socket.io-client";
import { apiPath, defaultIcon, hostname, PhoenixResponse } from "..";
import { AnyChannel } from "./Channel";
import ClientUser from "./ClientUser";
import DeletedUser from "./DeletedUser";
import EventEmitter from "./EventEmitter";
import Invite from "./Invite";
import Member from "./Member";
import Message from "./Message";
import Server from "./Server";
import ServerChannel from "./ServerChannel";
import TextChannel from "./TextChannel";
import User, { AnyUser } from "./User";

export declare interface Client {
    on<U extends keyof ClientEvents>(event: U, callback: ClientEvents[U]): void
    once<U extends keyof ClientEvents>(event: U, callback: ClientEvents[U]): void
    emit<U extends keyof ClientEvents>(event: U, ...args: any[]): void
}

interface ClientEvents {
    /** Emitted once the client has built all structures and initiated a connection with the server. */
    'ready': () => void

    /** Emitted when a member joins a server. */
    'serverJoin': (member: Member) => void
    /** Emitted when a server's name, owner, or icon is edited. */
    'serverEdit': (oldServer: Server, newServer: Server) => void
    'serverDelete': (server: Server) => void

    'channelCreate': (channel: AnyChannel) => void
    /** Emitted when a channel's name or position is edited. */
    'channelEdit': (oldChannel: AnyChannel, newChannel: AnyChannel) => void
    'channelDelete': (channel: AnyChannel) => void

    /** Emitted when a user starts typing in a channel. */
    'typingStart': (user: User, channel: AnyChannel) => void
    /** Emitted when a user stops typing in a channel. */
    'typingStop': (user: User, channel: AnyChannel) => void

    /** Emitted when a user's username or profile picture is edited. */
    'userEdit': (oldUser: User, newUser: User) => void
    'userDelete': (user: User) => void

    'inviteCreate': (invite: Invite) => void
    /** Emitted when an invite's ID, max uses, allowed users or expiry date is edited.  */
    'inviteEdit': (oldInvite: Invite, newInvite: Invite) => void
    'inviteDelete': (invite: Invite) => void

    /** Emitted when a user sends a message to a channel. */
    'message': (message: Message) => void
    /** Emitted when a message's content is edited. */
    'messageEdit': (oldMessage: Message, newMessage: Message) => void
    'messageDelete': (message: Message) => void
}

export class Client extends EventEmitter {
    token: string
    socket?: Socket
    user: ClientUser
    servers: Map<string, Server>
    channels: Map<string, AnyChannel>
    users: Map<string, AnyUser>
    invites: Map<string, Invite>

    constructor(token: string) {
        super()

        this.token = token

        this.servers = new Map()
        this.channels = new Map()
        this.users = new Map()
        this.invites = new Map()

        this.user = new ClientUser(this, {})
        this.request<ClientUser>("GET", "/users/me").then(res => {
            this.user = new ClientUser(this, res.body)
            this.build()
        }).catch(e => {
            console.error(e)
        })
    }

    private async build() {
        for (let i in this.user.servers) {
            let id = this.user.servers[i]

            let server = await this.fetchServer(id)
            this.servers.set(id, server)
            server.channels.forEach(c => {
                c.server = server
                c.editable = this.user.id === server.owner.id
                c.deletable = c.editable
            })
            server.members.forEach(m => m.server = server)
        }
        
        this.connect();
    }

    /**
     * Fully disconnect the client and delete the token. This terminates all authorised communiation with the Phoenix Server.
     * This is not available to bots.
     */
    async logout() {
        if (this.user.bot) throw new Error("Bots cannot logout. Did you mean to refresh the token?")
        await this.request("POST", "/logout")
        this.disconnect()
    }

    private connect() {
        const socketOptions: { [k: string]: any; } = {};
        if (window.location.host === "localhost:3000") socketOptions.query = { token: this.token };

        this.socket = io("https://" + hostname, socketOptions);

        this.socket.on('ready', () => this.emit('ready'));

        this.socket.on('serverJoin', memberData => {
            const member = new Member(this, memberData);

            if (member.user.mutualServers) member.user.mutualServers.set(member.server.id, member.server);

            if (this.user.id !== member.id) member.server.members.set(member.id, member);

            this.emit('serverJoin', member);
        });

        this.socket.on('serverEdit', async (oldServerData, newServerData) => {
            const oldServer = this.servers.get(oldServerData.id);
            if (!oldServer) return;
            const newServer = oldServer.clone();

            newServer.name = newServerData.name;
            const member = newServer.members.get(newServerData.owner);
            if (member) newServer.owner = member;

            if (newServerData.icon && newServerData.defaultIcon) newServer.iconURL = defaultIcon;

            this.servers.set(oldServer.id, newServer);
            this.emit('serverEdit', oldServer, newServer);
        });

        this.socket.on('serverDelete', (serverData) => {
            const server = new Server(this, serverData);

            this.servers.delete(serverData.id);
            for (let id of server.channels.keys()) {
                this.channels.delete(id);
            }
            this.emit('serverDelete', server);
        });

        this.socket.on('channelCreate', (channelData) => {
            let channel;
            if (channelData.type === "text") {
                channel = new TextChannel(this, channelData);
                channel.server.channels.set(channel.id, channel);
            } // Add other types as they get created

            if (channel) {
                this.channels.set(channel.id, channel);
                this.emit('channelCreate', channel);
            }
        });

        this.socket.on('channelEdit', (oldChannelData, newChannelData) => {
            let newChannel = this.channels.get(oldChannelData.id);
            if (!newChannel) return;
            const oldChannel = newChannel.clone();

            newChannel.name = newChannelData.name;

            if (newChannel instanceof ServerChannel) {
                newChannel.position = newChannelData.position;
                newChannel.server.channels.set(oldChannelData.id, newChannel);
            }

            this.emit('channelEdit', oldChannel, newChannel);
        });

        this.socket.on('channelDelete', (channelData) => {
            let channel = this.channels.get(channelData.id);
            if (!channel) return;
            channel = channel.clone();

            this.channels.delete(channelData.id);
            if (channel instanceof ServerChannel) {
                channel.server.channels.delete(channelData.id);
            }

            this.emit('channelDelete', channel);
        });

        this.socket.on('typingStart', (userID, channelID) => {
            const user = this.users.get(userID), channel = this.channels.get(channelID);
            if (!channel || !(channel instanceof TextChannel)) return;

            if (userID !== this.user.id && !channel.isTyping(userID)) channel.usersTyping.push(userID);

            this.emit('typingStart', user, channel);
        });

        this.socket.on('typingStop', (userID, channelID) => {
            const user = this.users.get(userID), channel = this.channels.get(channelID);
            if (!channel || !(channel instanceof TextChannel)) return;

            if (channel.isTyping(userID)) channel.usersTyping.splice(channel.usersTyping.indexOf(userID), 1);

            this.emit('typingStop', user, channel);
        });

        this.socket.on('userEdit', (oldUserData, newUserData) => {
            const oldUser = this.users.get(oldUserData.id), newUser = new User(this, newUserData);

            if (newUserData.avatarUpdated) newUser.avatarURL = `https://amelix.xyz/avatars/${newUser.id}?lastmod=${newUser.avatarLastUpdated}`;

            this.users.set(newUserData.id, newUser);
            newUser.getMutualServers().forEach(s => {
                if (s.owner.id === newUser.id) s.owner.user = newUser;

                let member = s.members.get(newUser.id);
                if (member) member.user = newUser;

                s.channels.forEach(c => {
                    c.messages.forEach(m => {
                        if (m.author?.id === newUser.id) m.author = newUser;
                    });
                });
            });

            this.emit('userEdit', oldUser, newUser);
        });

        this.socket.on('userDelete', (userData) => {
            const user = this.users.get(userData.id);
            if (!user) return;

            // Change every message sent by deleted user to properly show them as being deleted
            user.getMutualServers().forEach(s => {
                s.channels.forEach(c => {
                    c.messages.forEach(m => {
                        if (m.author?.id === user.id) m.author = new DeletedUser(this, m.author);
                    });
                });
            });

            this.users.delete(userData.id);
            this.emit('userDelete', user);
        });

        this.socket.on('inviteCreate', inviteData => {
            const invite = new Invite(this, inviteData);
            this.invites.set(invite.id, invite);
            invite.channel.invites.set(invite.id, invite);

            this.emit('inviteCreate', invite);
        });

        this.socket.on('inviteEdit', (oldInviteData, newInviteData) => {
            const oldInvite = new Invite(this, oldInviteData), newInvite = new Invite(this, newInviteData);
            if (oldInvite.id !== newInvite.id) {
                this.invites.delete(oldInvite.id);
                newInvite.channel.invites.delete(oldInvite.id);
            }
            this.invites.set(newInvite.id, newInvite);
            newInvite.channel.invites.set(newInvite.id, newInvite);

            this.emit('inviteEdit', oldInvite, newInvite);
        });

        this.socket.on('inviteDelete', inviteData => {
            let invite = this.invites.get(inviteData.id);
            if (!invite) return;
            invite.channel.invites.delete(inviteData.id);
            this.invites.delete(inviteData.id);

            this.emit('inviteDelete', inviteData);
        });

        this.socket.on('message', messageData => {
            const message = new Message(this, messageData);
            message.channel.messages.set(message.id, message);
            message.channel.messageIDs.push(message.id);
            this.emit('message', message);
        });

        this.socket.on('messageEdit', (oldMessageData, newMessageData) => {
            const oldMessage = new Message(this, oldMessageData), newMessage = new Message(this, newMessageData);
            oldMessage.channel.messages.set(oldMessage.id, newMessage);

            this.emit('messageEdit', oldMessage, newMessage);
        });

        this.socket.on('messageDelete', (messageData) => {
            const message = new Message(this, messageData);
            message.channel.messages.delete(message.id);
            message.channel.messageIDs.splice(message.channel.messageIDs.indexOf(messageData.id), 1);

            this.emit('messageDelete', message);
        });
    }

    /** Terminate the real time communication between this client and the server. */
    disconnect() {
        this.socket?.disconnect()
    }

    /**
     * Create a Phoenix server. All Phoenix servers will have a general text channel made on their creation.
     * This is not available to bots.
     */
    async createServer(name: string): Promise<Server> {
        if (this.user.bot) throw new Error("Bots cannot create servers.")
        const res = await this.request("POST", "/servers", {}, name ? `{"name": "${name}"}` : ""),
            server = await this.fetchServer(res.body)

        this.servers.set(server.id, server)

        return server
    }

    async request<T=any>(method="GET", path:string, headers:{[k: string]: string}={}, write?:any): Promise<PhoenixResponse<T>> {
        if (typeof write === "object") write = JSON.stringify(write);

        headers.authorization = this.token

        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: hostname,
                port: 443,
                path: apiPath + path,
                method: method,
                headers: headers
            }, res => {
                let body = ""
                res.on('data', chunk => {
                    body += chunk
                })
                
                res.on('end', () => {
                    if (res.statusCode?.toString().startsWith("2")) {
                        try { body = JSON.parse(body) } catch {}
                        resolve(new PhoenixResponse<T>(res, body))
                    }
                    else {
                        reject("An error occurred while connecting to Phoenix...\nServer responded with:\t" + res.statusMessage)
                    }
                })
            })
            req.on('error', e => {
                reject(e)
            })
            req.end(write)
        })
    }

    private async fetchServer(serverResolvable: string | { [k: string]: any }) {
        let data: { [k: string]: any }
        if (typeof serverResolvable === "string") {
            let server = this.servers.get(serverResolvable)
            if (server) return server

            const res = await this.request("GET", "/servers/" + serverResolvable)
            data = res.body
        }
        else data = serverResolvable

        let server = new Server(this, data)

        for (let i in data.channels) {
            let id = data.channels[i]
            let channel = await this.fetchChannel(id)
            if (channel instanceof TextChannel) server.channels.set(id, channel)
        }

        for (let id of data.members) {
            if (!this.users.has(id)) this.users.set(id, await this.fetchUser(id))
        }

        const members = await server.fetchMembers()
        let owner = members.get(data.owner)
        if (owner) server.owner = owner

        return server
    }

    private async fetchChannel(id: string) {
        let value = this.channels.get(id)
        if (value) return value

        const res = await this.request("GET", "/channels/" + id)
        let channel
        if (res.body.type === "text") channel = new TextChannel(this, res.body)

        if (!channel) throw new Error("FetchChannel: Channel fetching failed, no idea why :)")

        this.channels.set(id, channel)
        return channel
    }

    /** Fetch a Phoenix user by ID. */
    async fetchUser(id: string) {
        let user = this.users.get(id)
        if (user) return user

        const res = await this.request("GET", `/users/` + id)
        
        if (res.body.deletedAt) user = new DeletedUser(this, res.body)
        else user = new User(this, res.body)

        this.users.set(id, user)
        return user
    }

    /** Fetch a Phoenix invite by ID. */
    async fetchInvite(id: string) {
        let invite = this.invites.get(id)
        if (invite) return invite

        const p = await this.request("GET", `/invites/${id}`).catch(e => null)
        if (p === null) return;

        invite = new Invite(this, p.body)
        
        invite.channel.invites.set(id, invite)
        
        this.invites.set(id, invite)
        return invite;
    }
}