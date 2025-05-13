/**
 * Drug Interaction Map Visualization
 * 
 * This JavaScript module provides interactive visualizations for drug interactions using D3.js.
 * It creates force-directed graphs to display relationships between drugs, with support for
 * both individual drug interaction maps and a full network visualization of all drug relationships.
 * 
 * Features:
 * - Interactive force-directed graph visualizations of drug interactions
 * - Responsive design that adapts to container dimensions
 * - Support for both dark and light themes with automatic detection
 * - Data caching to improve performance when switching between drugs
 * - Drag-and-drop interaction for repositioning nodes
 * - Color-coding of interaction nodes based on severity/group
 * - Automatic theme detection and switching
 * 
 * Dependencies:
 * - D3.js (loaded externally)
 * - Requires an HTML select element with id 'drugSelect' for drug selection
 * - Requires SVG element with id 'bubbleMap' for visualization rendering
 * - Requires div with id 'emptyState' for displaying loading/error states
 * 
 * API Usage:
 * - updateInteractionMap() - Updates the visualization based on the selected drug
 * - loadFullRelationshipGraph() - Loads and displays the full drug interaction network
 */
let forceDarkMode = false;
// Track theme state with a global variable
let currentThemeIsDark = false;

// This function will be called immediately and again when creating visualizations
/**
 * Detects if the page is in dark mode based on multiple indicators.
 * 
 * This function checks several elements to determine if dark mode is active:
 * 1. Looks for buttons with text "Switch to Light Mode"
 * 2. Checks HTML attributes like data-bs-theme or data-theme
 * 3. Examines document body classes for dark-mode
 * 4. Analyzes computed background color of the body
 * 
 * @returns {boolean} True if dark mode is detected, false otherwise
 */
function detectDarkMode() {
    // Simplest check - look for the switch button text
    const allButtons = document.querySelectorAll('a, button');
    for (let i = 0; i < allButtons.length; i++) {
        if (allButtons[i].textContent.includes('Switch to Light Mode')) {
            console.log("Detected dark mode from button text");
            forceDarkMode = true;
            currentThemeIsDark = true;
            return true;
        }
    }
    
    // If no button found, check for dark classes or attributes
    if (document.documentElement.getAttribute('data-bs-theme') === 'dark' || 
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.body.classList.contains('dark-mode')) {
        console.log("Detected dark mode from attributes/classes");
        forceDarkMode = true;
        currentThemeIsDark = true;
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
        currentThemeIsDark = true;
        return true;
    }
    
    // Default to light mode
    forceDarkMode = false;
    currentThemeIsDark = false;
    return false;
}

// Run theme detection immediately
detectDarkMode();

// Set initial background colors right away
/**
 * Sets initial background colors for visualization containers.
 * 
 * This immediately-invoked function expression (IIFE) applies theme-appropriate
 * background colors to the map container and SVG elements as soon as possible
 * to avoid flashes of incorrect theme colors during page load.
 */
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
/**
 * Initializes the visualization when the DOM is fully loaded.
 * 
 * This event handler executes when the DOM content is loaded, setting up theme detection,
 * applying the initial background colors, and preparing the drug interaction
 * visualization. It ensures that elements look correct even before D3.js is ready.
 */
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
    
    // Theme switcher event handler
    setupThemeSwitcherEvents();
    
    // Make sure D3 is loaded before proceeding with the rest
    // ...continue with existing code
});

// Store all drugs data for easier reference
let allDrugs = [];

// Function to ensure D3.js is loaded
/**
 * Ensures D3.js is loaded before executing visualization code.
 * 
 * This function checks if D3 is available and calls the provided callback when ready.
 * If D3 is not initially loaded, it will poll periodically until it becomes available
 * or until a timeout is reached. Applies the current theme before executing the callback.
 * 
 * @param {Function} callback - The function to execute once D3 is available
 */
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
/**
 * Updates the drug interaction visualization based on the selected drug.
 * 
 * This function fetches interaction data for the selected drug and creates
 * the appropriate visualization. It implements caching to avoid redundant 
 * API calls and handles different visualization modes:
 * - For a specific drug: Shows a bubble map of interactions
 * - For "Overview" (no drug selected): Shows the full relationship graph
 * 
 * The function also handles error states and loading indicators.
 */
function updateInteractionMap() {
    console.log("updateInteractionMap called");
    const drugId = document.getElementById('drugSelect').value;
    
    // Always clear the visualization first to avoid showing previous maps
    const bubbleMap = document.getElementById('bubbleMap');
    if (bubbleMap) {
        bubbleMap.style.display = 'none';
        // Force SVG clearing
        bubbleMap.innerHTML = '';
    }
    
    // Reset SVG content to prevent persistence of previous visualizations
    d3.select("#bubbleMap").html("");
    
    // Show loading state
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p>Loading interaction data...</p>';
        emptyState.style.display = 'block';
    }
    
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
                if (!Array.isArray(interactionIds) || interactionIds.length === 0) {
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

// Update document.ready to ensure everything is properly initialized
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded - initializing map");
    
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
                console.log("Drug selection changed:", drugsSelect.value);
                if (typeof updateInteractionMap === 'function') {
                    updateInteractionMap();
                } else {
                    console.error("updateInteractionMap function is not defined");
                }
            });
            
            // Clear existing drugs array to prevent duplicates
            allDrugs = [];
            
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

