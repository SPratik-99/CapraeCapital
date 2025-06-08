# type: ignore
import time
import random

def random_delay(min=1, max=3):
    """Respectful scraping delay"""
    time.sleep(random.uniform(min, max))