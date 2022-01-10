import Base from "./Base";
import { Client } from "./Client";
import { AnyServerChannel } from "./ServerChannel";

export type AnyChannel = AnyServerChannel

/** The foundation of all Phoenix channels. */
export default class Channel extends Base {
    name: string
    /** Currently, all Phoenix channels are standard text channels. */
    type: "text"
    constructor(client: Client, data: any) {
        super(client, data)

        this.name = data.name
        this.type = data.type
    }
}