// Improved function to create bubble map with more robust error handling
/**
 * Creates a bubble map visualization for a specific drug and its interactions.
 * 
 * This function generates a force-directed graph where the main drug is at the center
 * and its interactions are represented as connected nodes. Each interaction is 
 * displayed as a colored bubble with appropriate sizing based on significance.
 * 
 * @param {string} drugId - The ID of the main drug to visualize
 * @param {Array<string>} interactionIds - Array of drug IDs that interact with the main drug
 */
function createBubbleMap(drugId, interactionIds) {
    console.log("Creating bubble map for drug ID:", drugId, "with interactions:", interactionIds);
    
    // Ensure D3 is loaded
    if (typeof d3 === 'undefined') {
        console.error("D3 is not defined. Cannot create visualization.");
        showError("Visualization Error", "Required library is not available. Please try refreshing the page.");
        return;
    }
    
    // Check for empty interactions first
    if (!Array.isArray(interactionIds) || interactionIds.length === 0) {
        console.log("No interactions found for drug ID:", drugId);
        showError("No Interactions Found", "This drug has no recorded interactions.");
        return;
    }
    
    try {
        // Force clear previous visualization
        const svgElement = document.getElementById('bubbleMap');
        if (svgElement) {
            svgElement.innerHTML = '';
            svgElement.style.display = 'block';
        }
        
        // Clear any previous content
        d3.select("#bubbleMap").html("");
        
        // Find main drug details
        const mainDrug = allDrugs.find(drug => drug.id === drugId);
        if (!mainDrug) {
            console.error("Main drug not found in dataset");
            showError("Data Error", "Selected drug information could not be found.");
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
        let validInteractionCount = 0;
        interactionIds.forEach((interactionId, index) => {
            const interactingDrug = allDrugs.find(drug => drug.id === interactionId);
            if (!interactingDrug) return;
            
            validInteractionCount++;
            nodes.push({
                id: interactingDrug.id,
                name: interactingDrug.name,
                group: "high", // Give a default group for proper coloring
                value: 45  // Increased size of interaction bubbles
            });
            
            links.push({
                source: mainDrug.id,
                target: interactingDrug.id,
                value: 1
            });
        });
        
        // Double-check valid interactions
        if (validInteractionCount === 0) {
            console.log("No valid interactions found for drug ID:", drugId);
            showError("No Valid Interactions Found", "This drug has no valid interactions with other drugs in the system.");
            return;
        }
        
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
        showError("Visualization Error", "An error occurred while creating the visualization: " + error.message);
    }
}

// Helper function to display errors
/**
 * Displays an error message to the user.
 * 
 * This function shows an error message in the empty state container and hides
 * the visualization elements. Used to present user-friendly error messages when
 * data loading or visualization creation fails.
 * 
 * @param {string} title - The error title/heading
 * @param {string} message - The detailed error message
 */
function showError(title, message) {
    const emptyState = document.getElementById('emptyState');
    const bubbleMap = document.getElementById('bubbleMap');
    const mapLegend = document.getElementById('mapLegend');
    
    if (emptyState) {
        emptyState.innerHTML = `<h3>${title}</h3><p>${message}</p>`;
        emptyState.style.display = 'block';
    }
    if (bubbleMap) bubbleMap.style.display = 'none';
    if (mapLegend && mapLegend.style) mapLegend.style.display = 'none';
}

// Improved createForceGraph function with explicit color handling
/**
 * Creates a force-directed graph visualization for drug interactions.
 * 
 * This function builds an interactive D3.js force simulation with nodes (drugs)
 * and links (interactions). It handles theme-specific styling, node coloring
 * based on categories, and interactive features like dragging nodes.
 * 
 * @param {Array<Object>} nodes - Array of node objects with drug data (id, name, group, value)
 * @param {Array<Object>} links - Array of link objects defining connections between nodes
 */
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
        if (!svgElement) {
            console.error("SVG element not found");
            throw new Error("SVG element not found");
        }
        
        // Always set the background color for the SVG 
        const bgColor = forceDarkMode ? '#121212' : 'white';
        
        // Direct application of background color through multiple methods
        svgElement.style.backgroundColor = bgColor;
        svgElement.setAttribute('fill', bgColor);
        svgElement.style.setProperty('background-color', bgColor, 'important');
        
        // Use D3 to select the SVG
        const svg = d3.select("#bubbleMap");
        if (!svg.node()) {
            throw new Error("SVG element not found");
        }
        
        // Get dimensions from the container
        let width, height;
        const container = document.querySelector(".map-container");
        if (container) {
            width = container.clientWidth || 800;
            height = container.clientHeight || 600;
            
            // Also set the container background in dark mode
            container.style.backgroundColor = forceDarkMode ? '#121212' : 'white';
            container.style.borderColor = forceDarkMode ? '#333' : '#ddd';
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
        
        // ABSOLUTE HARDCODED COLORS - No variables, no lookup tables
        const mainColorDark = "#8021B0";
        const highColorDark = "#c13c38";
        const mediumColorDark = "#e09c40";
        const lowColorDark = "#49a2bc";
        const unknownColorDark = "#666666";
        
        const mainColorLight = "#9932CC";
        const highColorLight = "#d9534f";
        const mediumColorLight = "#f0ad4e";
        const lowColorLight = "#5bc0de";
        const unknownColorLight = "#777777";
        
        // Apply circles with explicit coloring
        node.append("circle")
            .attr("r", d => Math.sqrt(d.value) * 2)
            .each(function(d) {
                const element = d3.select(this);
                let color;
                const group = d.group || "unknown";
                
                if (forceDarkMode) {
                    // Dark mode colors
                    if (group === "main") color = mainColorDark;
                    else if (group === "high") color = highColorDark;
                    else if (group === "medium") color = mediumColorDark;
                    else if (group === "low") color = lowColorDark;
                    else color = unknownColorDark;
                } else {
                    // Light mode colors
                    if (group === "main") color = mainColorLight;
                    else if (group === "high") color = highColorLight;
                    else if (group === "medium") color = mediumColorLight;
                    else if (group === "low") color = lowColorLight;
                    else color = unknownColorLight;
                }
                
                // Apply the color directly to the DOM with !important
                this.setAttribute("fill", color);
                this.style.fill = color;
                this.setAttribute("stroke", forceDarkMode ? "#555555" : "#888888");
                this.setAttribute("stroke-width", "2px");
                
                // Add class for potential CSS hooks but don't rely on them for coloring
                element.classed("category-" + group, true);
            });
        
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
        /**
         * Handles the start of a drag interaction on a node.
         * 
         * This function is called when a user begins dragging a node in the visualization.
         * It sets up the drag behavior by initializing fixed coordinates and restarting
         * the simulation with a higher alpha target for more responsive movement.
         * 
         * @param {Event} event - The drag start event
         * @param {Object} d - The data object for the node being dragged
         */
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        /**
         * Handles the drag movement of a node.
         * 
         * This function is called continuously as a user drags a node. It updates
         * the node's fixed position coordinates to match the current drag position.
         * 
         * @param {Event} event - The drag event
         * @param {Object} d - The data object for the node being dragged
         */
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        /**
         * Handles the end of a drag interaction on a node.
         * 
         * This function is called when a user releases a node after dragging.
         * It releases the node's fixed position, allowing it to be affected by
         * the force simulation again.
         * 
         * @param {Event} event - The drag end event
         * @param {Object} d - The data object for the node being dragged
         */
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    } catch (error) {
        console.error("Error creating force graph:", error);
        showError("Visualization Error", "An error occurred while rendering the graph: " + error.message);
    }
}

