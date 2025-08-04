// ==================== GLOBAL VARIABLES ====================
let sidebarCollapsed = false;
let selectedCompanies = [];
let yearRange = [];
let metricsCompany = '';
let uniqueCompanies = [];
let minYear = 0;
let maxYear = 0;
let dataset = [];

function initDashboard(data) {
  // 👉 This is where you:
  // - Populate dropdowns
  // - Init filters
  // - Render metrics
  // - Draw charts using Plotly
  // You can split into more helper functions like:
  //   populateCompanies(data)
  //   setupYearSlider(data)
  //   drawGenderChart(data)
  //   etc.


// ==================== DATA PROCESSING ====================
function processData() {
    // Convert to array of objects and calculate derived metrics
    dataset = [];
    for (let i = 0; i < data['COMPANY NAME'].length; i++) {
        const row = {};
        for (const [key, values] of Object.entries(data)) {
            row[key] = values[i];
        }
        
        // Calculate derived metrics
        row['% Female Directors'] = Math.round((row['No of Female Director'] / row['Number of Board Member'] * 100) * 10) / 10;
        row['% Independent Directors'] = Math.round((row['No of Independent Directors'] / row['Number of Board Member'] * 100) * 10) / 10;
        
        dataset.push(row);
    }
    
    console.log('Processed dataset:', dataset);
}

// ==================== INITIALIZE DATA-DRIVEN VARIABLES ====================
function initializeDataDrivenVariables() {
    // Get unique companies from data
    uniqueCompanies = [...new Set(data['COMPANY NAME'])];
    selectedCompanies = [...uniqueCompanies]; // Select all by default
    
    // Get year range from data
    const years = [...new Set(data['YEAR'])].sort((a, b) => a - b);
    minYear = Math.min(...years);
    maxYear = Math.max(...years);
    yearRange = [minYear, maxYear];
    
    // Set default metrics company
    metricsCompany = uniqueCompanies[0];
    
    console.log('Unique companies:', uniqueCompanies);
    console.log('Year range:', minYear, '-', maxYear);
}

// ==================== POPULATE FILTERS ====================
function populateFilters() {

    // Display selected company tags
    updateCompanyTags();
    
    // Populate metrics company dropdown
    const metricsDropdown = document.getElementById('metrics-company-dropdown');
    metricsDropdown.innerHTML = '';
    uniqueCompanies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        if (company === metricsCompany) option.selected = true;
        metricsDropdown.appendChild(option);
    });
    
    // Setup year range sliders
    const yearMinSlider = document.getElementById('year-min');
    const yearMaxSlider = document.getElementById('year-max');
    
    yearMinSlider.min = minYear;
    yearMinSlider.max = maxYear;
    yearMinSlider.value = minYear;
    
    yearMaxSlider.min = minYear;
    yearMaxSlider.max = maxYear;
    yearMaxSlider.value = maxYear;
    
    // Update year displays
    document.getElementById('year-min-display').textContent = minYear;
    document.getElementById('year-max-display').textContent = maxYear;
    document.getElementById('year-mark-min').textContent = minYear;
    document.getElementById('year-mark-max').textContent = maxYear;
    
    // Update selected year range display
    updateSelectedYearDisplay();
}

// ==================== COMPANY TAG FUNCTIONS ====================
function updateCompanyTags() {
    const container = document.getElementById('company-tags-container');
    container.innerHTML = '';
    
    if (selectedCompanies.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic; margin: 10px; text-align: center;">No companies selected</p>';
    } else {
        selectedCompanies.forEach(company => {
            const tag = document.createElement('div');
            tag.className = 'company-tag';
            tag.innerHTML = `
                ${truncateText(company, 25)}
                <span class="remove-tag" onclick="removeCompany('${company.replace(/'/g, "\\'")}')">&times;</span>
            `;
            container.appendChild(tag);
        });
    }
}

function selectAllCompanies() {
    selectedCompanies = [...uniqueCompanies];
    updateCompanyTags();
    updateDashboard();
}

function clearAllCompanies() {
    selectedCompanies = [];
    updateCompanyTags();
    updateDashboard(); 
}

function removeCompany(company) {
    selectedCompanies = selectedCompanies.filter(c => c !== company);
    updateCompanyTags();
    updateDashboard();
}

