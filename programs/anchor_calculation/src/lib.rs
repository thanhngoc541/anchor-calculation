use anchor_lang::prelude::*;

declare_id!("J69gGXGkjoMB7E4kDjXBYHstuGReKgrbEWvsvHuTApKZ");

#[program]
pub mod anchor_calculation {
    use super::*;

    pub fn add(ctx: Context<Update>, a: u64, b: u64) -> Result<()> {
        let result = a + b;
        store_result(ctx, result)?;
        Ok(())
    }

    pub fn subtract(ctx: Context<Update>, a: u64, b: u64) -> Result<()> {
        let result = a.saturating_sub(b);
        store_result(ctx, result)?;
        Ok(())
    }

    pub fn multiply(ctx: Context<Update>, a: u64, b: u64) -> Result<()> {
        let result = a * b;
        store_result(ctx, result)?;
        Ok(())
    }

    pub fn divide(ctx: Context<Update>, a: u64, b: u64) -> Result<()> {
        require!(b != 0, ErrorCode::DivisionByZero);
        let result = a / b;
        store_result(ctx, result)?;
        Ok(())
    }

    pub fn initialize(ctx: Context<Calculate>) -> Result<()> {
        ctx.accounts.calculation_result.result = 0;
        ctx.accounts.calculation_result.authority = ctx.accounts.user.key();
        Ok(())
    }

    pub fn reset(ctx: Context<Reset>) -> Result<()> {
        ctx.accounts.calculation_result.result = 0;
        Ok(())
    }
}

// Store Result Helper
fn store_result(ctx: Context<Update>, result: u64) -> Result<()> {
    ctx.accounts.calculation_result.result = result;
    Ok(())
}

// Separate Initialization Logic
#[derive(Accounts)]
#[instruction()]
pub struct Calculate<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 8 + 32,
        seeds = [b"calc", user.key().as_ref()],
        bump
    )]
    pub calculation_result: Account<'info, CalculationResult>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Update PDA Without Re-initialization
#[derive(Accounts)]
pub struct Update<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub calculation_result: Account<'info, CalculationResult>,
    pub authority: Signer<'info>,
}

// Reset PDA
#[derive(Accounts)]
pub struct Reset<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub calculation_result: Account<'info, CalculationResult>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

// PDA Structure
#[account]
pub struct CalculationResult {
    pub result: u64,
    pub authority: Pubkey,
}

// Custom Error Codes
#[error_code]
pub enum ErrorCode {
    #[msg("The PDA has already been initialized.")]
    AlreadyInitialized,
    #[msg("Division by zero is not allowed.")]
    DivisionByZero,
}
