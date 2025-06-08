# type: ignore
import re
import requests
from bs4 import BeautifulSoup
from .scrape_helpers import random_delay

class EmailFinder:
    def find_emails(self, domain, departments):
        if not domain:
            return {}
        
        emails = self._scrape_contact_pages(domain, departments)
        
        # Generate pattern-based emails as fallback
        for dept in departments:
            if dept not in emails or not emails[dept]:
                emails[dept] = [f"{dept}@{domain}"]
        
        return emails
    
    def _scrape_contact_pages(self, domain, departments):
        results = {dept: [] for dept in departments}
        urls = [
            f"https://{domain}/contact",
            f"https://{domain}/about",
            f"https://{domain}/careers",
            f"https://{domain}/support"
        ]
        
        for url in urls:
            try:
                random_delay()
                response = requests.get(url, timeout=5)
                soup = BeautifulSoup(response.text, 'html.parser')
                text = soup.get_text()
                
                found_emails = re.findall(
                    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 
                    text
                )
                
                for email in found_emails:
                    for dept in departments:
                        if dept in email.split("@")[0].lower():
                            results[dept].append(email)
            except:
                continue
        
        return results