function updateSelectedYearDisplay() {
    const yearRangeSpan = document.getElementById('selected-year-range');
    if (yearRange[0] === yearRange[1]) {
        yearRangeSpan.textContent = yearRange[0];
    } else {
        yearRangeSpan.textContent = `${yearRange[0]} - ${yearRange[1]}`;
    }
}

// ==================== UTILITY FUNCTIONS ====================
function filterData(companies, yearMin, yearMax) {
    return dataset.filter(row => 
        companies.includes(row['COMPANY NAME']) &&
        row['YEAR'] >= yearMin &&
        row['YEAR'] <= yearMax
    );
}

function getMetricValue(values) {
    if (values.length > 1) {
        return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    } else if (values.length === 1) {
        return Math.round(values[0] * 10) / 10;
    } else {
        return "N/A";
    }
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
}

// ==================== DOWNLOAD FUNCTIONS ====================
function downloadChart(chartId, filename) {
    const plotElement = document.getElementById(chartId);
    
    // Get the current plot
    const gd = plotElement;
    
    // Create a layout specifically for download with company names
    const originalLayout = gd.layout;
    const downloadLayout = {
        ...originalLayout,
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        font: { ...originalLayout.font, color: 'black' },
        // Ensure annotations (company names) are preserved and visible
        annotations: originalLayout.annotations ? originalLayout.annotations.map(ann => ({
            ...ann,
            font: { ...ann.font, color: 'black', size: Math.max(ann.font.size, 12) }
        })) : []
    };
    
    // Download the plot with enhanced layout
    Plotly.downloadImage(gd, {
        format: 'png',
        width: Math.max(1400, getChartWidth()),
        height: 700,
        filename: filename,
        // Use the download layout
        layout: downloadLayout
    });
}

function enlargeChart(chartId, chartTitle) {
    const modal = document.getElementById('chart-modal');
    const modalTitle = document.getElementById('modal-chart-title');
    const enlargedChartDiv = document.getElementById('enlarged-chart');
    
    modalTitle.textContent = chartTitle;
    modal.style.display = 'block';
    
    // Get the original chart data and layout
    const originalChart = document.getElementById(chartId);
    const data = originalChart.data;
    const layout = {
        ...originalChart.layout,
        width: null,
        height: null,
        autosize: true,
        // Ensure annotations (company names) are preserved in enlarged view
        annotations: originalChart.layout.annotations ? originalChart.layout.annotations.map(ann => ({
            ...ann,
            font: { ...ann.font, size: Math.max(ann.font.size, 14) }
        })) : []
    };
    
    // Create enlarged chart
    Plotly.newPlot(enlargedChartDiv, data, layout, { responsive: true });
}

function closeChartModal() {
    const modal = document.getElementById('chart-modal');
    modal.style.display = 'none';
    
    // Clear the enlarged chart
    document.getElementById('enlarged-chart').innerHTML = '';
}

function downloadDashboard() {
    const dashboard = document.getElementById('main-content');
    
    // Temporarily set background to white for all chart containers
    const chartContainers = document.querySelectorAll('.chart-container, .metrics-section, .insights-section, .header-section');
    const originalBackgrounds = [];
    
    chartContainers.forEach(container => {
        originalBackgrounds.push(container.style.background);
        container.style.background = 'white';
    });
    
    // Use html2canvas to capture the dashboard
    html2canvas(dashboard, {
        backgroundColor: 'white',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: dashboard.scrollWidth,
        height: dashboard.scrollHeight
    }).then(canvas => {
        // Create download link
        const link = document.createElement('a');
        link.download = 'Corporate_Governance_Dashboard.png';
        link.href = canvas.toDataURL();
        link.click();
        
        // Restore original backgrounds
        chartContainers.forEach((container, index) => {
            container.style.background = originalBackgrounds[index];
        });
    }).catch(error => {
        console.error('Error generating dashboard image:', error);
        alert('Error generating dashboard image. Please try again.');
        
        // Restore original backgrounds in case of error
        chartContainers.forEach((container, index) => {
            container.style.background = originalBackgrounds[index];
        });
    });
}

