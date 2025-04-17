// First, add a simple function at the top of our script section to detect dark mode
let forceDarkMode = false;

// This function will be called immediately and again when creating visualizations
function detectDarkMode() {
    // Simplest check - look for the switch button text
    const allButtons = document.querySelectorAll('a, button');
    for (let i = 0; i < allButtons.length; i++) {
        if (allButtons[i].textContent.includes('Switch to Light Mode')) {
            console.log("Detected dark mode from button text");
            forceDarkMode = true;
            return true;
        }
    }
    
    // If no button found, check for dark classes or attributes
    if (document.documentElement.getAttribute('data-bs-theme') === 'dark' || 
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.body.classList.contains('dark-mode')) {
        console.log("Detected dark mode from attributes/classes");
        forceDarkMode = true;
        return true;
    }
    
    // Check if the page background is dark (another hint we're in dark mode)
    const bodyBgColor = window.getComputedStyle(document.body).backgroundColor;
    if (bodyBgColor && (
        bodyBgColor.includes('rgb(18, 18, 18)') || 
        bodyBgColor.includes('rgb(33, 37, 41)') || 
        bodyBgColor.includes('rgb(13, 17, 23)'))) {
        console.log("Detected dark mode from body background color");
        forceDarkMode = true;
        return true;
    }
    
    // Default to light mode
    forceDarkMode = false;
    return false;
}

// Run theme detection immediately
detectDarkMode();

// Set initial background colors right away
(function setInitialBackgroundColor() {
    const isDark = forceDarkMode;
    console.log("Setting initial background color, dark mode:", isDark);
    
    // Apply to map container if it exists
    const container = document.querySelector('.map-container');
    if (container) {
        container.style.backgroundColor = isDark ? '#121212' : 'white';
        container.style.borderColor = isDark ? '#333' : '#ddd';
    }
    
    // Apply to SVG if it exists
    const svg = document.getElementById('bubbleMap');
    if (svg) {
        svg.style.backgroundColor = isDark ? '#121212' : 'white';
        svg.setAttribute('fill', isDark ? '#121212' : 'white');
    }
    
    // Also set a flag for later visualization creation
    window.initialBackgroundSet = true;
})();

// Also add this to the DOMContentLoaded event to ensure backgrounds are set even before D3 loads
document.addEventListener('DOMContentLoaded', function() {
    // Check dark mode on page load again
    detectDarkMode();
    console.log("Initial dark mode detection in DOMContentLoaded:", forceDarkMode);
    
    // Force background colors
    const isDark = forceDarkMode;
    const container = document.querySelector('.map-container');
    if (container) {
        container.style.backgroundColor = isDark ? '#121212' : 'white';
        container.style.borderColor = isDark ? '#333' : '#ddd';
    }
    
    const svg = document.getElementById('bubbleMap');
    if (svg) {
        svg.style.backgroundColor = isDark ? '#121212' : 'white';
        svg.setAttribute('fill', isDark ? '#121212' : 'white');
    }
    
    // Add direct style to force background
    const style = document.createElement('style');
    style.textContent = isDark ? 
        '#bubbleMap, .map-container { background-color: #121212 !important; }' :
        '#bubbleMap, .map-container { background-color: white !important; }';
    document.head.appendChild(style);
    
    // Make sure D3 is loaded before proceeding with the rest
    // ...continue with existing code
});

// Store all drugs data for easier reference
let allDrugs = [];

// Function to ensure D3.js is loaded
function ensureD3Loaded(callback) {
    // Check if D3 is already loaded
    if (typeof d3 !== 'undefined') {
        // Force the theme to apply before proceeding
        applyCurrentTheme();
        callback();
        return;
    }
    
    // If not, set up an interval to check again
    console.log("Waiting for D3.js to load...");
    let checkCount = 0;
    const checkInterval = setInterval(function() {
        checkCount++;
        if (typeof d3 !== 'undefined') {
            clearInterval(checkInterval);
            // Force the theme to apply before proceeding
            applyCurrentTheme();
            callback();
        } else if (checkCount > 20) { // Give up after about 10 seconds
            clearInterval(checkInterval);
            document.getElementById('emptyState').innerHTML = '<h3>Error Loading Visualization</h3><p>Required library could not be loaded. Please check your network connection and reload the page.</p>';
            console.error("Failed to load D3.js after multiple attempts");
        }
    }, 500);
}

// Add caching to speed up data loading
let cachedInteractionData = {};
let cachedNodeData = {};
let lastUsedDrugId = null;

