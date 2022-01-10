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

export const hostname = "phoenix.amelix.xyz"
export const apiPath = ""
export const defaultIcon = 'https://' + hostname + '/avatars/default'
export const messageQueryLimit = 150

class PhoenixResponse<T> {
    res: Response
    body: T
    constructor(res: Response, body: any) {
        this.res = res
        this.body = body
    }
}

export async function request<T=any>(method="GET", path:string, headers:{[k: string]: string}={}, write?:any, hostOverwrite?: string): Promise<PhoenixResponse<T>> {
    if (typeof write === "object") write = JSON.stringify(write);

    const res = await fetch(`https://` + hostname + apiPath + path, {
        method: method,
        headers: headers,
        body: write
    }).catch(e => {throw new Error(e)})
    if (res.ok) {
        let body = await res.text()

        try { body = JSON.parse(body) } catch {}
        return new PhoenixResponse<T>(res, body)
    }
    else throw new Error(res.statusText)
}