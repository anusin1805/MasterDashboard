import { db, auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const SOURCES = [
    {
        url: "https://docs.google.com/spreadsheets/d/1W4G9JNnxBMCBOg5c42j1_8AthrTT9wfLIHGkYP5uqxs/export?format=csv&gid=0",
        currency: "₹"
    },
    {
        url: "https://docs.google.com/spreadsheets/d/1Pbv4FY0VHNt59hAPCvI5Md4_93rNUnJISlrNljyr2Zs/export?format=csv&gid=1283683778",
        currency: "$"
    }
];

// 1. DATA FETCHING FUNCTION
// REPLACE your current refreshDashboard function with this:

async function refreshDashboard(bias) {
    let combinedData = [];
    const ribbon = document.getElementById('stockRibbon');
    
    // 1. Show a loading state so you know it's working
    ribbon.innerHTML = '<span style="color:blue; padding:20px;">Fetching Market Data...</span>';

    for (const source of SOURCES) {
        try {
            // Add a timestamp to prevent caching
            const noCacheUrl = `${source.url}&t=${new Date().getTime()}`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(noCacheUrl)}`;
            
            const response = await fetch(proxyUrl);
            const json = await response.json();
            const csvText = json.contents;

            // Split rows and handle different newline formats
            const rows = csvText.split(/\r?\n/).map(row => row.split(','));

            if (rows.length < 2) continue; // Skip if empty

            // --- AUTO-DETECT COLUMNS ---
            // We search the Header Row (rows[0]) to find where the data is hiding
            const headers = rows[0].map(h => h.toLowerCase().replace(/"/g, '').trim());
            
            // Look for "Symbol", "Ticker", or just use column 0 as fallback
            let symbolIdx = headers.findIndex(h => h.includes('symbol') || h.includes('ticker') || h.includes('stock'));
            // Look for "Price", "Close", "LTP", or use column 1 as fallback
            let priceIdx = headers.findIndex(h => h.includes('price') || h.includes('close') || h.includes('ltp'));
            // Look for "Change", "CHG", or use column 2 as fallback
            let changeIdx = headers.findIndex(h => h.includes('change') || h.includes('chg'));

            // SAFETY FALLBACK: If headers are missing, try standard indexes
            if (symbolIdx === -1) symbolIdx = 0; // Assume Symbol is first
            if (priceIdx === -1) priceIdx = 4;   // Common location for price
            if (changeIdx === -1) changeIdx = 5; // Common location for change

            console.log(`Detected Columns for ${source.currency}: Symbol[${symbolIdx}], Price[${priceIdx}], Change[${changeIdx}]`);

            const formattedRows = rows.slice(1).map(row => {
                // Safe extraction
                const symbol = row[symbolIdx] ? row[symbolIdx].replace(/"/g, '').trim() : "N/A";
                const close = row[priceIdx] ? row[priceIdx].replace(/"/g, '').trim() : "0.00";
                const change = row[changeIdx] ? row[changeIdx].replace(/"/g, '').trim() : "0%";

                return {
                    symbol: symbol,
                    close: close,
                    change: change,
                    currency: source.currency
                };
            }).filter(item => item.symbol && item.symbol !== "N/A" && item.symbol.length > 1);

            combinedData = combinedData.concat(formattedRows);

        } catch (e) {
            console.error(`Error fetching ${source.currency}:`, e);
        }
    }

    renderRibbon(combinedData, bias);
}
// 2. RIBBON RENDER FUNCTION
function renderRibbon(data, bias) {
    const ribbon = document.getElementById('stockRibbon');
    
    if (data.length === 0) {
        ribbon.innerHTML = `<span style="color:red; padding: 0 20px;">Waiting for data... (Check Console F12 if stuck)</span>`;
        return;
    }

    // Showing ALL data for diagnostic purposes (Filters removed temporarily)
    let html = "";
    data.forEach(item => {
        const isDown = item.change && item.change.includes('-');
        const trendColor = isDown ? '#ff4d4d' : '#2ecc71';
        html += `
            <span class="stock-item" style="margin-right:40px; font-weight:bold; display:inline-block;">
                ${item.symbol}: ${item.currency}${item.close} 
                <span style="color: ${trendColor};">(${item.change})</span>
            </span>`;
    });

    ribbon.innerHTML = html;
}

// 3. FIX FOR "loadApp is not defined"
// Modules make functions private by default. We must attach it to 'window' to let HTML buttons use it.
window.loadApp = function(page) {
    const apps = {
        'profile': 'https://anusin1805.github.io/F11FinWiseBehaviorFinanceProfiling/',
        'market': 'https://reinvestmentpoint-ms7xuznw25ojwy4zgw2sxk.streamlit.app/',
        'chat': 'https://vc-chat-box.onrender.com/'
    };
    const frame = document.getElementById('view');
    if(frame && apps[page]) {
        frame.src = apps[page];
    } else {
        console.error("Iframe or App URL not found");
    }
};

// 4. LOGIC FLOW (Run Immediate Fetch -> Then Listen for Firebase)
// A. Force fetch immediately so ribbon isn't blank
refreshDashboard('Default');

// B. Listen for User Login & Strategy Changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User Logged In:", user.uid);
        onSnapshot(doc(db, "users", user.uid), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const currentBias = docSnapshot.data().bias || 'Default';
                const header = document.getElementById('currentBiasHeader');
                if(header) header.innerText = `Strategy: ${currentBias}`;
                
                // Refresh again with the specific user strategy
                refreshDashboard(currentBias);
            }
        });
    } else {
        console.log("No user logged in.");
    }
});