// Optimize data loading with caching
function updateInteractionMap() {
    const drugId = document.getElementById('drugSelect').value;
    
    // Check if we're requesting the same data we already have
    if (drugId === lastUsedDrugId && cachedNodeData[drugId]) {
        console.log("Using cached data for drug ID:", drugId);
        // Just update colors without reloading data
        updateVisualizationColors();
        return;
    }
    
    lastUsedDrugId = drugId;
    
    if (!drugId) {
        // This is the "Overview" option - load the full relationship graph
        if (Object.keys(cachedInteractionData).length > 0) {
            console.log("Using cached data for full relationship graph");
            generateNetworkGraph(cachedInteractionData);
        } else {
        loadFullRelationshipGraph();
        }
        return;
    }
    
    // Show loading state
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p>Loading interaction data...</p>';
        emptyState.style.display = 'block';
    }
    
    const bubbleMap = document.getElementById('bubbleMap');
    if (bubbleMap) bubbleMap.style.display = 'none';
    
    // Check if we have cached data for this drug
    if (cachedNodeData[drugId]) {
        console.log("Using cached node data for drug ID:", drugId);
        createBubbleMap(drugId, cachedNodeData[drugId].interactionIds);
        return;
    }
    
    // Ensure D3 is loaded before proceeding
    ensureD3Loaded(function() {
        // Fetch drug interactions
        fetch(`/api/drugs/${drugId}/interactions`)
            .then(response => response.json())
            .then(interactionIds => {
                // Cache the data
                cachedNodeData[drugId] = {
                    interactionIds: interactionIds,
                    timestamp: Date.now()
                };
                
                // If no interactions
                if (interactionIds.length === 0) {
                    const emptyState = document.getElementById('emptyState');
                    const bubbleMap = document.getElementById('bubbleMap');
                    const mapLegend = document.getElementById('mapLegend');
                    
                    if (emptyState) {
                        emptyState.innerHTML = '<h3>No Interactions Found</h3><p>This drug has no recorded interactions.</p>';
                        emptyState.style.display = 'block';
                    }
                    if (bubbleMap) bubbleMap.style.display = 'none';
                    if (mapLegend && mapLegend.style) mapLegend.style.display = 'none';
                    return;
                }
                
                // Create interaction data structure for visualization
                createBubbleMap(drugId, interactionIds);
            })
            .catch(error => {
                console.error("Error fetching drug interactions:", error);
                const emptyState = document.getElementById('emptyState');
                const bubbleMap = document.getElementById('bubbleMap');
                const mapLegend = document.getElementById('mapLegend');
                
                if (emptyState) {
                    emptyState.innerHTML = '<h3>Error Loading Data</h3><p>An error occurred while loading interaction data.</p>';
                    emptyState.style.display = 'block';
                }
                if (bubbleMap) bubbleMap.style.display = 'none';
                if (mapLegend && mapLegend.style) mapLegend.style.display = 'none';
            });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // First, explicitly set the theme based on the toggle button text
    initializeTheme();
    
    // Make sure D3 is loaded before proceeding
    ensureD3Loaded(function() {
        console.log("D3.js is loaded and ready");
        
        // Store all drugs from Thymeleaf model
        const drugsSelect = document.getElementById('drugSelect');
        if (drugsSelect) {
            // Add change event listener
            drugsSelect.addEventListener('change', function() {
                if (typeof updateInteractionMap === 'function') {
                    updateInteractionMap();
                } else {
                    console.error("updateInteractionMap function is not defined");
                }
            });
            
            for (let i = 0; i < drugsSelect.options.length; i++) {
                if (drugsSelect.options[i].value) {
                    allDrugs.push({
                        id: drugsSelect.options[i].value,
                        name: drugsSelect.options[i].text
                    });
                }
            }
            console.log("Loaded " + allDrugs.length + " drugs");
            
            // Instead of showing empty state, load the full relationship graph
            loadFullRelationshipGraph();
        } else {
            console.error("Drug select element not found");
        }
        
        // Set up theme detection
        setupThemeDetection();
    });
});

function createBubbleMap(drugId, interactionIds) {
    // Ensure D3 is loaded
    if (typeof d3 === 'undefined') {
        console.error("D3 is not defined. Cannot create visualization.");
        const emptyState = document.getElementById('emptyState');
        const bubbleMap = document.getElementById('bubbleMap');
        const mapLegend = document.getElementById('mapLegend');
        
        if (emptyState) {
            emptyState.innerHTML = '<h3>Visualization Error</h3><p>Required library is not available. Please try refreshing the page.</p>';
            emptyState.style.display = 'block';
        }
        if (bubbleMap) bubbleMap.style.display = 'none';
        if (mapLegend && mapLegend.style) mapLegend.style.display = 'none';
        return;
    }
    
    try {
        // Clear previous visualization
        d3.select("#bubbleMap").html("");
        
        // Find main drug details
        const mainDrug = allDrugs.find(drug => drug.id === drugId);
        if (!mainDrug) {
            console.error("Main drug not found in dataset");
            const emptyState = document.getElementById('emptyState');
            const bubbleMap = document.getElementById('bubbleMap');
            const mapLegend = document.getElementById('mapLegend');
            
            if (emptyState) {
                emptyState.innerHTML = '<h3>Data Error</h3><p>Selected drug information could not be found.</p>';
                emptyState.style.display = 'block';
            }
            if (bubbleMap) bubbleMap.style.display = 'none';
            if (mapLegend && mapLegend.style) mapLegend.style.display = 'none';
            return;
        }
        
        // Create data structure for bubble map
        const nodes = [];
        const links = [];
        
        // Add main drug node
        nodes.push({
            id: mainDrug.id,
            name: mainDrug.name,
            group: "main",
            value: 70  // Increased size of the main bubble
        });
        
        // Add interaction drug nodes and links
        interactionIds.forEach((interactionId, index) => {
            const interactingDrug = allDrugs.find(drug => drug.id === interactionId);
            if (!interactingDrug) return;
            
            nodes.push({
                id: interactingDrug.id,
                name: interactingDrug.name,
                value: 45  // Increased size of interaction bubbles
            });
            
            links.push({
                source: mainDrug.id,
                target: interactingDrug.id,
                value: 1
            });
        });
        
        // First show the SVG and hide the empty state
        const emptyState = document.getElementById('emptyState');
        const bubbleMap = document.getElementById('bubbleMap');
        const mapLegend = document.getElementById('mapLegend');
        
        // Safely update DOM elements if they exist
        if (emptyState) emptyState.style.display = 'none';
        if (bubbleMap) bubbleMap.style.display = 'block';
        if (mapLegend && mapLegend.style) mapLegend.style.display = 'block';
        
        // Now create the bubble map visualization
        createForceGraph(nodes, links);
    } catch (error) {
        console.error("Error creating bubble map:", error);
        const emptyState = document.getElementById('emptyState');
        const bubbleMap = document.getElementById('bubbleMap');
        const mapLegend = document.getElementById('mapLegend');
        
        // Safely update DOM elements if they exist
        if (emptyState) {
            emptyState.innerHTML = '<h3>Visualization Error</h3><p>An error occurred while creating the visualization: ' + error.message + '</p>';
            emptyState.style.display = 'block';
        }
        if (bubbleMap) bubbleMap.style.display = 'none';
        if (mapLegend && mapLegend.style) mapLegend.style.display = 'none';
    }
}

