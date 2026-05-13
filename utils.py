"""
Utility functions to support the execution of primary scripts.
"""
import sys
import math
import logging

from configs import BacktestRisk, HKPlatformFeePlan, TradeFeesHK

def setup_logging(log_file: str, level: str = "INFO"):
    """Set up a logger for a script.

    Args:
        log_file: name of file to store logs
        level: severity of information to be logged
    """
    root = logging.getLogger()

    # Avoid duplicate handlers 
    if root.handlers:
        return
    
    root.setLevel(getattr(logging, level.upper(), "INFO"))
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    
    # Configure handlers
    fh = logging.FileHandler(log_file)
    fh.setFormatter(fmt)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(fmt)

    # Attach handlers to logger
    root.addHandler(fh)
    root.addHandler(sh)

def round_to_lot(lot_size, qty: int) -> int:
        """Round requested quantity to a multiple of lot size.

        Args:
            lot_size: number of shares in one lot
            qty: number of requested shares.
        
        Returns:
            Requested shares as a multiple of lot size.
        """
        return (qty // lot_size) * lot_size

def apply_slippage(slippage_bps, price: float, side: str) -> float:
    """Calculate slippage adjusted stock price based on action type. As slippage always works 
        against us, selling prices are adjusted lower, while buying prices higher.

    Args:
        slippage_bps: assumed trading price gap measured in base point
        price: expected stock price
        side: a string indicating type of price action

    Returns:
        slippage adjusted price.
    """
    offset = price * slippage_bps / 10_000
    return price + offset if side == "BUY" else price - offset

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