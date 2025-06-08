# type: ignore
import csv
import random
import pandas as pd

class GeoExpander:
    def __init__(self):
        self.country_groups = {
            "Americas": ["USA", "Canada", "Brazil", "Mexico", "Argentina"],
            "EMEA": ["UK", "Germany", "France", "UAE", "South Africa", "Nigeria"],
            "APAC": ["China", "India", "Japan", "Australia", "Singapore", "Vietnam"]
        }
        
    def expand_coverage(self, industry, country):
        if not industry:
            return []
        
        # Get similar countries in region
        region = self._get_region(country)
        countries = self.country_groups.get(region, [])
        
        # Generate mock companies
        companies = []
        for i in range(5):
            country = random.choice(countries)
            companies.append({
                "name": f"{industry} Company {i+1}",
                "country": country,
                "industry": industry
            })
        
        return companies
    
    def _get_region(self, country):
        for region, countries in self.country_groups.items():
            if country in countries:
                return region
        return "Global"