// Modify the document ready handler to check again
document.addEventListener('DOMContentLoaded', function() {
    // Check dark mode on page load
    detectDarkMode();
    console.log("Initial dark mode detection:", forceDarkMode);
    
    // Make sure D3 is loaded before proceeding
    ensureD3Loaded(function() {
        console.log("D3.js is loaded and ready");
        
        // Store all drugs from Thymeleaf model
        const drugsSelect = document.getElementById('drugSelect');
        if (drugsSelect) {
            // Add change event listener
            drugsSelect.addEventListener('change', function() {
                if (typeof updateInteractionMap === 'function') {
                    updateInteractionMap();
                } else {
                    console.error("updateInteractionMap function is not defined");
                }
            });
            
            for (let i = 0; i < drugsSelect.options.length; i++) {
                if (drugsSelect.options[i].value) {
                    allDrugs.push({
                        id: drugsSelect.options[i].value,
                        name: drugsSelect.options[i].text
                    });
                }
            }
            console.log("Loaded " + allDrugs.length + " drugs");
            
            // Instead of showing empty state, load the full relationship graph
            loadFullRelationshipGraph();
        } else {
            console.error("Drug select element not found");
        }
        
        // Add event listeners to detect theme changes
        document.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('click', function() {
                if (el.textContent.includes('Switch to Dark Mode') || 
                    el.textContent.includes('Switch to Light Mode')) {
                    console.log("Theme button clicked:", el.textContent);
                    
                    // Toggle the mode without delay
                    forceDarkMode = !forceDarkMode;
                    console.log("Force dark mode toggled to:", forceDarkMode);
                    
                    // Apply colors directly to existing elements
                    applyColorsDirectly(forceDarkMode);
                }
            });
        });
    });
});

// Modify createForceGraph to use hardcoded colors based on forceDarkMode
function createForceGraph(nodes, links) {
    try {
        if (typeof d3 === 'undefined') {
            throw new Error("D3 library is not available");
        }
        
        // Check dark mode again
        detectDarkMode();
        console.log("Creating force graph with forced dark mode:", forceDarkMode);
        
        // Get SVG element
        const svgElement = document.getElementById('bubbleMap');
        if (svgElement) {
            // Set the background color for the SVG 
            const bgColor = forceDarkMode ? '#121212' : 'white';
            
            // Direct application of background color
            svgElement.style.backgroundColor = bgColor;
            svgElement.setAttribute('fill', bgColor);
        } else {
            console.error("SVG element not found");
            return;
        }
        
        // Use D3 to select the SVG
        const svg = d3.select("#bubbleMap");
        if (!svg.node()) {
            throw new Error("SVG element not found");
        }
        
        // Get dimensions from the SVG element or fallback to parent container 
        let width, height;
        
        // Try to get dimensions from the container
        const container = document.querySelector(".map-container");
        if (container) {
            width = container.clientWidth || 800;
            height = container.clientHeight || 600;
            
            // Also set the container background in dark mode
            if (forceDarkMode) {
                container.style.backgroundColor = '#121212';
                container.style.borderColor = '#333';
            }
        } else {
            // Fallback to default dimensions
            width = window.innerWidth - 40 || 800;
            height = window.innerHeight - 200 || 600;
        }
        
        // Set dimensions explicitly on the SVG
        svg.attr("width", width)
           .attr("height", height)
           .attr("viewBox", `0 0 ${width} ${height}`)
           .attr("preserveAspectRatio", "xMidYMid meet");
        
        // Clear existing content
        svg.selectAll("*").remove();
        
        // Add a background rectangle that covers the entire SVG area
        const bgColor = forceDarkMode ? '#121212' : 'white';
        svg.append("rect")
           .attr("class", "svg-background")
           .attr("x", 0)
           .attr("y", 0)
           .attr("width", width)
           .attr("height", height)
           .attr("fill", bgColor);
        
        // Multiple ways to set the background
        svg.style("background-color", bgColor);
        
        // Create a force simulation for the graph
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(d => 180))
            .force("charge", d3.forceManyBody().strength(d => -350 - (d.value * 3)))
            .force("center", d3.forceCenter(width / 2, height / 2).strength(0.08))
            .force("collision", d3.forceCollide().radius(d => Math.sqrt(d.value) * 2.5 + 10))
            .force("x", d3.forceX(width / 2).strength(0.05))
            .force("y", d3.forceY(height / 2).strength(0.05));
        
        // Create links with forced dark mode colors
        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .attr("stroke", forceDarkMode ? "#444444" : "#cccccc")
            .attr("stroke-width", 3);
        
        // Create node groups
        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
        
        // Add circles to nodes with hardcoded colors for each mode
        node.append("circle")
            .attr("r", d => Math.sqrt(d.value) * 2)
            .attr("class", d => "category-" + (d.group || "unknown"))
            .attr("fill", d => {
                const group = d.group || "unknown";
                
                if (forceDarkMode) {
                    // Dark mode colors
                    if (group === "main") return "#8021B0";
                    if (group === "high") return "#c13c38";
                    if (group === "medium") return "#e09c40";
                    if (group === "low") return "#49a2bc";
                    return "#666666"; // unknown
                } else {
                    // Light mode colors
                    if (group === "main") return "#9932CC";
                    if (group === "high") return "#d9534f";
                    if (group === "medium") return "#f0ad4e";
                    if (group === "low") return "#5bc0de";
                    return "#777777"; // unknown
                }
            })
            .attr("stroke", forceDarkMode ? "#555555" : "#888888");
        
        // Add text labels
        node.append("text")
            .text(d => d.name)
            .attr("dy", d => Math.sqrt(d.value) * 2 + 18)
            .attr("font-size", d => {
                return Math.min(2.5 * Math.sqrt(d.value), 16) + "px";
            })
            .attr("fill", forceDarkMode ? "#f0f0f0" : "white")
            .each(function(d) {
                // Add background rectangle for better text readability
                const textElement = d3.select(this);
                const textBBox = this.getBBox();
                
                const padding = 3;
                d3.select(this.parentNode)
                    .insert("rect", "text")
                    .attr("x", textBBox.x - padding)
                    .attr("y", textBBox.y - padding)
                    .attr("width", textBBox.width + (padding * 2))
                    .attr("height", textBBox.height + (padding * 2))
                    .attr("rx", 3)
                    .attr("ry", 3)
                    .attr("fill", forceDarkMode ? "rgba(20, 20, 20, 0.9)" : "rgba(0, 0, 0, 0.7)")
                    .attr("class", "node-label-bg");
            });
        
        // Update node and link positions on each tick of the simulation
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            
            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });
        
        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    } catch (error) {
        console.error("Error creating force graph:", error);
        document.getElementById('emptyState').innerHTML = '<h3>Visualization Error</h3><p>An error occurred while rendering the graph: ' + error.message + '</p>';
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('bubbleMap').style.display = 'none';
    }
}