// Similarly update the createNetworkGraph function with the same color approach
/**
 * Creates a network graph visualization showing all drug relationships.
 * 
 * This function builds a complex network visualization with all drugs and their
 * interactions. It supports zooming, panning, and drag-and-drop interaction.
 * The visualization uses color-coding based on drug categories and theme support.
 * 
 * @param {Array<Object>} nodes - Array of node objects with drug data
 * @param {Array<Object>} links - Array of link objects defining relationships between drugs
 */
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
        if (!svgElement) {
            console.error("SVG element not found");
            throw new Error("SVG element not found");
        }
        
        // Always set the background color for the SVG
        const bgColor = forceDarkMode ? '#121212' : 'white';
        
        // Direct application of background color through multiple methods
        svgElement.style.backgroundColor = bgColor;
        svgElement.setAttribute('fill', bgColor);
        svgElement.style.setProperty('background-color', bgColor, 'important');
        
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
            container.style.backgroundColor = forceDarkMode ? '#121212' : 'white';
            container.style.borderColor = forceDarkMode ? '#333' : '#ddd';
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
        svg.append("rect")
           .attr("class", "svg-background")
           .attr("x", 0)
           .attr("y", 0)
           .attr("width", width)
           .attr("height", height)
           .attr("fill", bgColor);
         
        // Multiple ways to set the background
        svg.style("background-color", bgColor);
        
        // Force simulation for the graph
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
        
        // ABSOLUTE HARDCODED COLORS - No variables, no lookup tables
        const mainColorDark = "#8021B0";
        const highColorDark = "#c13c38";
        const mediumColorDark = "#e09c40";
        const lowColorDark = "#49a2bc";
        const unknownColorDark = "#666666";
        
        const mainColorLight = "#9932CC";
        const highColorLight = "#d9534f";
        const mediumColorLight = "#f0ad4e";
        const lowColorLight = "#5bc0de";
        const unknownColorLight = "#777777";
        
        // Add circles to nodes with explicit coloring
        node.append("circle")
            .attr("r", d => Math.sqrt(d.value) * 1.5)
            .each(function(d) {
                const element = d3.select(this);
                let color;
                const group = d.group || "unknown";
                
                if (forceDarkMode) {
                    // Dark mode colors
                    if (group === "main") color = mainColorDark;
                    else if (group === "high") color = highColorDark;
                    else if (group === "medium") color = mediumColorDark;
                    else if (group === "low") color = lowColorDark;
                    else color = unknownColorDark;
                } else {
                    // Light mode colors
                    if (group === "main") color = mainColorLight;
                    else if (group === "high") color = highColorLight;
                    else if (group === "medium") color = mediumColorLight;
                    else if (group === "low") color = lowColorLight;
                    else color = unknownColorLight;
                }
                
                // Apply the color directly to the DOM with !important
                this.setAttribute("fill", color);
                this.style.fill = color;
                this.setAttribute("stroke", forceDarkMode ? "#555555" : "#888888");
                this.setAttribute("stroke-width", "2px");
                
                // Add class for potential CSS hooks but don't rely on them for coloring
                element.classed("category-" + group, true);
            });
        
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
        /**
         * Handles the start of a drag interaction on a node.
         * 
         * This function is called when a user begins dragging a node in the network visualization.
         * It sets up the drag behavior by initializing fixed coordinates and restarting
         * the simulation with a higher alpha target for more responsive movement.
         * 
         * @param {Event} event - The drag start event
         * @param {Object} d - The data object for the node being dragged
         */
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        /**
         * Handles the drag movement of a node.
         * 
         * This function is called continuously as a user drags a node. It updates
         * the node's fixed position coordinates to match the current drag position.
         * 
         * @param {Event} event - The drag event
         * @param {Object} d - The data object for the node being dragged
         */
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        /**
         * Handles the end of a drag interaction on a node.
         * 
         * This function is called when a user releases a node after dragging.
         * It releases the node's fixed position, allowing it to be affected by
         * the force simulation again.
         * 
         * @param {Event} event - The drag end event
         * @param {Object} d - The data object for the node being dragged
         */
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    } catch (error) {
        console.error("Error creating network graph:", error);
        showError("Visualization Error", "An error occurred while creating the network visualization: " + error.message);
    }
}

