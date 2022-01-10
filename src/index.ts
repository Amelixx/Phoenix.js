import { IncomingMessage } from 'http'
import * as https from 'https'

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

class PhoenixResponse<T> {
    res: IncomingMessage
    body: T
    constructor(res: IncomingMessage, body: any) {
        this.res = res
        this.body = body
    }
}

export async function request<T=any>(method="GET", path:string, headers:{[k: string]: string}={}, write?:any): Promise<PhoenixResponse<T>> {
    if (typeof write === "object") write = JSON.stringify(write);

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
                    reject(res.statusMessage)
                }
            })
        })
        req.on('error', e => {
            reject(e)
        })
        req.end(write)
    })
}