function downloadCSV() {
    const filteredData = filterData(selectedCompanies, yearRange[0], yearRange[1]);
    
    if (filteredData.length === 0) {
        alert('No data to download. Please select companies and ensure data exists for the selected year range.');
        return;
    }
    
    // Get headers
    const headers = Object.keys(filteredData[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    filteredData.forEach(row => {
        const values = headers.map(header => {
            let value = row[header];
            // Handle values that might contain commas
            if (typeof value === 'string' && value.includes(',')) {
                value = `"${value}"`;
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Corporate_Governance_Data.csv';
    link.click();
}

// ==================== SIDEBAR FUNCTIONALITY ====================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    sidebarCollapsed = !sidebarCollapsed;
    
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('sidebar-collapsed');
        toggleBtn.innerHTML = '☰';
    } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('sidebar-collapsed');
        toggleBtn.innerHTML = '✕';
    }
    
    // Resize charts after sidebar toggle
    setTimeout(() => {
        if (selectedCompanies.length > 0) {
            Plotly.Plots.resize('gender-chart');
            Plotly.Plots.resize('independence-chart');
            Plotly.Plots.resize('meetings-chart');
            Plotly.Plots.resize('audit-chart');
        }
    }, 300);
}

// ==================== CHART FUNCTIONS ====================
function getChartWidth() {
    const companies = selectedCompanies.length;
    const minWidth = 800;
    const widthPerCompany = 150;
    return Math.max(minWidth, companies * widthPerCompany);
}

function createGenderChart(filteredData) {
    const companies = [...new Set(filteredData.map(row => row['COMPANY NAME']))];
    
    let allXLabels = [];
    let maleValues = [];
    let femaleValues = [];
    let xPositions = [];
    let companyBoundaries = [];
    let companyLabels = [];
    
    let position = 0;
    
    companies.forEach((company, companyIndex) => {
        const companyData = filteredData
            .filter(row => row['COMPANY NAME'] === company)
            .sort((a, b) => a['YEAR'] - b['YEAR']);
        
        const companyStart = position;
        
        companyData.forEach(row => {
            allXLabels.push(row['YEAR'].toString());
            maleValues.push(row['No of Male Director']);
            femaleValues.push(row['No of Female Director']);
            xPositions.push(position);
            companyLabels.push(company);
            position++;
        });
        
        const companyEnd = position - 1;
        companyBoundaries.push({ company, start: companyStart, end: companyEnd });
        
        if (companyIndex < companies.length - 1) position++;
    });
    
    const traces = [
        {
            name: 'Male',
            x: xPositions,
            y: maleValues,
            type: 'bar',
            marker: { 
                color: '#87CEEB',
                line: {
                    color: '#5A9BD4',
                    width: 1
                }
            },
            text: maleValues.map(v => v.toString()),
		    textposition: 'inside',
            insidetextanchor: 'middle',
		    textfont: { color: 'white', size: 10 },
            customdata: companyLabels.map((comp, i) => [comp, allXLabels[i]]),
            hovertemplate: '<b>%{customdata[0]}</b><br>Year: %{customdata[1]}<br>Male Directors: %{y}<extra></extra>'
        },
        {
            name: 'Female',
            x: xPositions,
            y: femaleValues,
            type: 'bar',
            marker: { 
                color: '#FF8C00',
                line: {
                    color: '#E6791A',
                    width: 1
                }
            },
            text: femaleValues.map(v => v > 0 ? v.toString() : ''),
		    textposition: 'inside',
            insidetextanchor: 'middle',
		    textfont: { color: 'white', size: 10 },
            customdata: companyLabels.map((comp, i) => [comp, allXLabels[i]]),
            hovertemplate: '<b>%{customdata[0]}</b><br>Year: %{customdata[1]}<br>Female Directors: %{y}<extra></extra>'
        }
    ];
    
    const chartWidth = getChartWidth();
    
    const layout = {
        xaxis: {
            title: '',
            tickvals: xPositions,
            ticktext: allXLabels,
            tickmode: 'array',
            tickfont: { size: 10 },
            tickangle: -90
        },
        yaxis: {
            title: 'Number of Directors',
            showgrid: true,
            gridcolor: 'lightgray'
        },
        barmode: 'stack',
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        font: { family: 'Arial, sans-serif', color: 'black' },
        bargap: 0,
        legend: {
            orientation: 'h',
            yanchor: 'bottom',
            y: 1.02,
            xanchor: 'center',
            x: 0.1
        },
        height: 350,
        width: chartWidth,
        margin: { b: 80, t: 20, l: 50, r: 50 },
        annotations: []
    };
    
    // Add company name annotations with improved styling
    companyBoundaries.forEach(({ company, start, end }) => {
        const centerPos = (start + end) / 2;
        const barWidth = end - start + 1;
        const maxChars = Math.max(8, Math.floor(barWidth * 8));
        const displayName = truncateText(company, maxChars);
        
        layout.annotations.push({
            x: centerPos,
            y: -0.25,
            text: `<b>${displayName}</b>`,
            showarrow: false,
            font: { size: 11, color: 'black', family: 'Arial, sans-serif' },
            xref: 'x',
            yref: 'paper',
            xanchor: 'center'
        });
    });
    
    const config = { 
        responsive: true,
        toImageButtonOptions: {
            format: 'png',
            filename: 'Board_Gender_Composition',
            height: 700,
            width: 1400,
            scale: 1
        }
    };
    
    Plotly.newPlot('gender-chart', traces, layout, config);
}

function createIndependenceChart(filteredData) {
    const companies = [...new Set(filteredData.map(row => row['COMPANY NAME']))];
    
    let allXLabels = [];
    let independentValues = [];
    let dependentValues = [];
    let xPositions = [];
    let companyBoundaries = [];
    let companyLabels = [];
    
    let position = 0;
    
    companies.forEach((company, companyIndex) => {
        const companyData = filteredData
            .filter(row => row['COMPANY NAME'] === company)
            .sort((a, b) => a['YEAR'] - b['YEAR']);
        
        const companyStart = position;
        
        companyData.forEach(row => {
            allXLabels.push(row['YEAR'].toString());
            independentValues.push(row['No of Independent Directors']);
            dependentValues.push(row['Number of Board Member'] - row['No of Independent Directors']);
            xPositions.push(position);
            companyLabels.push(company);
            position++;
        });
        
        const companyEnd = position - 1;
        companyBoundaries.push({ company, start: companyStart, end: companyEnd });
        
        if (companyIndex < companies.length - 1) position++;
    });
    
    const traces = [
	    {
		    name: 'Independent Directors',
		    x: xPositions,
		    y: independentValues,
		    type: 'bar',
		    marker: { 
			    color: '#2ecc71',
			    line: {
				    color: '#27AE60',
				    width: 1
			    }
		    },
		    text: independentValues.map(v => v.toString()),
		    textposition: 'inside',
            insidetextanchor: 'middle',
		    textfont: { color: 'white', size: 10 },
		    customdata: companyLabels.map((comp, i) => [comp, allXLabels[i]]),
		    hovertemplate: '<b>%{customdata[0]}</b><br>Year: %{customdata[1]}<br>Independent Directors: %{y}<extra></extra>'
	    },
	    {
		    name: 'Dependent Directors',
		    x: xPositions,
		    y: dependentValues,
		    type: 'bar',
		    marker: { 
			    color: '#95a5a6',
			    line: {
				    color: '#7F8C8D',
				    width: 1
			    }
		    },
		    text: dependentValues.map(v => v.toString()),
		    textposition: 'inside',
            insidetextanchor: 'middle',
		    textfont: { color: 'white', size: 10 },
		    customdata: companyLabels.map((comp, i) => [comp, allXLabels[i]]),
		    hovertemplate: '<b>%{customdata[0]}</b><br>Year: %{customdata[1]}<br>Dependent Directors: %{y}<extra></extra>'
	    }
    ];
    
    const chartWidth = getChartWidth();
    
    const layout = {
        xaxis: {
            title: '',
            tickvals: xPositions,
            ticktext: allXLabels,
            tickmode: 'array',
            tickfont: { size: 10 },
            tickangle: -90
        },
        yaxis: {
            title: 'Number of Directors',
            showgrid: true,
            gridcolor: 'lightgray'
        },
        barmode: 'stack',
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        font: { family: 'Arial, sans-serif', color: 'black' },
        bargap: 0,
        legend: {
            orientation: 'h',
            yanchor: 'bottom',
            y: 1.02,
            xanchor: 'center',
            x: 0.2
        },
        height: 350,
        width: chartWidth,
        margin: { b: 80, t: 20, l: 50, r: 50 },
        annotations: []
    };

    // Add company name annotations with improved styling
    companyBoundaries.forEach(({ company, start, end }) => {
        const centerPos = (start + end) / 2;
        const barWidth = end - start + 1;
        const maxChars = Math.max(8, Math.floor(barWidth * 8));
        const displayName = truncateText(company, maxChars);
        
        layout.annotations.push({
            x: centerPos,
            y: -0.25,
            text: `<b>${displayName}</b>`,
            showarrow: false,
            font: { size: 11, color: 'black', family: 'Arial, sans-serif' },
            xref: 'x',
            yref: 'paper',
            xanchor: 'center'
        });
    });
    
    const config = { 
        responsive: true,
        toImageButtonOptions: {
            format: 'png',
            filename: 'Board_Independence',
            height: 700,
            width: 1400,
            scale: 1
        }
    };
    
    Plotly.newPlot('independence-chart', traces, layout, config);
}
// Generate unique color per company
function generateColorMap(labels) {
    const colorMap = {};
    const total = labels.length;
    labels.forEach((label, i) => {
        const hue = (i * 360) / total;
        colorMap[label] = `hsl(${hue}, 70%, 50%)`;
    });
    return colorMap;
}

function createMeetingsChart(filteredData) {
    const companies = [...new Set(filteredData.map(row => row['COMPANY NAME']))];
    
    // Generate color map for all companies
    const companyColorMap = generateColorMap(companies);

    filteredData.forEach(row => {
        const companyName = row['COMPANY NAME'];
        const color = companyColorMap[companyName];
        console.log(`Company: ${companyName}, Color: ${color}`);
    });
    
    const traces = companies.map((company, index) => {
        const companyData = filteredData
            .filter(row => row['COMPANY NAME'] === company)
            .sort((a, b) => a['YEAR'] - b['YEAR']);
        
        const displayName = truncateText(company, 25);
        
        return {
            x: companyData.map(row => row['YEAR']),
            y: companyData.map(row => row['No of Board Meeting']),
            type: 'scatter',
            mode: 'lines+markers',
            name: displayName,
            line: { 
                width: 3, 
                color: companyColorMap[company] // Use the generated color map
            },
            marker: { size: 8 },
            hovertemplate: `<b>${company}</b><br>Year: %{x}<br>Board Meetings: %{y}<br><extra></extra>`
        };
    });

    const chartWidth = getChartWidth();
    
    const layout = {
        xaxis: {
            title: '',
            tickfont: { size: 10 }
        },
        yaxis: { 
            title: 'Number of Meetings',
            showgrid: true,
            gridcolor: 'lightgray'
        },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        font: { family: 'Arial, sans-serif', color: 'black' },
        hovermode: 'x unified',
        legend: { font: { size: 10 } },
        height: 350,
        width: chartWidth,
        margin: { b: 50, t: 20, l: 50, r: 50 }
    };
    
    const config = { 
        responsive: true,
        toImageButtonOptions: {
            format: 'png',
            filename: 'Board_Meeting_Frequency',
            height: 700,
            width: 1400,
            scale: 1
        }
    };
    
    Plotly.newPlot('meetings-chart', traces, layout, config);
}

function createAuditChart(filteredData) {
    const companies = [...new Set(filteredData.map(row => row['COMPANY NAME']))];
    
    let allXLabels = [];
    let membersValues = [];
    let meetingsValues = [];
    let xPositions = [];
    let companyBoundaries = [];
    let companyLabels = [];
    
    let position = 0;
    
    companies.forEach((company, companyIndex) => {
        const companyData = filteredData
            .filter(row => row['COMPANY NAME'] === company)
            .sort((a, b) => a['YEAR'] - b['YEAR']);
        
        const companyStart = position;
        
        companyData.forEach(row => {
            allXLabels.push(row['YEAR'].toString());
            membersValues.push(row['Number of Audit Committee']);
            meetingsValues.push(row['No of Audit Committee Meeting']);
            xPositions.push(position);
            companyLabels.push(company);
            position++;
        });
        
        const companyEnd = position - 1;
        companyBoundaries.push({ company, start: companyStart, end: companyEnd });
        
        if (companyIndex < companies.length - 1) position++;
    });
    
    // Calculate the max values to determine the scale
    const maxMembers = Math.max(...membersValues);
    const maxMeetings = Math.max(...meetingsValues);
    
    // Ensure both axes end at the same visual point
    const primaryMax = Math.max(maxMembers, maxMeetings / 2);
    const finalRange = Math.ceil(primaryMax) + 1;

    const traces = [
        {
            name: 'Audit Committee Members',
            x: xPositions,
            y: membersValues,
            type: 'bar',
            marker: { 
                color: '#9b59b6',
                line: {
                    color: '#8E44AD',
                    width: 1
                }
            },
            text: membersValues.map(v => v.toString()),
 		    textposition: 'inside',
            insidetextanchor: 'middle',
		    textfont: { color: 'white', size: 10 },
            customdata: companyLabels.map((comp, i) => [comp, allXLabels[i]]),
            hovertemplate: '<b>%{customdata[0]}</b><br>Year: %{customdata[1]}<br>Audit Committee Members: %{y}<br><extra></extra>'
        },
        {
            name: 'Audit Committee Meetings',
            x: xPositions,
            y: meetingsValues,
            type: 'scatter',
            mode: 'lines+markers',
            line: { width: 3, color: '#f39c12' },
            marker: { size: 8 },
            yaxis: 'y2',
            customdata: companyLabels.map((comp, i) => [comp, allXLabels[i]]),
            hovertemplate: '<b>%{customdata[0]}</b><br>Year: %{customdata[1]}<br>Audit Committee Meetings: %{y}<br><extra></extra>'
        }
    ];
    
    const chartWidth = getChartWidth();
    
    const layout = {
        xaxis: {
            title: '',
            tickvals: xPositions,
            ticktext: allXLabels,
            tickmode: 'array',
            tickfont: { size: 10 },
            tickangle: -90
        },
        yaxis: {
            title: 'Number of Members',
            showgrid: true,
            gridcolor: 'lightgray',
            range: [0, finalRange],
            dtick: 1,
            tick0: 0  // Ensure ticks start at 0
        },
        yaxis2: {
            title: 'Number of Meetings',
            overlaying: 'y',
            side: 'right',
            showgrid: false,  // Hide secondary grid lines
            range: [0, finalRange * 2],  // Exactly double the primary range
            dtick: 2,  // Tick every 2 units
            tick0: 0   // Ensure ticks start at 0
        },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        font: { family: 'Arial, sans-serif', color: 'black' },
        hovermode: 'x unified',
        bargap: 0,
        legend: {
            orientation: 'h',
            yanchor: 'bottom',
            y: 1.02,
            xanchor: 'center',
            x: 0.2
        },
        height: 350,
        width: chartWidth,
        margin: { b: 80, t: 20, l: 40, r: 40 },
        annotations: []
    };
    
    // Add company name annotations with improved styling
    companyBoundaries.forEach(({ company, start, end }) => {
        const centerPos = (start + end) / 2;
        const barWidth = end - start + 1;
        const maxChars = Math.max(8, Math.floor(barWidth * 8));
        const displayName = truncateText(company, maxChars);
        
        layout.annotations.push({
            x: centerPos,
            y: -0.25,
            text: `<b>${displayName}</b>`,
            showarrow: false,
            font: { size: 11, color: 'black', family: 'Arial, sans-serif' },
            xref: 'x',
            yref: 'paper',
            xanchor: 'center'
        });
    });

    const config = { 
        responsive: true,
        toImageButtonOptions: {
            format: 'png',
            filename: 'Audit_Committee',
            height: 700,
            width: 1400,
            scale: 1
        }
    };
    
    Plotly.newPlot('audit-chart', traces, layout, config);
}


// ==================== METRICS AND INSIGHTS ====================
function updateMetricsCards() {
    const filteredData = filterData([metricsCompany], yearRange[0], yearRange[1]);
    
    // Determine if we need "Avg" prefix
    const isMultipleYears = yearRange[0] !== yearRange[1];
    const avgPrefix = isMultipleYears ? "Avg " : "";
    
    const metrics = [
        {
            label: `${avgPrefix}Board Size`,
            values: filteredData.map(row => row['Number of Board Member']),
            suffix: "",
            color: "#3498db"
        },
        {
            label: `${avgPrefix}Female Directors`,
            values: filteredData.map(row => row['% Female Directors']),
            suffix: "%",
            color: "#e74c3c"
        },
        {
            label: `${avgPrefix}Independence`,
            values: filteredData.map(row => row['% Independent Directors']),
            suffix: "%",
            color: "#2ecc71"
        },
        {
            label: `${avgPrefix}Board Meetings`,
            values: filteredData.map(row => row['No of Board Meeting']),
            suffix: "",
            color: "#f39c12"
        },
        {
            label: `${avgPrefix}Audit Members`,
            values: filteredData.map(row => row['Number of Audit Committee']),
            suffix: "",
            color: "#9b59b6"
        }
    ];
    
    const metricsContainer = document.getElementById('metrics-cards');
    metricsContainer.innerHTML = '';
    
    metrics.forEach(({ label, values, suffix, color }) => {
        const value = getMetricValue(values);
        
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.style.border = `2px solid ${color}`;
        
        card.innerHTML = `
            <h2 class="metric-value" style="color: ${color}; font-size: 20px; margin: 0;">${value}${suffix}</h2>
            <p class="metric-label">${label}</p>
        `;
        
        metricsContainer.appendChild(card);
    });
}

function updateInsights() {
    const femaleBenchmark = 30;
    const indepBenchmark = 33.3;
    const auditBenchmark = 1;
    
    const filteredData = filterData(selectedCompanies, yearRange[0], yearRange[1]);
    
    // Get latest data for each company
    const latestData = [];
    selectedCompanies.forEach(company => {
        const companyData = filteredData
            .filter(row => row['COMPANY NAME'] === company)
            .sort((a, b) => b['YEAR'] - a['YEAR']);
        
        if (companyData.length > 0) {
            latestData.push(companyData[0]);
        }
    });
    
    const insightsContainer = document.getElementById('insights-content');
    insightsContainer.innerHTML = '';
    
    // Add benchmark info
    const benchmarkInfo = document.createElement('div');
    benchmarkInfo.className = 'insights-benchmark';
    benchmarkInfo.innerHTML = `✅ Benchmark Criteria (Based on MCCG): Female Directors ≥ ${femaleBenchmark}% • Independent Directors ≥ ${indepBenchmark}% • Audit Committee ≥ ${auditBenchmark}`;
    insightsContainer.appendChild(benchmarkInfo);
    
    // Create horizontal container for insight cards
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'insights-cards-container';
    insightsContainer.appendChild(cardsContainer);
    
    latestData.forEach(row => {
        const femaleCheck = row['% Female Directors'] >= femaleBenchmark ? "✅" : "❌";
        const indepCheck = row['% Independent Directors'] >= indepBenchmark ? "✅" : "❌";
        const auditCheck = row['Number of Audit Committee'] >= auditBenchmark ? "✅" : "❌";
        
        const checks = [
            row['% Female Directors'] >= femaleBenchmark,
            row['% Independent Directors'] >= indepBenchmark,
            row['Number of Audit Committee'] >= auditBenchmark
        ];
        
        let strength, cardClass;
        if (checks.every(check => check)) {
            strength = "🥇 Strong";
            cardClass = "insight-strong";
        } else if (checks.filter(check => check).length >= 2) {
            strength = "⚠️ Moderate";
            cardClass = "insight-moderate";
        } else {
            strength = "❌ Weak";
            cardClass = "insight-weak";
        }
        
        const displayName = truncateText(row['COMPANY NAME'], 30);
        
        const card = document.createElement('div');
        card.className = `insight-card ${cardClass}`;
        
        card.innerHTML = `
            <h4>🔹 ${displayName} (${row['YEAR']})</h4>
            <div class="insight-item">
                <span>Female: ${row['% Female Directors'].toFixed(1)}% ${femaleCheck}</span>
            </div>
            <div class="insight-item">
                <span>Independent: ${row['% Independent Directors'].toFixed(1)}% ${indepCheck}</span>
            </div>
            <div class="insight-item">
                <span>Audit: ${row['Number of Audit Committee']} ${auditCheck}</span>
            </div>
            <div class="insight-status">
                <strong>Status: ${strength}</strong>
            </div>
        `;
        
        cardsContainer.appendChild(card);
    });
}

// ==================== EMPTY DASHBOARD ====================
function showEmptyDashboard() {
    document.getElementById('gender-chart').innerHTML = '<div style="text-align: center; padding: 50px; color: #666; font-size: 16px;">Select companies to view charts</div>';
    document.getElementById('independence-chart').innerHTML = '<div style="text-align: center; padding: 50px; color: #666; font-size: 16px;">Select companies to view charts</div>';
    document.getElementById('meetings-chart').innerHTML = '<div style="text-align: center; padding: 50px; color: #666; font-size: 16px;">Select companies to view charts</div>';
    document.getElementById('audit-chart').innerHTML = '<div style="text-align: center; padding: 50px; color: #666; font-size: 16px;">Select companies to view charts</div>';
    document.getElementById('metrics-cards').innerHTML = '<div style="text-align: center; padding: 20px; color: #666; width: 100%; font-size: 16px;">Select a company to view metrics</div>';
    document.getElementById('insights-content').innerHTML = '<div style="text-align: center; padding: 20px; color: #666; font-size: 16px;">Select companies to view insights</div>';
}

// ==================== CLEAR CHART CONTAINERS ====================
function clearChartContainers() {
    document.getElementById('gender-chart').innerHTML = '';
    document.getElementById('independence-chart').innerHTML = '';
    document.getElementById('meetings-chart').innerHTML = '';
    document.getElementById('audit-chart').innerHTML = '';
}

// ==================== UPDATE DASHBOARD ====================
function updateDashboard() {
    if (selectedCompanies.length === 0) {
        showEmptyDashboard();
        return;
    }
    
    // Clear old content before creating new charts
    clearChartContainers();
    
    const filteredData = filterData(selectedCompanies, yearRange[0], yearRange[1]);
    
    console.log('Updating dashboard with filtered data:', filteredData);
    
    updateMetricsCards();
    createGenderChart(filteredData);
    createIndependenceChart(filteredData);
    createMeetingsChart(filteredData);
    createAuditChart(filteredData);
    updateInsights();
}

function updateYearRangeDisplay() {
    const minVal = parseInt(document.getElementById('year-min').value);
    const maxVal = parseInt(document.getElementById('year-max').value);
    
    // Update year displays
    document.getElementById('year-min-display').textContent = minVal;
    document.getElementById('year-max-display').textContent = maxVal;
    
    // Update the connecting line between sliders
    updateSliderRange(minVal, maxVal);
}

function updateSliderRange(minVal, maxVal) {
    const container = document.querySelector('.range-slider-container');
    
    const minPercent = ((minVal - minYear) / (maxYear - minYear)) * 100;
    const maxPercent = ((maxVal - minYear) / (maxYear - minYear)) * 100;
    
    // Update CSS custom properties for the active range
    container.style.setProperty('--min-percent', minPercent + '%');
    container.style.setProperty('--max-percent', maxPercent + '%');
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Bulk action buttons
    document.getElementById('select-all-btn').addEventListener('click', selectAllCompanies);
    document.getElementById('clear-all-btn').addEventListener('click', clearAllCompanies);
    
    // Metrics company dropdown
    const metricsDropdown = document.getElementById('metrics-company-dropdown');
    metricsDropdown.addEventListener('change', function() {
        metricsCompany = this.value;
        updateDashboard();
    });
    
    // Download buttons
    document.getElementById('download-dashboard-btn').addEventListener('click', downloadDashboard);
    document.getElementById('download-csv-btn').addEventListener('click', downloadCSV);
    
    // Modal close when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('chart-modal');
        if (event.target === modal) {
            closeChartModal();
        }
    });
    
    // Year range sliders
    const yearMinSlider = document.getElementById('year-min');
    const yearMaxSlider = document.getElementById('year-max');
    
    function updateYearRange() {
        const minVal = parseInt(yearMinSlider.value);
        const maxVal = parseInt(yearMaxSlider.value);
        
        // Ensure min is not greater than max
        if (minVal > maxVal) {
            if (this === yearMinSlider) {
                yearMaxSlider.value = minVal;
            } else {
                yearMinSlider.value = maxVal;
            }
        }
        
        yearRange = [parseInt(yearMinSlider.value), parseInt(yearMaxSlider.value)];
        
        // Update displays and visual range
        updateYearRangeDisplay();
        updateSelectedYearDisplay();
        
        // Update dashboard if companies are selected
        if (selectedCompanies.length > 0) {
            updateDashboard();
        }
    }
    
    yearMinSlider.addEventListener('input', updateYearRange);
    yearMaxSlider.addEventListener('input', updateYearRange);
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting initialization...');
    
    // Check if data is loaded
    if (typeof data === 'undefined') {
        console.error('Data not loaded! Make sure data.js is included before javascript.js');
        return;
    }
    
    // Process the raw data
    processData();
    
    // Initialize data-driven variables
    initializeDataDrivenVariables();
    
    // Populate filters based on data
    populateFilters();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update dashboard with initial data
    updateDashboard();
    
    // Make plots responsive
    window.addEventListener('resize', function() {
        if (selectedCompanies.length > 0) {
            Plotly.Plots.resize('gender-chart');
            Plotly.Plots.resize('independence-chart');
            Plotly.Plots.resize('meetings-chart');
            Plotly.Plots.resize('audit-chart');
        }
    });
    
    console.log('Dashboard initialization complete!');
});

}