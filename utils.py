"""
Utility functions to support the execution of primary scripts.
"""
import sys
import logging

def setup_logging(log_file: str, level: str = "INFO"):
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