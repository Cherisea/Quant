"""
Utility functions to support the execution of primary scripts.
"""
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