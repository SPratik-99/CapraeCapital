# type: ignore
import requests
from bs4 import BeautifulSoup
from .scrape_helpers import random_delay

class CompanyResolver:
    def resolve(self, company_name):
        # Try Clearbit API first
        api_result = self._api_resolve(company_name)
        if api_result:
            return api_result
        
        # Fallback to Google scraping
        return self._google_resolve(company_name)
    
    def _api_resolve(self, name):
        try:
            response = requests.get(
                f"https://autocomplete.clearbit.com/v1/companies/suggest?query={name}",
                timeout=5
            )
            if response.status_code == 200 and response.json():
                match = response.json()[0]
                return {
                    "name": match["name"],
                    "domain": match["domain"],
                    "logo": match.get("logo", ""),
                    "industry": match.get("industry", "")
                }
        except:
            return None
    
    def _google_resolve(self, name):
        try:
            random_delay()
            headers = {"User-Agent": "Mozilla/5.0"}
            response = requests.get(
                f"https://www.google.com/search?q={name}+company",
                headers=headers
            )
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract domain from knowledge panel
            domain = ""
            for a in soup.select("a"):
                href = a.get("href", "")
                if "url?q=" in href and "google" not in href:
                    domain = href.split("url?q=")[1].split("&")[0]
                    break
            
            return {
                "name": name,
                "domain": domain,
                "industry": "Unknown"
            }
        except:
            return {"name": name, "domain": "", "industry": "Unknown"}