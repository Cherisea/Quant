"""
Utility functions to support the execution of primary scripts.
"""
import sys
import logging

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