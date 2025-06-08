# type: ignore
from flask import Flask, request, jsonify
from utils.company_resolver import CompanyResolver
from utils.email_finder import EmailFinder
from utils.geo_expander import GeoExpander

app = Flask(__name__)

# Search endpoint - Company details
@app.route('/search_company', methods=['POST'])
def search_company():
    data = request.json
    company = data.get('company')
    industry = data.get('industry', '')
    
    # At least one field required
    if not company and not industry:
        return jsonify({"error": "At least one field is required"}), 400
    
    result = {}
    
    # Get company details if provided
    if company:
        resolver = CompanyResolver()
        company_data = resolver.resolve(company)
        result["company"] = company_data
        
        # Find emails if domain exists
        if company_data.get("domain"):
            email_finder = EmailFinder()
            emails = email_finder.find_emails(
                company_data["domain"], 
                ["career", "support", "info"]
            )
            result["emails"] = emails
    
    return jsonify(result)

# Enhance endpoint - Global opportunities
@app.route('/enhance_lead', methods=['POST'])
def enhance_lead():
    data = request.json
    industry = data.get('industry')
    country = data.get('country')
    
    if not industry or not country:
        return jsonify({"error": "Industry and country required"}), 400
    
    geo_expander = GeoExpander()
    expansion = geo_expander.expand_coverage(industry, country)
    
    return jsonify({
        "geo_expansion": expansion
    })

if __name__ == '__main__':
    app.run(debug= True, port=8000)