// Function to generate the network graph from the full interaction data
/**
 * Generates a network graph from the complete drug interaction dataset.
 * 
 * This function processes the complete interaction data and transforms it into 
 * a format suitable for visualization. It creates nodes for each drug and links
 * for interactions between drugs, while preventing duplicate links and handling
 * error states.
 * 
 * @param {Object} interactionData - Object containing all drug interaction data
 */
function generateNetworkGraph(interactionData) {
    try {
        console.log("Generating network graph with", Object.keys(interactionData).length, "drugs");
        
        // Hide empty state and show loading
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div><p>Generating visualization...</p>';
            emptyState.style.display = 'block';
        }
        
        // Force clear any existing visualization
        const bubbleMap = document.getElementById('bubbleMap');
        if (bubbleMap) {
            bubbleMap.style.display = 'none';
            bubbleMap.innerHTML = '';
        }
        
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
            showError("No Data to Visualize", "No valid drug interaction data was found.");
            return;
        }
        
        // Create visualization
        if (emptyState) emptyState.style.display = 'none';
        if (bubbleMap) bubbleMap.style.display = 'block';
        
        // Create network visualization
        createNetworkGraph(nodes, links);
        
    } catch (error) {
        console.error("Error generating network graph:", error);
        showError("Visualization Error", "An error occurred while creating the network visualization: " + error.message);
        
        // Clear any cached data that might be corrupted
        cachedInteractionData = {};
    }
}

// Helper function to categorize nodes based on interaction count
/**
 * Determines the category group of a drug based on its number of interactions.
 * 
 * This function assigns a visual/semantic category to a drug node based on how
 * many interactions it has with other drugs. The categories affect the node's color.
 * 
 * @param {number} interactionCount - The number of interactions the drug has
 * @returns {string} The category group ("none", "low", "medium", or "high")
 */
function getNodeGroup(interactionCount) {
    if (interactionCount === 0) return "none";
    if (interactionCount <= 2) return "low";
    if (interactionCount <= 5) return "medium";
    return "high";
}

// Add a debounce function to prevent excessive refreshes
/**
 * Creates a debounced version of a function.
 * 
 * This utility function prevents a function from being called too frequently
 * by delaying its execution until a specified wait time has passed since the
 * last invocation.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds 
 * @returns {Function} A debounced version of the input function
 */
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
// Default to light mode - variable declared at the top of the file

