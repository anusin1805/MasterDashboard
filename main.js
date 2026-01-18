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
