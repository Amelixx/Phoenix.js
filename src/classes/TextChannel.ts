import { messageQueryLimit, request } from "..";
import { Client } from "./Client";
import Message from "./Message";
import ServerChannel from "./ServerChannel";

export default class TextChannel extends ServerChannel {
    private messageQueries: { [k: string]: Map<string, Message> }
    /** Whether or not every message in this channel has been fetched. */
    fullyCached: boolean
    /** All the cached messages in this channel. Not in actual order. */
    messages: Map<string, Message>
    /** An array of the IDs of the messages in this channel. In actual order of how messages appear in the channel. */
    messageIDs: string[]
    /** An array of the IDs of users currently typing in this channel. */
    usersTyping: string[]
    /** Whether or not the client is currently typing in this channel. */
    clientTyping: boolean

    constructor(client: Client, data: any) {
        super(client, data)

        this.messageQueries = {}
        this.fullyCached = false

        this.messages = new Map()
        this.messageIDs = []

        this.usersTyping = []
        this.clientTyping = false
    }

    /** Send a message to the channel. */
    async send(content: string) {
        if (!content) throw new Error("Cannot send empty messages!")

        this.stopTyping()
        const res = await request("POST", "/channels/"+this.id, {}, {content: content})
        return new Message(this.client, res.body)
    }

    private async addMessage([id, message]: [string, any], before=false) {
        if (message.author && !this.client.users.has(message.author)) {
            await this.client.fetchUser(message.author)
        }
        
        const newMessage = new Message(this.client, message)

        this.messages.set(id, newMessage);
        before ? this.messageIDs.push(id) : this.messageIDs.unshift(id) 

        return newMessage
    }

    /** Fetch a single message from this channel. */
    async fetchMessage(id: string) {
        let msg = this.messages.get(id)
        if (msg) return msg

        const res = await request("GET", `/channels/${this.id}/messages/${id}`)
        msg = await this.addMessage([id, res.body])
        return msg
    }

    /** Fetch messages from this channel. */
    async fetchMessages(options: MessageFetchingOptions={} as MessageFetchingOptions) {
        if (!options.around && !options.before && !options.after && this.fullyCached) {
            return new Map(Array.from(this.messages).slice(-(options.limit || messageQueryLimit)))
        }

        let query = "?",
            option: keyof MessageFetchingOptions
        for (option in options) {   
            query += `${option}=${options[option]}&`
        }

        const path = `/channels/${this.id}/messages${query}`
        if (this.messageQueries[path]) return this.messageQueries[path]

        const res = await request("GET", path)
        let arr = res.body, out = new Map()

        if (options.before) {
            for (let i = arr.length - 1; i >= 0; i--) {
                out.set(arr[i][0], await this.addMessage(arr[i]))
            }
        }
        else {
            for (let i = 0; i <= arr.length - 1; i++) {
                out.set(arr[i][0], await this.addMessage(arr[i], true))
            }
        }

        this.messageQueries[path] = out
        if (out.size < (options.limit || messageQueryLimit)) this.fullyCached = true
        return out
    }

    /**
     * Check if a user is typing in this channel.
     * @param {string} id User ID
     */
    isTyping(id: string) {
        if (id === this.client.user.id) return this.clientTyping
        return this.usersTyping.includes(id)
    }

    /**
     * Start a typing indicator in this channel.
     */
    startTyping() {
        if (!this.isTyping(this.client.user.id)) {
            this.clientTyping = true
            this.client.socket?.emit('typingStart', this.id)
        }
    }

    /**
     * Stop the typing indicator in this channel.
     */
    stopTyping() {
        if (this.isTyping(this.client.user.id)) {
            this.clientTyping = false
            this.client.socket?.emit('typingStop', this.id)
        }
    }
}

interface MessageFetchingOptions {
    limit?: number
    before?: string
    after?: string
    around?: string
}