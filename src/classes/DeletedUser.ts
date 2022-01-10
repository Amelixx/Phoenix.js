import { defaultIcon } from "..";
import { Client } from "./Client";
import User from "./User";

/** Represents a user on Phoenix who has deleted their account. */
export default class DeletedUser extends User {
    /** UNIX timestamp for when this user was deleted. */
    deletedAt: number

    constructor(client: Client, data: {[k: string]: any}) {
        super(client, data)
        this.username = "Deleted User " + this.id
        this.deletedAt = data.deletedAt
        this.avatarURL = defaultIcon
    }
}