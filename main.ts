import { Minter } from './minter'

(async () => {
    const address = process.argv[2]
    // TODO validate address
    const minter = new Minter(address)
    minter.start()
})()