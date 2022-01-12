import { IncomingMessage } from "http"

export default class PhoenixResponse<T> {
    res: IncomingMessage
    body: T
    constructor(res: IncomingMessage, body: any) {
        this.res = res
        this.body = body
    }
}