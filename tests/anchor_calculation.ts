import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorCalculation } from "../target/types/anchor_calculation";
import { expect } from "chai";

describe("anchor_calculation", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AnchorCalculation as Program<AnchorCalculation>;
  console.log(provider.wallet.publicKey);
  // Derive the PDA
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("calc"), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  it("Initializes PDA", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        user: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Initialization signature:", tx);

    const account = await program.account.calculationResult.fetch(pda);
    expect(account.result.toNumber()).to.equal(0);
  });

  it("Performs addition", async () => {
    await program.methods
      .add(new anchor.BN(20), new anchor.BN(5))  // 20 + 5 = 25
      .accounts({
        calculationResult: pda,
      })
      .rpc();

    const account = await program.account.calculationResult.fetch(pda);
    expect(account.result.toNumber()).to.equal(25);
  });

  it("Performs subtraction", async () => {
    await program.methods
      .subtract(new anchor.BN(10), new anchor.BN(30))  // 10 - 30 = 0 (saturating)
      .accounts({
        calculationResult: pda,
      })
      .rpc();

    const account = await program.account.calculationResult.fetch(pda);
    expect(account.result.toNumber()).to.equal(0);
  });

  it("Performs multiplication", async () => {
    await program.methods
      .multiply(new anchor.BN(6), new anchor.BN(7))  // 6 * 7 = 42
      .accounts({
        calculationResult: pda,
      })
      .rpc();

    const account = await program.account.calculationResult.fetch(pda);
    expect(account.result.toNumber()).to.equal(42);
  });

  it("Performs division", async () => {
    await program.methods
      .divide(new anchor.BN(84), new anchor.BN(2))  // 84 / 2 = 42
      .accounts({
        calculationResult: pda,
      })
      .rpc();

    const account = await program.account.calculationResult.fetch(pda);
    expect(account.result.toNumber()).to.equal(42);
  });

  it("Handles division by zero", async () => {
    try {
      await program.methods
        .divide(new anchor.BN(50), new anchor.BN(0))  // 50 / 0
        .accounts({
          calculationResult: pda,
        })
        .rpc();
    } catch (error) {
      expect(error.message).to.include("Division by zero is not allowed");
    }
  });

  it("Resets PDA to zero", async () => {
    const tx = await program.methods
      .reset()
      .accounts({
        calculationResult: pda,
      })
      .rpc();

    console.log("Reset signature:", tx);

    const account = await program.account.calculationResult.fetch(pda);
    expect(account.result.toNumber()).to.equal(0);
  });
});
