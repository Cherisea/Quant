"""
Utility functions to support the execution of primary scripts.
"""
import math
from configs import HKPlatformFeePlan, TradeFeesHK

def set_platform_fee_hk(tiers: tuple[tuple[float, float], ...], monthly_orders: int, 
                        plan: HKPlatformFeePlan = "fixed") -> float:
    """Set platform fees based on pricing plan. Note this is only applicable to HK securities traded
        through Tiger broker. 

    Args:
        plan: Tiger pricing plan. Defaults to fixed.
        tiers: tuples of (max_monthly_orders, fee_per_order).
        monthly_orders: total number of trade orders in current month.
    
    Returns:
        platform fee per order.
    """
    if plan == "fixed":
        return TradeFeesHK.platform_fee_fixed
    if monthly_orders < 1:
        raise ValueError("Monthly orders must be an integer.")
    for max_order, fee in tiers:
        if monthly_orders <= max_order:
            return fee
    return tiers[-1][1]

def calc_commission(fees: TradeFeesHK, price: float, qty: int, 
                    platform_per_order: float = 15.0, orders: int = 1) -> float:
    """Calculate all HK trading costs per HKEX fee schedule. Adjust for other markets and
        brokerage.

    Args:
        fees: securities trading fee schedule in a particular stock market.
        price: security price after applying slippage.
        qty: number of shares to purchase.
        platform_per_order: Tiger platform fees per order.
        orders: number of orders to be placed.
    Returns:
        total sum of various fees.
    """
    # Brokerage fees
    turnover = price * qty
    platform_fee = platform_per_order * orders
    brokerage = turnover * fees.commission_rate + platform_fee * orders

    # Third-party fees
    stamp = math.ceil(turnover * fees.stamp_duty)
    sfc = round(turnover * fees.sfc_levy, 2)
    trading = round(turnover * fees.trading_fee, 2)
    settlement = round(turnover * fees.settlement_fee, 2)
    afrc = round(turnover * fees.afrc_levy, 2)
    return brokerage + stamp + sfc + trading + afrc + settlement