// Update the checkDarkMode function to use our state tracker
/**
 * Checks and determines the current theme based on UI elements.
 * 
 * This function examines the theme toggle button text to determine if the 
 * application is currently in dark mode. It updates the global state variable
 * and provides detailed logging for debugging purposes.
 * 
 * @returns {boolean} True if dark mode is active, false otherwise
 */
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
/**
 * Sets up theme detection and tracking mechanisms.
 * 
 * This function initializes the theme state based on current UI elements,
 * adds event listeners to theme toggle buttons, and sets up a MutationObserver
 * to watch for dynamic theme changes in the DOM.
 */
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
    
    // Add click event listeners to theme toggle buttons
    document.querySelectorAll('a, button').forEach(el => {
        if (el.textContent.includes('Switch to Dark Mode') || 
            el.textContent.includes('Switch to Light Mode')) {
            
            // Remove any existing click event listeners to avoid duplicates
            el.removeEventListener('click', themeClickHandler);
            
            // Add new click event listener
            el.addEventListener('click', themeClickHandler);
        }
    });

    // Added a MutationObserver to watch for theme changes in the DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'data-bs-theme' || 
                 mutation.attributeName === 'data-theme' || 
                 mutation.attributeName === 'class')) {
                // Theme may have changed, check and update
                detectDarkMode();
                updateVisualizations();
            }
        });
    });

    // Start observing
    observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['data-bs-theme', 'data-theme', 'class'] 
    });
    observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['data-bs-theme', 'data-theme', 'class'] 
    });
}

// Theme click handler function
function themeClickHandler() {
    console.log("Theme button clicked");
    
    // Toggle the theme state when button is clicked
    forceDarkMode = !forceDarkMode;
    currentThemeIsDark = forceDarkMode;
    console.log("Theme toggled to:", forceDarkMode ? "dark" : "light");
    
    // Update visualizations with the new theme
    updateVisualizations();
}

// Function to update visualizations after theme change
/**
 * Updates visualizations after a theme change occurs.
 * 
 * This function is called when theme settings change to ensure all visualizations
 * reflect the current theme. It determines what visualization is currently displayed
 * and refreshes it with appropriate colors and styling.
 */
function updateVisualizations() {
    console.log("Updating visualizations for theme change");
    
    // Get current drug selection
    const drugSelect = document.getElementById('drugSelect');
    if (!drugSelect) return;
    
    const currentDrugId = drugSelect.value;
    console.log("Current drug selection:", currentDrugId);
    
    // If we're in overview mode, refresh the network graph
    if (!currentDrugId) {
        if (cachedInteractionData && Object.keys(cachedInteractionData).length > 0) {
            console.log("Refreshing network graph");
            generateNetworkGraph(cachedInteractionData);
        } else {
            console.log("No cached data for network graph, reloading");
            loadFullRelationshipGraph();
        }
    } 
    // If we have a specific drug selected, refresh that view
    else if (cachedNodeData[currentDrugId]) {
        console.log("Refreshing drug interaction map");
        createBubbleMap(currentDrugId, cachedNodeData[currentDrugId].interactionIds);
    } else {
        console.log("No cached data for drug, triggering reload");
        // Force a reload
        lastUsedDrugId = null;
        updateInteractionMap();
    }
    
    // Also directly apply colors to existing elements
    applyColorsDirectly(forceDarkMode);
}

// Function to directly update colors without redrawing
/**
 * Applies theme-appropriate colors directly to visualization elements.
 * 
 * This function updates the colors of all visualization elements based on the current theme
 * without requiring a full redraw of the graph. It directly modifies SVG elements, including
 * backgrounds, node colors, link colors, and text colors to match the specified theme.
 * 
 * @param {boolean} isDarkMode - Whether to apply dark mode (true) or light mode (false) colors
 */
