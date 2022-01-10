import { Client } from "./Client";

/** The foundation of all Phoenix structures. */
export default class Base {
    /** The client that fetched this structure. */
    client: Client
    /** Unique ID for this Phoenix structure. */
    id: string
    /** The UNIX timestamp for when this structure was created. */
    createdAt: number
    constructor(client: Client, data: {[k: string]: any}) {
        this.client = client
        this.id = data.id
        this.createdAt = data.createdAt
    }

    clone(): this {
        return Object.assign(Object.create(this), this)
    }
}