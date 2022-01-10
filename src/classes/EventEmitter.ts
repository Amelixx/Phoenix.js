export default class EventEmitter {
    private callbacks: {[k: string]: Function[]}
    private onces: {[k: string]: 0 | 1}
    constructor() {
        this.callbacks = {}
        this.onces = {}
    }

    /**
     * Choose what happens on a particular event broadcasted by this event emitter.
     */
    on(event: string, callback: Function, once=false) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(callback);

        if (once) this.onces[event] = 0;
    }

    /**
     * Same as on(), except will only run the first time the event is emitted.
     */
    once(event: string, callback: Function) {
        this.on(event, callback, true)
    }

    protected emit(event: string, ...args: any[]) {
        if (this.onces[event] === 1) return;

        let callbacks = this.callbacks[event]
        if (callbacks) {
            for (let callback of callbacks) {
                callback(...args)
            }
        }

        if (this.onces[event] === 0) {
            this.onces[event] = 1
        }
    }
}