function applyColorsDirectly(isDarkMode) {
    console.log("Applying colors directly, dark mode:", isDarkMode);
    
    // ABSOLUTE HARDCODED COLORS - No variables, no lookup tables
    const mainColorDark = "#8021B0";
    const highColorDark = "#c13c38";
    const mediumColorDark = "#e09c40";
    const lowColorDark = "#49a2bc";
    const unknownColorDark = "#666666";
    
    const mainColorLight = "#9932CC";
    const highColorLight = "#d9534f";
    const mediumColorLight = "#f0ad4e";
    const lowColorLight = "#5bc0de";
    const unknownColorLight = "#777777";
    
    // Get background elements
    const svgElement = document.getElementById('bubbleMap');
    const container = document.querySelector(".map-container");
    const bgColor = isDarkMode ? '#121212' : 'white';
    
    // Set background colors immediately
    if (svgElement) {
        svgElement.style.backgroundColor = bgColor;
        svgElement.style.setProperty('background-color', bgColor, 'important');
        svgElement.setAttribute('fill', bgColor);
    }
    
    if (container) {
        container.style.backgroundColor = isDarkMode ? '#121212' : 'white';
        container.style.setProperty('background-color', isDarkMode ? '#121212' : 'white', 'important');
        container.style.borderColor = isDarkMode ? '#333333' : '#ddd';
    }
    
    // If D3 isn't loaded yet, we can't continue
    if (typeof d3 === 'undefined') return;
    
    // Background rectangle
    d3.select("#bubbleMap rect.svg-background").attr("fill", bgColor);
    
    // Update links
    d3.selectAll("#bubbleMap line.link")
      .attr("stroke", isDarkMode ? "#444444" : "#cccccc");
    
    // Update main drug nodes
    d3.selectAll(".category-main circle, circle.category-main").each(function() {
        this.setAttribute("fill", isDarkMode ? mainColorDark : mainColorLight);
        this.style.fill = isDarkMode ? mainColorDark : mainColorLight;
        this.setAttribute("stroke", isDarkMode ? "#555555" : "#888888");
    });
    
    // Update high risk nodes
    d3.selectAll(".category-high circle, circle.category-high").each(function() {
        this.setAttribute("fill", isDarkMode ? highColorDark : highColorLight);
        this.style.fill = isDarkMode ? highColorDark : highColorLight;
        this.setAttribute("stroke", isDarkMode ? "#555555" : "#888888");
    });
    
    // Update medium risk nodes
    d3.selectAll(".category-medium circle, circle.category-medium").each(function() {
        this.setAttribute("fill", isDarkMode ? mediumColorDark : mediumColorLight);
        this.style.fill = isDarkMode ? mediumColorDark : mediumColorLight;
        this.setAttribute("stroke", isDarkMode ? "#555555" : "#888888");
    });
    
    // Update low risk nodes
    d3.selectAll(".category-low circle, circle.category-low").each(function() {
        this.setAttribute("fill", isDarkMode ? lowColorDark : lowColorLight);
        this.style.fill = isDarkMode ? lowColorDark : lowColorLight;
        this.setAttribute("stroke", isDarkMode ? "#555555" : "#888888");
    });
    
    // Update unknown nodes
    d3.selectAll(".category-unknown circle, circle.category-unknown").each(function() {
        this.setAttribute("fill", isDarkMode ? unknownColorDark : unknownColorLight);
        this.style.fill = isDarkMode ? unknownColorDark : unknownColorLight;
        this.setAttribute("stroke", isDarkMode ? "#555555" : "#888888");
    });
    
    // Update text backgrounds
    d3.selectAll("#bubbleMap .node-label-bg")
      .attr("fill", isDarkMode ? "rgba(20, 20, 20, 0.9)" : "rgba(0, 0, 0, 0.7)");
    
    // Update text color
    d3.selectAll("#bubbleMap .node text")
      .attr("fill", isDarkMode ? "#f0f0f0" : "white");
      
    console.log("Direct color application complete");
}

// Add back the loadFullRelationshipGraph function that was removed
/**
 * Loads the full drug relationship network graph.
 * 
 * This function fetches interaction data for all drugs and builds a complete
 * network visualization. It implements caching to avoid repeated API calls,
 * shows progress feedback, and handles error states.
 */
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
    /**
     * Recursively processes each drug to fetch its interactions.
     * 
     * This internal function implements a sequential, recursive approach to fetch
     * interaction data for each drug one by one, updating progress as it goes.
     * 
     * @param {number} index - The current index in the validDrugs array
     */
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

