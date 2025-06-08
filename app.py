# type: ignore
from flask import Flask, request, jsonify, render_template
from utils.company_resolver import CompanyResolver
from utils.email_finder import EmailFinder
from utils.geo_expander import GeoExpander
import uuid
import threading
from collections import defaultdict
from enum import Enum
from waitress import serve

app = Flask(__name__)

# In-memory task storage
task_results = defaultdict(dict)
task_lock = threading.Lock()

class TaskStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

def update_task_status(task_id, status, data=None, error=None):
    with task_lock:
        if data:
            task_results[task_id] = {"status": status, "data": data}
        elif error:
            task_results[task_id] = {"status": status, "error": error}
        else:
            task_results[task_id]["status"] = status

def process_lead_enhancement(task_id, company_name, industry, country):
    try:
        update_task_status(task_id, TaskStatus.PROCESSING.value)
        
        # Quality components
        resolver = CompanyResolver()
        company_data = resolver.resolve(company_name)
        
        email_finder = EmailFinder()
        emails = email_finder.find_emails(
            company_data["domain"], 
            ["career", "support", "info"]
        )
        
        # Quantity component
        geo_expander = GeoExpander()
        geo_data = geo_expander.expand_coverage(
            industry, 
            country
        )
        
        result = {
            "company": company_data,
            "emails": emails,
            "geo_expansion": geo_data
        }
        
        update_task_status(task_id, TaskStatus.COMPLETED.value, data=result)
        
    except Exception as e:
        update_task_status(task_id, TaskStatus.FAILED.value, error=str(e))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/enhance_lead', methods=['POST'])
def enhance_lead():
    data = request.json
    company = data.get('company')
    industry = data.get('industry', '')
    country = data.get('country', '')
    
    if not company:
        return jsonify({"error": "Company name required"}), 400
    
    task_id = str(uuid.uuid4())
    update_task_status(task_id, TaskStatus.PENDING.value)
    
    thread = threading.Thread(
        target=process_lead_enhancement,
        args=(task_id, company, industry, country),
        daemon=True
    )
    thread.start()
    
    return jsonify({
        "task_id": task_id,
        "status": TaskStatus.PENDING.value,
        "message": "Processing lead enhancement"
    })

@app.route('/task_status/<task_id>', methods=['GET'])
def task_status(task_id):
    with task_lock:
        result = task_results.get(task_id)
    
    if not result:
        return jsonify({"error": "Task not found"}), 404
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=8000)