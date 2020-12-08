export class Transaction {
    constructor(
        public hash: string,
        public from: string,
        public to: string,
        public value: string,
        public blockNumber: number
    ) {}
}