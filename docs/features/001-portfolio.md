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
- PortfolioExchange
- Position
- CashBalance
- Asset
- PortfolioSnapshot

## Main Flows

- User adds a position
- User adds an already-owned asset and the system increases quantity while recalculating weighted average cost
- User can open an aggregated asset row and see the position quantity split by exchange/platform
- User adds portfolio exchanges/platforms with a name and market type: crypto or stock
- User selects the position exchange/platform from the exchanges added to the portfolio, sees matching free cash for the cost currency when it exists, and the system deducts purchase cost from that cash balance when the position is added
- System logs asset purchases in portfolio activity history when a position is added or increased
- User sells an asset from a selected exchange/platform, with sell quantity capped at the quantity stored on that platform holding
- System increases the selected exchange/platform cash balance in the position cost currency by the sale proceeds
- System logs asset sales in portfolio activity history and shows a success notification after the operation
- User edits quantity or average price
- User removes a position
- User adds cash for an existing portfolio exchange/currency and the system increases that balance
- User withdraws cash from an existing exchange/currency balance, with the withdrawal amount capped at the available balance
- System logs cash deposits and withdrawals in portfolio activity history
- System refreshes prices
- System recalculates value, P&L, and weights

## Edge Cases

- Missing market price
- Multiple currencies
- Zero or partial position
- Duplicate ticker with different intent
- Asset symbol changes
- Missing free cash for a new exchange/platform
- No portfolio exchanges have been added yet
- Selected exchange type does not match the asset operation type
- Insufficient free cash on an existing exchange/platform and cost currency
- Withdrawal amount greater than the selected exchange/currency cash balance
- Sale quantity greater than the quantity available on the selected exchange/platform holding

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

None for Phase 1.

Resolved for MVP: positions use one aggregated quantity and weighted average cost per asset. Tax lots and per-transaction history are deferred.

Resolved for MVP: platform-level position holdings are stored as a breakdown under the aggregated position so the user can see how much of an asset is held on each exchange/platform without introducing full tax lots.

Resolved for MVP: free cash is stored by platform and currency. Portfolio base currency is selectable between USD, EUR, and PLN, and supported balances and holdings are converted with Frankfurter for summary totals. If a required FX rate is unavailable, affected totals are marked incomplete.

## Future Extensions

- Import from broker CSV
- Tax lots
- Dividend tracking
- Performance attribution
