import { IncomingMessage } from 'http'

export const hostname = "phoenix.amelix.xyz"
export const apiPath = ""
export const defaultIcon = 'https://' + hostname + '/avatars/default'
export const messageQueryLimit = 150

import Base from './classes/Base'
import Channel from './classes/Channel'
import { Client } from './classes/Client'
import ClientUser from './classes/ClientUser'
import DeletedUser from './classes/DeletedUser'
import Invite from './classes/Invite'
import Member from './classes/Member'
import Message from './classes/Message'
import Server from './classes/Server'
import ServerChannel from './classes/ServerChannel'
import TextChannel from './classes/TextChannel'
import User from './classes/User'

export {
    Base,
    Channel,
    Client,
    ClientUser,
    DeletedUser,
    Invite,
    Member,
    Message,
    Server,
    ServerChannel,
    TextChannel,
    User
}

export class PhoenixResponse<T> {
    res: IncomingMessage
    body: T
    constructor(res: IncomingMessage, body: any) {
        this.res = res
        this.body = body
    }
}