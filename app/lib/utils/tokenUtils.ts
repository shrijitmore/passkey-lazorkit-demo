import {
    Connection,
    PublicKey,
    TransactionInstruction,
    SystemProgram
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    createMintToInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';

export async function getOrCreateAssociatedTokenAccountInstruction(
    connection: Connection,
    mint: PublicKey,
    owner: PublicKey,
    payer: PublicKey,
    allowOwnerOffCurve = false
): Promise<{ address: PublicKey, instruction: TransactionInstruction | null }> {
    const associatedAddress = await getAssociatedTokenAddress(
        mint,
        owner,
        allowOwnerOffCurve,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Check if account exists
    try {
        const account = await connection.getAccountInfo(associatedAddress);
        if (account) {
            // Account exists, no need to create
            return { address: associatedAddress, instruction: null };
        }
    } catch (e) {
        // Ignore error, assume account doesn't exist
    }

    // Create instruction to create account
    const instruction = createAssociatedTokenAccountInstruction(
        payer,
        associatedAddress,
        owner,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return { address: associatedAddress, instruction };
}

export function createSPLTransferInstruction(
    sourceTokenAccount: PublicKey,
    destinationTokenAccount: PublicKey,
    owner: PublicKey,
    amount: number,
    decimals: number
): TransactionInstruction {
    const amountBigInt = BigInt(Math.floor(amount * Math.pow(10, decimals)));

    return createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccount,
        owner,
        amountBigInt,
        [],
        TOKEN_PROGRAM_ID
    );
}
