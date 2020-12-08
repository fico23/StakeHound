import { readFileSync } from 'fs';
import { start } from 'repl';
import { updateBreak } from 'typescript';
import { Requester } from './requester'
import { Transaction } from './transaction'
import { Writer } from './writer'

export class Minter {
    private requester: Requester
    private writer: Writer
    private processedTransactions: Map<string, Transaction>
    private address: string

    constructor(address: string) {
        this.address = address
        this.requester = new Requester()
        this.writer = new Writer(true)
        this.processedTransactions = new Map<string, Transaction>()
    }

    private handleTransaction (transaction: Transaction) {
        const { hash } = transaction

        if (this.processedTransactions.has(hash)) {
            console.log('transaction already processed')
            return
        }

        const transactionOutput = this.getTransactionOutput(transaction)

        this.writer.writeTransactionToOutput(transactionOutput)

        this.processedTransactions.set(hash, transaction)
    }

    private getTransactionOutput (transaction: Transaction) {
        const { value, from } = transaction

        return `MINT ${value} ${from}`
    }

    private url(startBlock: number, endBlock: number): string { 
        return 'https://api-ropsten.etherscan.io/api?module=account&action=txlist' +
                `&address=${this.address}&startblock=${startBlock}&endblock=${endBlock}sort=asc`
    }

    private getTransactionsToAddress (responseJson: any): Array<Transaction> {
        const lowerAddress = this.address.toLowerCase()
    
        return responseJson.result.filter(x => x.to === lowerAddress)
                .map(x => new Transaction(x.hash, x.from, x.to, x.value, x.blockNumber))
    }

    private async populateProcessedTransactions(fileLines: Array<string>): Promise<Array<Transaction>> {
        const url = this.url(1, 99999999)

        const response = await this.requester.get(url)
    
        const transactions = this.getTransactionsToAddress(response)

        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i]

            if (i > fileLines.length - 1) {
                return transactions.slice(i - 1)
            }

            const fileLine = fileLines[i]

            const transactionOutput = this.getTransactionOutput(transaction)

            if (transactionOutput === fileLine) {
                this.processedTransactions.set(transaction.hash, transaction)
            } else {
                console.log(`expected ${fileLine} to be equal ${transactionOutput}`)
                throw new Error('Corrupted sources')
            }
        }

        return []
    }

    public async start() {
        console.log('minter started')

        let startBlock = 1
        const endBlock = 99999999
        const file = readFileSync('./output.txt', 'utf-8')
    
        if (file != '') {
            console.log('file is not empty, this is crash recovery')
            this.writer.setIsEmptyFile(false)

            const fileLines = file.split('\n')

            const unProcessedTransactions = await this.populateProcessedTransactions(fileLines)

            unProcessedTransactions.forEach(t => this.handleTransaction(t))

            const transactionsCount = unProcessedTransactions.length

            if (transactionsCount) {
                const lastTransaction = unProcessedTransactions[transactionsCount - 1]

                startBlock = lastTransaction.blockNumber
            }
        }
    
        while(true) {
            const url = this.url(startBlock, endBlock)

            const response = await this.requester.get(url)
        
            const transactions = this.getTransactionsToAddress(response)
    
            transactions.forEach(t => this.handleTransaction(t))

            const transactionsCount = transactions.length

            if (transactionsCount) {
                const lastTransaction = transactions[transactionsCount - 1]

                startBlock = lastTransaction.blockNumber
            }
        }
    }
}