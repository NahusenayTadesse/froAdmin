export type PaymentOverviewMetrics = {
	ledgerCreditAvailable: number;
	ledgerDebitWithdrawal: number;
	ledgerNetMovement: number;
	ledgerAdjustmentNet: number;
	ledgerHoldBalance: number;
	ledgerReleaseHoldTotal: number;
	providerAvailableBalance: number;
	providerPendingBalance: number;
	providerOnHoldBalance: number;
	withdrawalTotalAmount: number;
	withdrawalRequestedCount: number;
	withdrawalProcessingCount: number;
	withdrawalPaidCount: number;
	withdrawalFailedCount: number;
	stripePaymentSucceededEvents: number;
	stripePaymentFailures: number;
	failedBookingPaymentCount: number;
	stripeRefundEvents: number;
	stripeDisputeEvents: number;
};

export const toCurrency = (value: number, currency = 'USD') =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
		maximumFractionDigits: 2
	}).format(value);
