import { writeFileSync } from 'fs'

export class Writer {
    private isFileEmpty: boolean

    constructor (emptyFile: boolean) {
        this.isFileEmpty = emptyFile
    }

    public writeTransactionToOutput(transactionOutput: string) {
        const prefix = this.isFileEmpty ? '' : '\n'
        writeFileSync('./output.txt', `${prefix}${transactionOutput}`, {'flag':'a'})

        if (this.isFileEmpty) {
            this.isFileEmpty = false
        }
    }

    public setIsEmptyFile(isFileEmpty: boolean) {
        this.isFileEmpty = isFileEmpty
    }
}