// Add a function to initialize theme state on page load
/**
 * Initializes the theme state when the page loads.
 * 
 * This function detects the initial theme state through multiple methods:
 * 1. Checks for pre-detected theme settings
 * 2. Analyzes theme toggle button text
 * 3. Examines CSS variables and computed styles
 * 
 * It then applies the detected theme throughout the application.
 */
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
        const bgColor = currentThemeIsDark ? '#121212' : 'white';
        
        // Set multiple ways to ensure it takes effect
        bubbleMap.style.setProperty('background-color', bgColor, 'important');
        bubbleMap.setAttribute('fill', bgColor);
        
        // Other theme settings...
        if (currentThemeIsDark) {
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

// Add a function to apply initial theme without animation
/**
 * Applies the initial theme without animation effects.
 * 
 * This function applies theme settings to the document when the page first loads.
 * It sets CSS classes, attributes, and styles directly without animations
 * to ensure a consistent initial appearance.
 */
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

// Update applyCurrentTheme to avoid reloading when possible
/**
 * Applies the current theme to the visualization.
 * 
 * This function updates the visualization to match the current theme setting.
 * It avoids unnecessary reloading of data by directly updating colors when possible.
 * Includes debouncing to prevent simultaneous refreshes.
 */
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
/**
 * Updates visualization colors without reloading data.
 * 
 * This function efficiently applies theme-specific colors to an existing visualization
 * without regenerating the entire graph. It updates node colors, link colors, 
 * backgrounds, and text elements based on the current theme.
 */
function updateVisualizationColors() {
    const isDarkMode = checkDarkMode();
    console.log("Updating visualization colors only, dark mode:", isDarkMode);
    
    // ABSOLUTE HARDCODED COLORS - No variables, no lookup tables
    const mainColorDark = "#8021B0";
    const highColorDark = "#c13c38";
    const mediumColorDark = "#e09c40";
    const lowColorDark = "#49a2bc";
    const unknownColorDark = "#666666";
    
    const mainColorLight = "#9932CC";
    const highColorLight = "#d9534f";
    const mediumColorLight = "#f0ad4e";
    const lowColorLight = "#5bc0de";
    const unknownColorLight = "#777777";
    
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
          .style("background-color", bgColor)
          .attr("fill", bgColor);
          
        // Update background rectangle
        d3.select(".svg-background")
          .attr("fill", bgColor);
        
        // Update links
        d3.selectAll(".link")
          .style("stroke", isDarkMode ? "#444444" : "#cccccc");
          
        // Update all nodes with hardcoded colors
        d3.selectAll("circle.category-main, .category-main circle")
          .style("fill", isDarkMode ? mainColorDark : mainColorLight)
          .attr("fill", isDarkMode ? mainColorDark : mainColorLight)
          .style("stroke", isDarkMode ? "#555555" : "#888888");
          
        d3.selectAll("circle.category-high, .category-high circle")
          .style("fill", isDarkMode ? highColorDark : highColorLight)
          .attr("fill", isDarkMode ? highColorDark : highColorLight)
          .style("stroke", isDarkMode ? "#555555" : "#888888");
          
        d3.selectAll("circle.category-medium, .category-medium circle")
          .style("fill", isDarkMode ? mediumColorDark : mediumColorLight)
          .attr("fill", isDarkMode ? mediumColorDark : mediumColorLight)
          .style("stroke", isDarkMode ? "#555555" : "#888888");
          
        d3.selectAll("circle.category-low, .category-low circle")
          .style("fill", isDarkMode ? lowColorDark : lowColorLight)
          .attr("fill", isDarkMode ? lowColorDark : lowColorLight)
          .style("stroke", isDarkMode ? "#555555" : "#888888");
          
        d3.selectAll("circle.category-unknown, .category-unknown circle")
          .style("fill", isDarkMode ? unknownColorDark : unknownColorLight)
          .attr("fill", isDarkMode ? unknownColorDark : unknownColorLight)
          .style("stroke", isDarkMode ? "#555555" : "#888888");
          
        // Update text elements
        d3.selectAll(".node-label-bg")
          .style("fill", isDarkMode ? "rgba(20, 20, 20, 0.9)" : "rgba(0, 0, 0, 0.7)");
          
        d3.selectAll(".node text")
          .style("fill", isDarkMode ? "#f0f0f0" : "white");
          
        // Update container
        const mapContainer = document.querySelector(".map-container");
        if (mapContainer) {
            mapContainer.style.backgroundColor = isDarkMode ? '#121212' : 'white';
            mapContainer.style.borderColor = isDarkMode ? '#333333' : '#ddd';
        }
    }
}

// Add a dedicated function for setting up theme switcher events
/**
 * Sets up event handlers for theme switching buttons.
 * 
 * This function attaches click event listeners to theme toggle buttons in the UI,
 * ensuring that theme changes are properly detected and applied to the visualization.
 */
function setupThemeSwitcherEvents() {
    console.log("Setting up theme switcher events");
    
    // Add click event listeners to theme toggle buttons
    document.querySelectorAll('a, button').forEach(el => {
        if (el.textContent.includes('Switch to Dark Mode') || 
            el.textContent.includes('Switch to Light Mode')) {
            
            // Remove any existing click event to avoid duplicates
            el.removeEventListener('click', themeSwitchHandler);
            
            // Add the event listener
            el.addEventListener('click', themeSwitchHandler);
            console.log("Added theme switch handler to element:", el.textContent);
        }
    });
}

// Handler for theme switching clicks
/**
 * Handles theme switch button click events.
 * 
 * This event handler function toggles the theme state when a theme switch button
 * is clicked and triggers an immediate update of the visualization to reflect
 * the new theme.
 * 
 * @param {Event} event - The click event object
 */
function themeSwitchHandler(event) {
    console.log("Theme switch button clicked");
    
    // Toggle our theme tracker variables
    forceDarkMode = !forceDarkMode;
    currentThemeIsDark = !currentThemeIsDark;
    
    console.log("Theme switched to:", currentThemeIsDark ? "dark" : "light");
    
    // Force immediate update to our visualization without waiting for app theme changes
    setTimeout(() => {
        updateCurrentVisualization();
    }, 50);
}

// Function to update current visualization based on theme change
/**
 * Updates the current visualization based on theme changes.
 * 
 * This function refreshes the current visualization to reflect theme changes.
 * It determines the current view (overview or specific drug) and reloads
 * the appropriate visualization while preserving the current state.
 */
function updateCurrentVisualization() {
    console.log("Updating current visualization for theme change");
    
    // Get the current drug selection
    const drugSelect = document.getElementById('drugSelect');
    if (!drugSelect) return;
    
    const currentSelection = drugSelect.value;
    
    // Update based on current view
    if (!currentSelection) {
        // Overview mode - refresh network graph
        if (cachedInteractionData && Object.keys(cachedInteractionData).length > 1) {
            console.log("Refreshing network graph with cached data");
            generateNetworkGraph(cachedInteractionData);
        } else {
            console.log("No cached data, reloading full relationship graph");
            loadFullRelationshipGraph();
        }
    } else {
        // Drug specific view - refresh drug interaction map
        if (cachedNodeData[currentSelection]) {
            console.log("Refreshing drug interaction map with cached data");
            createBubbleMap(currentSelection, cachedNodeData[currentSelection].interactionIds);
        } else {
            console.log("No cached data for drug, forcing refresh");
            lastUsedDrugId = null; // Force refresh
            updateInteractionMap();
        }
    }
    
    // Also directly apply colors to all existing nodes 
    applyColorsToExistingNodes();
}

