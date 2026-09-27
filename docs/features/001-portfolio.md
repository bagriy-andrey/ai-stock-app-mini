# 001 - Portfolio

## Goal

Allow the user to manually maintain a real investment portfolio and understand allocation, value, P&L, and risk context.

## User Value

The user can see what they own, how the portfolio is allocated, whether concentration is increasing, and which holdings need attention.

## Scope

- Add, edit, and remove real portfolio positions
- Store cash balance and base currency
- Track asset type, quantity, average purchase price, current value, currency, weight, P&L, notes, and investment intent
- Show sector, geographic, and currency exposure when data is available
- Display portfolio-level value, daily change, allocation, and risk summary

## Non-Goals

- Real brokerage trading
- Automated order execution
- Advanced tax reporting
- Complex performance attribution

## Inputs

- User-entered positions
- User-entered cash balance
- Market prices
- Asset metadata

## Outputs

- Holdings table
- Allocation view
- P&L view
- Exposure summary
- AI assessment in later phases

## Core Data / Entities

- Portfolio
- Position
- CashBalance
- Asset
- PortfolioSnapshot

## Main Flows

- User adds a position
- User edits quantity or average price
- User removes a position
- System refreshes prices
- System recalculates value, P&L, and weights

## Edge Cases

- Missing market price
- Multiple currencies
- Zero or partial position
- Duplicate ticker with different intent
- Asset symbol changes

## Dependencies

- Market data
- Asset metadata
- Database

## Acceptance Criteria

- User can manage positions manually
- Portfolio value and weights update from current prices
- Cash is included in total portfolio value
- Real portfolio is never modified by autonomous AI actions

## Open Questions

- How should multi-currency cash balances be represented initially?
- Should position lots be tracked in MVP or only average price?

## Future Extensions

- Import from broker CSV
- Tax lots
- Dividend tracking
- Performance attribution

