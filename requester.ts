import fetch from 'node-fetch'

export class Requester {
    private lastRequestTimestamp: number
    private msBetweenRequests = 5000

    constructor() {
        this.lastRequestTimestamp = 0
    }

    private wait(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    public async get(url: string) {
        const msFromLastRequest = Date.now() - this.lastRequestTimestamp
        if (msFromLastRequest < this.msBetweenRequests) {
            console.log(`waiting for ${this.msBetweenRequests - msFromLastRequest}`)
            await this.wait(this.msBetweenRequests - msFromLastRequest)
        }

        console.log(`GET ${url}`)
        const response = await fetch(url, {method: 'GET'})
        this.lastRequestTimestamp = Date.now()

        return response.json()
    }
}