// Make similar changes to createNetworkGraph using the same approach
function createNetworkGraph(nodes, links) {
    try {
        if (typeof d3 === 'undefined') {
            throw new Error("D3 library is not available");
        }
        
        // Check dark mode again
        detectDarkMode();
        console.log("Creating network graph with forced dark mode:", forceDarkMode);
        
        // Get SVG element
        const svgElement = document.getElementById('bubbleMap');
        if (svgElement) {
            // Set the background color for the SVG
            const bgColor = forceDarkMode ? '#121212' : 'white';
            
            // Direct application of background color
            svgElement.style.backgroundColor = bgColor;
            svgElement.setAttribute('fill', bgColor);
        } else {
            console.error("SVG element not found");
            return;
        }
        
        // Use D3 to select the SVG
        const svg = d3.select("#bubbleMap");
        if (!svg.node()) {
            throw new Error("SVG element not found");
        }
        
        // Variables for dimensions
        let width, height;
        
        // Try to get dimensions from the container
        const container = document.querySelector(".map-container");
        if (container) {
            width = container.clientWidth || 800;
            height = container.clientHeight || 600;
            
            // Also set the container background in dark mode
            if (forceDarkMode) {
                container.style.backgroundColor = '#121212';
                container.style.borderColor = '#333';
            }
        } else {
            // Fallback to default dimensions
            width = window.innerWidth - 40 || 800;
            height = window.innerHeight - 200 || 600;
        }
        
        // Set dimensions explicitly on the SVG
        svg.attr("width", width)
           .attr("height", height)
           .attr("viewBox", `0 0 ${width} ${height}`)
           .attr("preserveAspectRatio", "xMidYMid meet");
        
        // Clear existing content
        svg.selectAll("*").remove();
        
        // Add a background rectangle that covers the entire SVG area
        const bgColor = forceDarkMode ? '#121212' : 'white';
        svg.append("rect")
           .attr("class", "svg-background")
           .attr("x", 0)
           .attr("y", 0)
           .attr("width", width)
           .attr("height", height)
           .attr("fill", bgColor);
         
        // Multiple ways to set the background
        svg.style("background-color", bgColor);
        
        // Force simulation for the graph with hardcoded colors
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(d => 180))
            .force("charge", d3.forceManyBody().strength(d => -350 - (d.value * 3)))
            .force("center", d3.forceCenter(width / 2, height / 2).strength(0.08))
            .force("collision", d3.forceCollide().radius(d => Math.sqrt(d.value) * 2.5 + 10))
            .force("x", d3.forceX(width / 2).strength(0.05))
            .force("y", d3.forceY(height / 2).strength(0.05));
        
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", function(event) {
                g.attr("transform", event.transform);
            });
        
        svg.call(zoom);
        
        // Create a container for all our elements
        const g = svg.append("g");
        
        // Create links with forced dark mode colors
        const link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .attr("stroke", forceDarkMode ? "#444444" : "#cccccc")
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", forceDarkMode ? 0.6 : 0.4);
        
        // Create node groups
        const node = g.append("g")
            .attr("class", "nodes")
            .selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
        
        // Add circles to nodes with hardcoded colors for each mode
        node.append("circle")
            .attr("r", d => Math.sqrt(d.value) * 1.5)
            .attr("class", d => {
                const group = d.group || "unknown";
                if (group === "high") return "category-high";
                if (group === "medium") return "category-medium";
                if (group === "low") return "category-low"; 
                if (group === "main") return "category-main";
                return "category-unknown";
            })
            .attr("fill", d => {
                const group = d.group || "unknown";
                
                if (forceDarkMode) {
                    // Dark mode colors
                    if (group === "high") return "#c13c38";
                    if (group === "medium") return "#e09c40";
                    if (group === "low") return "#49a2bc";
                    if (group === "main") return "#8021B0";
                    return "#666666"; // unknown
                } else {
                    // Light mode colors
                    if (group === "high") return "#d9534f";
                    if (group === "medium") return "#f0ad4e";
                    if (group === "low") return "#5bc0de";
                    if (group === "main") return "#9932CC";
                    return "#777777"; // unknown
                }
            })
            .attr("stroke", forceDarkMode ? "#555555" : "#888888");
        
        // Add text labels
        node.append("text")
            .text(d => d.name)
            .attr("dy", d => Math.sqrt(d.value) * 1.5 + 15)
            .attr("font-size", d => {
                return Math.min(2.2 * Math.sqrt(d.value / 2), 14) + "px";
            })
            .attr("fill", forceDarkMode ? "#f0f0f0" : "white")
            .each(function(d) {
                // Add background rectangle for better text readability
                const textElement = d3.select(this);
                const textBBox = this.getBBox();
                
                const padding = 3;
                d3.select(this.parentNode)
                    .insert("rect", "text")
                    .attr("x", textBBox.x - padding)
                    .attr("y", textBBox.y - padding)
                    .attr("width", textBBox.width + (padding * 2))
                    .attr("height", textBBox.height + (padding * 2))
                    .attr("rx", 3)
                    .attr("ry", 3)
                    .attr("fill", forceDarkMode ? "rgba(20, 20, 20, 0.9)" : "rgba(0, 0, 0, 0.7)")
                    .attr("class", "node-label-bg");
            });
        
        // Update node and link positions on each tick of the simulation
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            
            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });
        
        // Apply initial positioning algorithm to prevent chaos
        // For large graphs, run some simulation steps before rendering
        for (let i = 0; i < 20; ++i) simulation.tick();
        
        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    } catch (error) {
        console.error("Error creating network graph:", error);
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.innerHTML = '<h3>Visualization Error</h3><p>An error occurred while creating the network visualization: ' + error.message + '</p>';
            emptyState.style.display = 'block';
        }
    }
}

