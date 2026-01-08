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
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';

export async function getOrCreateAssociatedTokenAccountInstruction(
    connection: Connection,
    mint: PublicKey,
    owner: PublicKey,
    payer: PublicKey,
    allowOwnerOffCurve = false
): Promise<{ address: PublicKey, instruction: TransactionInstruction | null, tokenProgramId: PublicKey }> {
    // 1. Determine which token program the mint belongs to
    // This is crucial to avoid "IncorrectProgramId" errors (e.g. standard SPL vs Token-2022)
    let tokenProgramId = TOKEN_PROGRAM_ID;
    try {
        const mintInfo = await connection.getAccountInfo(mint);
        if (mintInfo && mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
            tokenProgramId = TOKEN_2022_PROGRAM_ID;
        }
    } catch (e) {
        console.warn('[TokenUtils] Failed to fetch mint info, defaulting to standard Token Program', e);
    }

    const associatedAddress = await getAssociatedTokenAddress(
        mint,
        owner,
        allowOwnerOffCurve,
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // 2. Check if account exists
    try {
        const account = await connection.getAccountInfo(associatedAddress);
        if (account) {
            // Account exists, no need to create
            return { address: associatedAddress, instruction: null, tokenProgramId };
        }
    } catch (e) {
        // Ignore error, assume account doesn't exist
    }

    // 3. Create instruction to create account with correct program ID
    const instruction = createAssociatedTokenAccountInstruction(
        payer,
        associatedAddress,
        owner,
        mint,
        tokenProgramId,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return { address: associatedAddress, instruction, tokenProgramId };
}

export function createSPLTransferInstruction(
    sourceTokenAccount: PublicKey,
    destinationTokenAccount: PublicKey,
    owner: PublicKey,
    amount: number,
    decimals: number,
    tokenProgramId: PublicKey = TOKEN_PROGRAM_ID // Default to standard, but can be passed
): TransactionInstruction {
    const amountBigInt = BigInt(Math.floor(amount * Math.pow(10, decimals)));

    return createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccount,
        owner,
        amountBigInt,
        [],
        tokenProgramId
    );
}