// Function to apply colors directly to all existing nodes
/**
 * Applies theme-specific colors to existing visualization elements.
 * 
 * This function directly modifies the DOM to apply appropriate colors to
 * all visualization elements based on the current theme. It updates backgrounds,
 * node colors, link colors, and text elements without redrawing the graph.
 */
function applyColorsToExistingNodes() {
    console.log("Directly applying colors to existing nodes, dark mode:", currentThemeIsDark);
    
    // ABSOLUTE HARDCODED COLORS - No variables, no lookup tables
    const mainColorDark = "#8021B0";
    const highColorDark = "#c13c38";
    const mediumColorDark = "#e09c40";
    const lowColorDark = "#49a2bc";
    const unknownColorDark = "#666666";
    
    const mainColorLight = "#9932CC";
    const highColorLight = "#d9534f";
    const mediumColorLight = "#f0ad4e";
    const lowColorLight = "#5bc0de";
    const unknownColorLight = "#777777";
    
    // Apply background colors
    const svgElement = document.getElementById('bubbleMap');
    if (svgElement) {
        const bgColor = currentThemeIsDark ? '#121212' : 'white';
        svgElement.style.backgroundColor = bgColor;
        svgElement.style.setProperty('background-color', bgColor, 'important');
        svgElement.setAttribute('fill', bgColor);
        
        // Also set the background rect if it exists
        const bgRect = svgElement.querySelector('.svg-background');
        if (bgRect) {
            bgRect.setAttribute('fill', bgColor);
        }
    }
    
    const container = document.querySelector('.map-container');
    if (container) {
        container.style.backgroundColor = currentThemeIsDark ? '#121212' : 'white';
        container.style.setProperty('background-color', currentThemeIsDark ? '#121212' : 'white', 'important');
        container.style.borderColor = currentThemeIsDark ? '#333333' : '#ddd';
    }
    
    // Update all circle elements with the appropriate colors
    const circles = document.querySelectorAll('#bubbleMap circle');
    circles.forEach(circle => {
        // Determine the category from classes
        let category = "unknown";
        if (circle.classList.contains('category-main') || 
            circle.parentElement && circle.parentElement.classList.contains('category-main')) {
            category = "main";
        } else if (circle.classList.contains('category-high') || 
                  circle.parentElement && circle.parentElement.classList.contains('category-high')) {
            category = "high";
        } else if (circle.classList.contains('category-medium') || 
                  circle.parentElement && circle.parentElement.classList.contains('category-medium')) {
            category = "medium";
        } else if (circle.classList.contains('category-low') || 
                  circle.parentElement && circle.parentElement.classList.contains('category-low')) {
            category = "low";
        }
        
        // Apply the appropriate color based on category and theme
        let fillColor;
        if (currentThemeIsDark) {
            if (category === "main") fillColor = mainColorDark;
            else if (category === "high") fillColor = highColorDark;
            else if (category === "medium") fillColor = mediumColorDark;
            else if (category === "low") fillColor = lowColorDark;
            else fillColor = unknownColorDark;
        } else {
            if (category === "main") fillColor = mainColorLight;
            else if (category === "high") fillColor = highColorLight;
            else if (category === "medium") fillColor = mediumColorLight;
            else if (category === "low") fillColor = lowColorLight;
            else fillColor = unknownColorLight;
        }
        
        // Apply the color directly to the circle element
        circle.setAttribute('fill', fillColor);
        circle.style.fill = fillColor;
        circle.style.setProperty('fill', fillColor, 'important');
        circle.setAttribute('stroke', currentThemeIsDark ? "#555555" : "#888888");
    });
    
    // Update link colors
    const links = document.querySelectorAll('#bubbleMap line.link');
    links.forEach(link => {
        link.setAttribute('stroke', currentThemeIsDark ? "#444444" : "#cccccc");
        link.style.stroke = currentThemeIsDark ? "#444444" : "#cccccc";
    });
    
    // Update text backgrounds
    const textBgs = document.querySelectorAll('#bubbleMap .node-label-bg');
    textBgs.forEach(bg => {
        bg.setAttribute('fill', currentThemeIsDark ? "rgba(20, 20, 20, 0.9)" : "rgba(0, 0, 0, 0.7)");
    });
    
    // Update text colors
    const texts = document.querySelectorAll('#bubbleMap .node text');
    texts.forEach(text => {
        text.setAttribute('fill', currentThemeIsDark ? "#f0f0f0" : "white");
    });
    
    console.log("Direct color application complete");
}