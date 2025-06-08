$(document).ready(function () {
    let currentTaskId = null;

    // Handle form submission
    $('#leadForm').submit(function (e) {
        e.preventDefault();

        const company = $('#company').val();
        const industry = $('#industry').val();
        const country = $('#country').val();

        if (!company) {
            alert('Please enter a company name');
            return;
        }

        // Show results section
        $('#resultsSection').removeClass('d-none');
        $('#resultsContainer').empty();
        $('#statusMessage').text('Processing your request...');
        $('#progressBar').css('width', '10%');
        $('#loadingSpinner').show();

        // Send request to backend
        $.ajax({
            url: '/enhance_lead',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                company: company,
                industry: industry,
                country: country
            }),
            success: function (response) {
                currentTaskId = response.task_id;
                monitorTaskProgress();
            },
            error: function () {
                showError('Failed to start processing. Please try again.');
            }
        });
    });

    // Monitor task progress
    function monitorTaskProgress() {
        if (!currentTaskId) return;

        $.get(`/task_status/${currentTaskId}`, function (response) {
            if (response.status === 'completed') {
                $('#progressBar').css('width', '100%');
                $('#statusMessage').html('<i class="bi bi-check-circle-fill text-success me-2"></i>Processing complete!');
                $('#loadingSpinner').hide();
                displayResults(response.data);
            }
            else if (response.status === 'processing') {
                $('#progressBar').css('width', '60%');
                $('#statusMessage').text('Enhancing lead data...');
                setTimeout(monitorTaskProgress, 1000);
            }
            else if (response.status === 'pending') {
                $('#progressBar').css('width', '30%');
                $('#statusMessage').text('Validating request...');
                setTimeout(monitorTaskProgress, 1000);
            }
            else if (response.status === 'failed') {
                showError(`Processing failed: ${response.error || 'Unknown error'}`);
            }
        }).fail(function () {
            showError('Error checking task status');
        });
    }

    // Display results
    function displayResults(data) {
        $('#resultsContainer').html(`
            <div class="row">
                <!-- Company Details Column -->
                <div class="col-lg-6">
                    <div class="result-card">
                        <div class="result-header bg-primary text-white">
                            <i class="bi bi-building me-2"></i>
                            Company Details
                        </div>
                        <div class="result-body">
                            <div class="company-info">
                                ${data.company.logo ?
                `<img src="${data.company.logo}" class="company-logo" alt="Logo">` :
                `<div class="company-logo d-flex align-items-center justify-content-center">
                                        <i class="bi bi-building text-muted" style="font-size: 1.5rem;"></i>
                                    </div>`}
                                <div>
                                    <h3 class="h5">${data.company.name}</h3>
                                    <p class="mb-1">
                                        <a href="https://${data.company.domain}" target="_blank">
                                            ${data.company.domain}
                                        </a>
                                    </p>
                                    <span class="badge bg-info">${data.company.industry || 'Industry not specified'}</span>
                                </div>
                            </div>
                            
                            <div class="mt-4">
                                <h5 class="mb-3">
                                    <i class="bi bi-envelope me-2"></i>
                                    Department Contacts
                                </h5>
                                <div class="d-flex flex-wrap">
                                    ${renderEmailSection(data.emails)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Global Opportunities Column -->
                <div class="col-lg-6">
                    <div class="result-card">
                        <div class="result-header bg-success text-white">
                            <i class="bi bi-globe2 me-2"></i>
                            Global Expansion Opportunities
                        </div>
                        <div class="result-body">
                            <p class="text-muted mb-3">
                                Companies in similar industries and regions:
                            </p>
                            <div class="opportunity-list">
                                ${renderOpportunities(data.geo_expansion)}
                            </div>
                            <div class="mt-4">
                                <button class="btn btn-outline-success btn-action">
                                    <i class="bi bi-download me-1"></i>Export All
                                </button>
                                <button class="btn btn-primary btn-action">
                                    <i class="bi bi-plus-circle me-1"></i>Add to CRM
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    // Render email section
    function renderEmailSection(emails) {
        let html = '';
        const departments = {
            'career': { icon: 'bi-person-badge', label: 'Careers' },
            'support': { icon: 'bi-headset', label: 'Support' },
            'info': { icon: 'bi-info-circle', label: 'Information' }
        };

        for (const [dept, addresses] of Object.entries(emails)) {
            if (addresses.length > 0) {
                const deptInfo = departments[dept] || { icon: 'bi-envelope', label: dept };

                html += `
                    <div class="mb-3 w-100">
                        <div class="d-flex align-items-center mb-2">
                            <i class="${deptInfo.icon} me-2 text-primary"></i>
                            <h6 class="mb-0">${deptInfo.label} Contacts</h6>
                        </div>
                        <div class="d-flex flex-wrap">
                            ${addresses.map(email => `
                                <a href="mailto:${email}" class="email-tag tag-${dept}">
                                    ${email}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }

        return html || '<p class="text-muted">No department emails found</p>';
    }

    // Render opportunities
    function renderOpportunities(opportunities) {
        if (!opportunities || opportunities.length === 0) {
            return '<p class="text-muted">No expansion opportunities found</p>';
        }

        return opportunities.map(company => `
            <div class="opportunity-card">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${company.name}</h6>
                        <div>
                            <span class="badge bg-light text-dark me-2">
                                <i class="bi bi-geo-alt"></i> ${company.country}
                            </span>
                            <span class="badge bg-light text-dark">
                                <i class="bi bi-tag"></i> ${company.industry}
                            </span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-plus-lg"></i> Add
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Show error
    function showError(message) {
        $('#loadingSpinner').hide();
        $('#statusMessage').html(`
            <div class="alert alert-danger d-flex align-items-center">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${message}
            </div>
        `);
        $('#progressBar').css('width', '0%');
    }
});