// Optimize loadFullRelationshipGraph with caching
function loadFullRelationshipGraph() {
    console.log("Loading full relationship graph");
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p>Generating drug interaction network...</p>';
        emptyState.style.display = 'block';
    }
    
    // If we have no drugs, can't proceed
    if (allDrugs.length === 0) {
        if (emptyState) {
            emptyState.innerHTML = '<h3>No Data Available</h3><p>No drug data is available to visualize.</p>';
        }
        return;
    }
    
    // Safely check cached data
    const cacheAge = !cachedInteractionData || !cachedInteractionData.timestamp ? Infinity : 
                    (Date.now() - cachedInteractionData.timestamp);
    
    // If we have cached interaction data and it's less than 5 minutes old
    if (cachedInteractionData && 
        typeof cachedInteractionData === 'object' && 
        Object.keys(cachedInteractionData).length > 1 && // More than just timestamp
        cacheAge < 300000) {
        console.log("Using cached interaction data, age:", Math.round(cacheAge/1000), "seconds");
        generateNetworkGraph(cachedInteractionData);
        return;
    }
    
    // Create a queue to fetch all drug interactions
    let interactionData = {};
    let processedCount = 0;
    
    // Track cache timestamp
    interactionData.timestamp = Date.now();
    
    // First create placeholders for each drug
    allDrugs.forEach(drug => {
        if (drug && drug.id) {
            interactionData[drug.id] = {
                id: drug.id,
                name: drug.name || `Drug ${drug.id}`,
                interactions: []
            };
        }
    });
    
    // Get valid drug list (drugs that actually have IDs)
    const validDrugs = allDrugs.filter(drug => drug && drug.id);
    
    // Process each drug and get its interactions
    function processNextDrug(index) {
        if (index >= validDrugs.length) {
            // All drugs processed, generate the graph
            cachedInteractionData = interactionData; // Cache the data
            generateNetworkGraph(interactionData);
            return;
        }
        
        const drug = validDrugs[index];
        
        // Fetch interactions for this drug
        fetch(`/api/drugs/${drug.id}/interactions`)
            .then(response => response.json())
            .then(interactionIds => {
                // Store the interactions (ensure it's an array)
                interactionData[drug.id].interactions = Array.isArray(interactionIds) ? interactionIds : [];
                processedCount++;
                
                // Update progress
                if (emptyState) {
                    const progress = Math.floor((processedCount / validDrugs.length) * 100);
                    emptyState.innerHTML = `<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p>Generating drug interaction network... ${progress}%</p>`;
                }
                
                // Process next drug
                processNextDrug(index + 1);
            })
            .catch(error => {
                console.error(`Error fetching interactions for drug ${drug.name}:`, error);
                // Mark as processed even on error
                processedCount++;
                
                // Initialize with empty array to avoid undefined errors
                if (interactionData[drug.id]) {
                    interactionData[drug.id].interactions = [];
                }
                
                // Continue with next drug despite error
                processNextDrug(index + 1);
            });
    }
    
    // Start processing drugs
    processNextDrug(0);
}

// Function to generate the network graph from the full interaction data
function generateNetworkGraph(interactionData) {
    try {
        console.log("Generating network graph with", Object.keys(interactionData).length, "drugs");
        
        // Create graph data structure
        const nodes = [];
        const links = [];
        const nodeMap = new Map(); // For quick node lookup
        
        // Safely get drugs from the interaction data (excluding timestamp)
        const drugKeys = Object.keys(interactionData).filter(key => key !== 'timestamp');
        console.log("Drug keys:", drugKeys.length);
        
        // Add each drug as a node
        drugKeys.forEach(drugId => {
            const drug = interactionData[drugId];
            // Skip if drug data is invalid
            if (!drug || typeof drug !== 'object') {
                console.warn("Invalid drug data for ID:", drugId);
                return;
            }
            
            // Ensure interactions array exists
            const interactions = Array.isArray(drug.interactions) ? drug.interactions : [];
            
            // Count number of interactions for sizing the node
            const interactionCount = interactions.length;
            
            // Add node with properties
            nodes.push({
                id: drug.id || drugId,
                name: drug.name || `Drug ${drugId}`,
                value: 20 + (interactionCount * 5), // Base size + scaling based on interactions
                interactionCount: interactionCount,
                group: getNodeGroup(interactionCount) // Categorize node based on interaction count
            });
            
            // Add to nodeMap for quick lookup
            nodeMap.set(drug.id || drugId, nodes.length - 1);
        });
        
        // Add interaction links (avoid duplicates)
        const linkSet = new Set(); // Track added links to avoid duplicates
        
        // Safely iterate over drugs
        drugKeys.forEach(drugId => {
            const drug = interactionData[drugId];
            // Skip if drug data is invalid
            if (!drug || typeof drug !== 'object') {
                return;
            }
            
            // Ensure interactions is an array
            const interactions = Array.isArray(drug.interactions) ? drug.interactions : [];
            
            // Process each interaction
            interactions.forEach(targetId => {
                // Skip if targetId is invalid
                if (!targetId) {
                    return;
                }
                
                // Create a unique identifier for this link (using sorted IDs to catch both directions)
                const linkKey = [drugId, targetId].sort().join('-');
                
                // Only add if not already added and both drugs exist in our dataset
                if (!linkSet.has(linkKey) && nodeMap.has(targetId)) {
                    links.push({
                        source: drugId,
                        target: targetId,
                        value: 1
                    });
                    
                    linkSet.add(linkKey);
                }
            });
        });
        
        // Check if we have data to visualize
        if (nodes.length === 0) {
            console.warn("No valid nodes found for visualization");
            const emptyState = document.getElementById('emptyState');
            if (emptyState) {
                emptyState.innerHTML = '<h3>No Data to Visualize</h3><p>No valid drug interaction data was found.</p>';
                emptyState.style.display = 'block';
            }
            return;
        }
        
        // Create visualization
        const emptyState = document.getElementById('emptyState');
        const bubbleMap = document.getElementById('bubbleMap');
        const mapLegend = document.getElementById('mapLegend');
        
        // Safely update DOM elements if they exist
        if (emptyState) emptyState.style.display = 'none';
        if (bubbleMap) bubbleMap.style.display = 'block';
        if (mapLegend && mapLegend.style) mapLegend.style.display = 'block';
        
        // Create network visualization
        createNetworkGraph(nodes, links);
        
    } catch (error) {
        console.error("Error generating network graph:", error);
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.innerHTML = '<h3>Visualization Error</h3><p>An error occurred while creating the network visualization: ' + error.message + '</p>';
            emptyState.style.display = 'block';
        }
        
        // Clear any cached data that might be corrupted
        cachedInteractionData = {};
    }
}

