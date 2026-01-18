// main.js - The logic for your Dashboard and Stock Ribbon
import { db, auth } from './firebase-config.js';
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. THE BRAIN: Real-time Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Listen for changes to this user's profile in real-time
        onSnapshot(doc(db, "users", user.uid), (doc) => {
            const data = doc.data();
            if (data) {
                console.log("Profile Update Detected:", data);
                
                // IF user just spun the wheel, update the UI
                if (data.bias) {
                    updateRibbonForBias(data.bias);
                    document.getElementById('currentBiasHeader').innerText = `Strategy: ${data.bias}`;
                }
                
                // IF user just paid, unlock the Market Dashboard
                if (data.subscriptionActive) {
                    enablePremiumFeatures();
                }
            }
        });
    }
});


        async function updateStockRibbon() {
    // The CSV Export URL for your specific Google Sheet
    const sheetUrl = "https://docs.google.com/spreadsheets/d/1W4G9JNnxBMCBOg5c42j1_8AthrTT9wfLIHGkYP5uqxs/export?format=csv&gid=0";

    try {
        const response = await fetch(sheetUrl);
        const csvText = await response.text();
        
        // Convert CSV text into rows
        const rows = csvText.split('\n').map(row => row.split(','));
        
        // Assuming: Column A is Name (0), Column B is Price (1), Column C is Change (2)
        // We skip the header (rows[0]) and start from row 1
        let ribbonHTML = "";
        
        for (let i = 1; i < rows.length; i++) {
            const name = rows[i][0];
            const price = rows[i][1];
            const change = rows[i][2] || "0%";

            if (name && price) {
                const color = change.includes('-') ? 'red' : 'green';
                ribbonHTML += `
                    <span style="margin-right: 40px; font-weight: bold;">
                        ${name}: <span style="color: black;">₹${price}</span> 
                        <span style="color: ${color}; font-size: 0.8em;">(${change})</span>
                    </span>`;
            }
        }

        $('#stockRibbon').html(ribbonHTML);
    } catch (error) {
        console.error("Error fetching sheet data:", error);
        $('#stockRibbon').html("Market Data Temporarily Unavailable");
    }
}

// 2. THE REACTION: Dynamic Stock Ribbon
function updateRibbonForBias(bias) {
    let specificStocks = [];
    
    // Logic to change ribbon content based on behavioral profile
    if (bias === 'Loss Aversion') {
        specificStocks = ['GOLD', 'RELIANCE', 'LIQUIDBEES']; // "Fortress" assets
    } else if (bias === 'Self-Attribution') {
        specificStocks = ['ZOMATO', 'ADANIGREEN', 'BTC']; // "Growth" assets
    }
    
    renderRibbon(specificStocks); // Call your existing ribbon drawing function
}

$(document).ready(function () {
    updateStockRibbon();
    // Update stock prices every 60 seconds
    setInterval(updateStockRibbon, 60000);
});

// App Switcher Logic for the Iframe
window.loadApp = function(pageName) {
    const viewport = document.getElementById('view');
    const apps = {
        'profile': 'https://anusin1805.github.io/F11FinWiseBehaviorFinanceProfiling/',
        'market': 'https://reinvestmentpoint-ms7xuznw25ojwy4zgw2sxk.streamlit.app/',
        'impact': 'https://anusin1805.github.io/financeF11bot/',
        'chat': 'https://vc-chat-box.onrender.com/'
    };
    viewport.src = apps[pageName];
}

// Stock Ribbon Logic from your snippet
function updateStockRibbon() {
    const stockSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];
    $('#stockRibbon').empty();

    stockSymbols.forEach(symbol => {
        // Using a proxy to avoid CORS errors when fetching from Google Finance
        const proxy = "https://api.allorigins.win/get?url=";
        const target = encodeURIComponent(`https://www.google.com/finance/quote/${symbol}:NSE`);

        $.getJSON(proxy + target, function (data) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/html');
            
            // This selector matches the current Google Finance price class
            const price = $(doc).find('.YMl94b').first().text(); 

            const stockDiv = $('<div>')
                .addClass('stock-item')
                .html(`<strong>${symbol}</strong>: ${price}`)
                .css({'display': 'inline-block', 'padding': '0 20px', 'font-size': '1.2rem'});

            $('#stockRibbon').append(stockDiv);
        });
    });
}

// Listen for "shouts" from the sub-apps in the iframes
window.addEventListener('message', (event) => {
    if (event.data.type === 'BIAS_DETECTED') {
        alert("Dashboard received your profile! Updating your stocks...");
        // Directly trigger the ribbon update without waiting for a database refresh
        updateRibbonForBias(event.data.value);
    }
});