// Helper function to categorize nodes based on interaction count
function getNodeGroup(interactionCount) {
    if (interactionCount === 0) return "none";
    if (interactionCount <= 2) return "low";
    if (interactionCount <= 5) return "medium";
    return "high";
}

// Add a debounce function to prevent excessive refreshes
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Keep track of the last refresh time
let lastRefreshTime = 0;
let refreshInProgress = false;

// Add a global theme state tracker
let currentThemeIsDark = false; // Default to light mode

// Update the checkDarkMode function to use our state tracker
function checkDarkMode() {
    // Get the toggle button text to determine current theme
    const themeToggleButtons = Array.from(document.querySelectorAll('a, button'));
    const themeButton = themeToggleButtons.find(el => 
        el.textContent.includes('Switch to Dark Mode') || 
        el.textContent.includes('Switch to Light Mode')
    );
    
    if (themeButton) {
        // If the button says "Switch to Dark Mode", we must be in light mode
        // If it says "Switch to Light Mode", we must be in dark mode
        const buttonText = themeButton.textContent.trim();
        const isDarkBasedOnButton = buttonText.includes('Switch to Light Mode');
        
        // Update our global state
        currentThemeIsDark = isDarkBasedOnButton;
    }
    
    // Log our state for debugging
    console.log("Dark mode check - Button text indicates dark mode:", currentThemeIsDark);
    console.log("HTML theme:", document.documentElement.getAttribute('data-bs-theme'));
    console.log("Body theme:", document.body.getAttribute('data-bs-theme'));
    console.log("Body class:", document.body.classList.contains('dark-mode'));
    
    return currentThemeIsDark;
}

// Update the setupThemeDetection function to initialize and track theme state
function setupThemeDetection() {
    // Initialize theme state based on button text
    const themeToggleButtons = Array.from(document.querySelectorAll('a, button'));
    const themeButton = themeToggleButtons.find(el => 
        el.textContent.includes('Switch to Dark Mode') || 
        el.textContent.includes('Switch to Light Mode')
    );
    
    if (themeButton) {
        // Initialize the global dark mode state
        currentThemeIsDark = themeButton.textContent.includes('Switch to Light Mode');
        console.log("Initial theme detection based on button:", currentThemeIsDark ? "dark" : "light");
    } else {
        console.log("Theme button not found, defaulting to:", currentThemeIsDark ? "dark" : "light");
    }
    
    applyCurrentTheme();
    
    // Create a debounced version of applyCurrentTheme
    const debouncedApplyTheme = debounce(() => {
        if (!refreshInProgress && Date.now() - lastRefreshTime > 500) {
            // Toggle our theme state on each theme change
            currentThemeIsDark = !currentThemeIsDark;
            console.log("Theme toggled to:", currentThemeIsDark ? "dark" : "light");
                applyCurrentTheme();
            }
    }, 250);
    
    // Add click event listeners to theme toggle buttons - use proper DOM selectors
    document.querySelectorAll('a, button').forEach(el => {
        if (el.textContent.includes('Switch to Dark Mode') || 
            el.textContent.includes('Switch to Light Mode')) {
            el.addEventListener('click', function() {
                // Toggle the theme state when button is clicked
                currentThemeIsDark = !currentThemeIsDark;
                console.log("Theme button clicked. New state:", currentThemeIsDark ? "dark" : "light");
                
                // Small delay to ensure button text has updated
                setTimeout(() => {
        applyCurrentTheme();
                }, 50);
    });
}
    });

    // Rest of the setupThemeDetection function remains the same...
}

// Update applyCurrentTheme to avoid reloading when possible
function applyCurrentTheme() {
    // Prevent concurrent refreshes
    if (refreshInProgress) {
        console.log("Refresh already in progress, skipping");
        return;
    }
    
    refreshInProgress = true;
    lastRefreshTime = Date.now();
    
    // Use the improved dark mode detection
    const isDarkMode = checkDarkMode();
    console.log("Theme changed to:", isDarkMode ? "dark" : "light");
    
    // For debugging, log all theme-related attributes
    console.log("HTML data-bs-theme:", document.documentElement.getAttribute('data-bs-theme'));
    console.log("Body classList contains dark-mode:", document.body.classList.contains('dark-mode'));
    
    // Get the actual toggle button text to confirm theme state
    const themeToggleElement = Array.from(document.querySelectorAll('a, button'))
        .find(el => el.textContent.includes('Switch to Dark Mode') || 
                    el.textContent.includes('Switch to Light Mode'));
    const themeToggleText = themeToggleElement ? themeToggleElement.textContent.trim() : 'unknown';
    console.log("Theme toggle button text:", themeToggleText);
    
    // Directly modify the root CSS variables to ensure they're updated
    const root = document.documentElement;
    if (isDarkMode) {
        root.style.setProperty('--map-bg', '#121212', 'important');
        root.style.setProperty('--link-color', '#444444', 'important');
    } else {
        root.style.setProperty('--map-bg', 'white', 'important');
        root.style.setProperty('--link-color', '#cccccc', 'important');
    }
    
    // Explicitly set SVG background color
    const bubbleMap = document.getElementById('bubbleMap');
    if (bubbleMap) {
        // If we have active visualization, try to just update colors instead of reloading
        if (bubbleMap.style.display !== 'none') {
            console.log("Fast path: updating colors without reloading");
            updateVisualizationColors();
            
            // Reset refresh state quickly
            setTimeout(() => {
                refreshInProgress = false;
                console.log("Fast refresh completed");
            }, 50);
            return;
        }
        
        // Otherwise, proceed with full update
        const bgColor = isDarkMode ? '#121212' : 'white';
        
        // Set multiple ways to ensure it takes effect
        bubbleMap.style.setProperty('background-color', bgColor, 'important');
        bubbleMap.setAttribute('fill', bgColor);
        
        // Other theme settings...
        if (isDarkMode) {
            bubbleMap.setAttribute('data-theme', 'dark');
            document.body.classList.add('dark-mode-applied');
        } else {
            bubbleMap.removeAttribute('data-theme');
            document.body.classList.remove('dark-mode-applied');
        }
    }
    
    // If we have an active visualization, refresh it
    if (bubbleMap && bubbleMap.style.display !== 'none') {
        console.log("Refreshing visualization for theme change");
        // Store the current selection
        const currentSelection = document.getElementById('drugSelect').value;
        
        // Completely recreate the visualization
        if (!currentSelection) {
            loadFullRelationshipGraph();
        } else {
            updateInteractionMap();
        }
    }
    
    // Reset refresh state after a short delay
    setTimeout(() => {
        refreshInProgress = false;
        console.log("Refresh completed");
    }, 300); // Reduced from 1000ms
}

// New function to update colors without reloading data
function updateVisualizationColors() {
    const isDarkMode = checkDarkMode();
    console.log("Updating visualization colors only, dark mode:", isDarkMode);
    
    // Hide empty state if visible
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = 'none';
    
    // Show the visualization
    const bubbleMap = document.getElementById('bubbleMap');
    if (bubbleMap) bubbleMap.style.display = 'block';
    
    // Update the colors directly with D3
    if (typeof d3 !== 'undefined') {
        // Set background colors
        const bgColor = isDarkMode ? '#121212' : 'white';
        
        // Update SVG background
        d3.select("#bubbleMap")
          .style("background-color", bgColor, 'important')
          .attr("fill", bgColor);
          
        // Update background rectangle
        d3.select(".svg-background")
          .attr("fill", bgColor);
        
        // Update links
        d3.selectAll(".link")
          .style("stroke", isDarkMode ? "#444444" : "#cccccc", 'important')
          .style("stroke-opacity", isDarkMode ? 0.6 : 0.4, 'important');
          
        // Update all nodes
        d3.selectAll("circle.category-main, .category-main circle")
          .style("fill", isDarkMode ? "var(--node-main-fill)" : "var(--node-main-fill)", 'important')
          .style("stroke", isDarkMode ? "#555555" : "#888888", 'important');
          
        d3.selectAll("circle.category-high, .category-high circle")
          .style("fill", isDarkMode ? "var(--node-high-fill)" : "var(--node-high-fill)", 'important')
          .style("stroke", isDarkMode ? "#555555" : "#888888", 'important');
          
        d3.selectAll("circle.category-medium, .category-medium circle")
          .style("fill", isDarkMode ? "var(--node-medium-fill)" : "var(--node-medium-fill)", 'important')
          .style("stroke", isDarkMode ? "#555555" : "#888888", 'important');
          
        d3.selectAll("circle.category-low, .category-low circle")
          .style("fill", isDarkMode ? "var(--node-low-fill)" : "var(--node-low-fill)", 'important')
          .style("stroke", isDarkMode ? "#555555" : "#888888", 'important');
          
        d3.selectAll("circle.category-unknown, .category-unknown circle")
          .style("fill", isDarkMode ? "var(--node-unknown-fill)" : "var(--node-unknown-fill)", 'important')
          .style("stroke", isDarkMode ? "#555555" : "#888888", 'important');
          
        // Update text elements
        d3.selectAll(".node-label-bg")
          .style("fill", isDarkMode ? "rgba(20, 20, 20, 0.9)" : "rgba(0, 0, 0, 0.7)", 'important');
          
        d3.selectAll(".node text")
          .style("fill", isDarkMode ? "#f0f0f0" : "white", 'important');
          
        // Update container
        const mapContainer = document.querySelector(".map-container");
        if (mapContainer) {
            mapContainer.style.setProperty('background-color', isDarkMode ? '#121212' : 'var(--secondary-bg)', 'important');
            mapContainer.style.setProperty('border-color', isDarkMode ? '#333333' : 'var(--border-color)', 'important');
        }
    }
}

// Add a function to initialize theme state on page load
function initializeTheme() {
    // Check if we pre-detected dark mode
    if (window.initialDarkMode === true) {
        currentThemeIsDark = true;
        console.log("Using pre-detected dark mode");
    } else {
        // First, check if the button text indicates we're in dark mode
        const themeToggleButtons = Array.from(document.querySelectorAll('a, button'));
        const themeButton = themeToggleButtons.find(el => 
            el.textContent.includes('Switch to Dark Mode') || 
            el.textContent.includes('Switch to Light Mode')
        );
        
        if (themeButton) {
            // Parse the button text to determine current theme
            const buttonText = themeButton.textContent.trim();
            currentThemeIsDark = buttonText.includes('Switch to Light Mode');
            console.log("Initial theme from button:", currentThemeIsDark ? "dark" : "light");
        } else {
            // Fallback to checking CSS variables or other indicators
            const computedStyle = getComputedStyle(document.documentElement);
            const bgColor = computedStyle.getPropertyValue('--map-bg') || 
                            computedStyle.getPropertyValue('--body-bg') || 
                            computedStyle.backgroundColor;
            
            // If background is dark, assume dark mode
            const isDarkBg = bgColor.includes('121212') || 
                            bgColor.includes('rgba(18,') || 
                            bgColor.includes('#121') || 
                            bgColor.includes('var(--secondary-bg)');
            
            currentThemeIsDark = isDarkBg;
            console.log("Initial theme from CSS:", currentThemeIsDark ? "dark" : "light");
        }
    }
    
    // Force apply the theme classes
    applyInitialTheme();
    
    // Set CSS variables to match the detected theme
    const root = document.documentElement;
    if (currentThemeIsDark) {
        root.style.setProperty('--map-bg', '#121212', 'important');
        root.style.setProperty('--link-color', '#444444', 'important');
        root.style.setProperty('--node-main-fill', '#8021B0', 'important');
        root.style.setProperty('--node-high-fill', '#c13c38', 'important');
        root.style.setProperty('--node-medium-fill', '#e09c40', 'important');
        root.style.setProperty('--node-low-fill', '#49a2bc', 'important');
        root.style.setProperty('--node-unknown-fill', '#666666', 'important');
        
        // Force dark mode on body and html elements
        document.body.classList.add('dark-mode');
        document.documentElement.setAttribute('data-theme', 'dark');
        
        // Find and apply dark mode to map container and SVG early
        setTimeout(() => {
            forceApplyDarkMode();
        }, 0);
    } else {
        root.style.setProperty('--map-bg', 'white', 'important');
        root.style.setProperty('--link-color', '#cccccc', 'important');
        root.style.setProperty('--node-main-fill', '#9932CC', 'important');
        root.style.setProperty('--node-high-fill', '#d9534f', 'important');
        root.style.setProperty('--node-medium-fill', '#f0ad4e', 'important');
        root.style.setProperty('--node-low-fill', '#5bc0de', 'important');
        root.style.setProperty('--node-unknown-fill', '#777777', 'important');
        
        // Clear dark mode
        document.body.classList.remove('dark-mode');
        document.documentElement.removeAttribute('data-theme');
    }
}

// Add a function to apply initial theme without animation
function applyInitialTheme() {
    // No need to check for concurrent refresh since this is initialization
    const isDarkMode = currentThemeIsDark;
    console.log("Applying initial theme:", isDarkMode ? "dark" : "light");
    
    // Set theme classes/attributes on body and document
    if (isDarkMode) {
        document.body.classList.add('dark-mode-applied');
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode-applied');
        document.documentElement.removeAttribute('data-theme');
    }
    
    // Set the map container background directly
    const mapContainer = document.querySelector(".map-container");
    if (mapContainer) {
        mapContainer.style.setProperty('background-color', isDarkMode ? 'var(--secondary-bg)' : 'var(--secondary-bg)', 'important');
        mapContainer.style.setProperty('border-color', isDarkMode ? '#333333' : 'var(--border-color)', 'important');
    }
}

// Add a function to force dark mode styles immediately
function forceApplyDarkMode() {
    console.log("Forcing dark mode styles");
    
    // Apply to the SVG
    const bubbleMap = document.getElementById('bubbleMap');
    if (bubbleMap) {
        bubbleMap.classList.add('dark-mode');
        bubbleMap.style.backgroundColor = '#121212';
        bubbleMap.style.fill = '#121212';
    }
    
    // Apply to the container
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        mapContainer.style.backgroundColor = '#121212';
        mapContainer.style.borderColor = '#333333';
    }
    
    // Apply to existing nodes
    document.querySelectorAll('.category-main circle, circle.category-main').forEach(el => {
        el.style.fill = '#8021B0';
        el.style.stroke = '#555555';
    });
    
    document.querySelectorAll('.category-high circle, circle.category-high').forEach(el => {
        el.style.fill = '#c13c38';
        el.style.stroke = '#555555';
    });
    
    document.querySelectorAll('.category-medium circle, circle.category-medium').forEach(el => {
        el.style.fill = '#e09c40';
        el.style.stroke = '#555555';
    });
    
    document.querySelectorAll('.category-low circle, circle.category-low').forEach(el => {
        el.style.fill = '#49a2bc';
        el.style.stroke = '#555555';
    });
    
    document.querySelectorAll('.category-unknown circle, circle.category-unknown').forEach(el => {
        el.style.fill = '#666666';
        el.style.stroke = '#555555';
    });
    
    // Apply to links
    document.querySelectorAll('.link').forEach(el => {
        el.style.stroke = '#444444';
    });
}

// Add this new function to directly update colors without redrawing
function applyColorsDirectly(isDarkMode) {
    console.log("Applying colors directly, dark mode:", isDarkMode);
    
    // Get background elements
    const svgElement = document.getElementById('bubbleMap');
    const container = document.querySelector(".map-container");
    const bgColor = isDarkMode ? '#121212' : 'white';
    
    // Set background colors immediately
    if (svgElement) {
        svgElement.style.backgroundColor = bgColor;
        svgElement.setAttribute('fill', bgColor);
    }
    
    if (container) {
        container.style.backgroundColor = isDarkMode ? '#121212' : 'var(--secondary-bg)';
        container.style.borderColor = isDarkMode ? '#333333' : 'var(--border-color)';
    }
    
    // If D3 isn't loaded yet, we can't continue
    if (typeof d3 === 'undefined') return;
    
    // Background rectangle
    d3.select("#bubbleMap rect.svg-background").attr("fill", bgColor);
    
    // Update links
    d3.selectAll("#bubbleMap line.link")
      .attr("stroke", isDarkMode ? "#444444" : "#cccccc");
    
    // Update nodes directly with theme-specific colors
    d3.selectAll("#bubbleMap circle").each(function() {
        const element = d3.select(this);
        let category = "";
        
        // Find which category this circle belongs to
        if (element.classed("category-main") || element.parent && element.parent().classed("category-main")) {
            category = "main";
        } else if (element.classed("category-high") || element.parent && element.parent().classed("category-high")) {
            category = "high";
        } else if (element.classed("category-medium") || element.parent && element.parent().classed("category-medium")) {
            category = "medium";
        } else if (element.classed("category-low") || element.parent && element.parent().classed("category-low")) {
            category = "low";
        } else {
            category = "unknown";
        }
        
        // Apply appropriate color based on category and theme
        if (isDarkMode) {
            // Dark mode colors
            if (category === "main") element.attr("fill", "#8021B0");
            else if (category === "high") element.attr("fill", "#c13c38");
            else if (category === "medium") element.attr("fill", "#e09c40");
            else if (category === "low") element.attr("fill", "#49a2bc");
            element.attr("stroke", "#555555");
        } else {
            // Light mode colors
            if (category === "main") element.attr("fill", "#9932CC");
            else if (category === "high") element.attr("fill", "#d9534f");
            else if (category === "medium") element.attr("fill", "#f0ad4e");
            else if (category === "low") element.attr("fill", "#5bc0de");
            element.attr("stroke", "#888888");
        }
    });
    
    // Update text backgrounds
    d3.selectAll("#bubbleMap .node-label-bg")
      .attr("fill", isDarkMode ? "rgba(20, 20, 20, 0.9)" : "rgba(0, 0, 0, 0.7)");
    
    // Update text color
    d3.selectAll("#bubbleMap .node text")
      .attr("fill", isDarkMode ? "#f0f0f0" : "white");
    
    // No delays or timeouts needed - changes are applied immediately
}