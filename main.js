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
async function refreshDashboard(bias) {
    let combinedData = [];
    const ribbon = document.getElementById('stockRibbon');
    
    // 1. Loading Indicator
    ribbon.innerHTML = '<span style="color:blue; padding: 0 20px;">Connecting to Market Data...</span>';

    for (const source of SOURCES) {
        try {
            // STRATEGY CHANGE: Use a more stable CORS proxy (corsproxy.io)
            // This proxy returns the RAW CSV text directly, not JSON.
            const targetUrl = `${source.url}&t=${new Date().getTime()}`; // Prevent caching
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            // IMPORTANT: With this proxy, we get text() directly, not json()
            const csvText = await response.text(); 

            // Check if we actually got a CSV or an HTML error page
            if (csvText.trim().startsWith("<!DOCTYPE") || csvText.includes("Oops")) {
                throw new Error("Proxy returned an error page instead of data.");
            }

          // To this more flexible line:
             const rows = csvText.split(/\r?\n/).map(row => {
        // Automatically detect if the row uses commas or semicolons
           const delimiter = row.includes(';') ? ';' : ',';
           return row.split(delimiter);
           });

            if (rows.length < 2) continue; 

            // --- AUTO-DETECT COLUMNS (Same Logic as before) ---
            const headers = rows[0].map(h => h.toLowerCase().replace(/"/g, '').trim());
            
            let symbolIdx = headers.findIndex(h => h.includes('symbol') || h.includes('ticker'));
            let priceIdx = headers.findIndex(h => h.includes('price') || h.includes('close') || h.includes('ltp'));
            let changeIdx = headers.findIndex(h => h.includes('change') || h.includes('chg'));

            // Fallbacks for your specific sheets
            if (symbolIdx === -1) symbolIdx = (source.currency === "₹") ? 0 : 3; 
            if (priceIdx === -1) priceIdx = 4;
            if (changeIdx === -1) changeIdx = 5;

            const formattedRows = rows.slice(1).map(row => {
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
            // Don't stop the loop; try the next source even if one fails
        }
    }

    renderRibbon(combinedData, bias);
}
// 2. RIBBON RENDER FUNCTION
function renderRibbon(data, bias) {
    const ribbon = document.getElementById('stockRibbon');
    
    if (!data || data.length === 0) {
        ribbon.innerHTML = '<span style="color:red; padding:20px;">No data found. Check CSV column headers.</span>';
        return;
    }

    let html = "";
    data.forEach(item => {
        const isDown = item.change && item.change.includes('-');
        const trendColor = isDown ? '#ff4d4d' : '#2ecc71';
        // Adding explicit inline styles to ensure visibility
        html += `
            <span class="stock-item" style="display: inline-block; margin-right: 50px; color: black !important; font-weight: bold; font-family: sans-serif;">
                ${item.symbol}: ${item.currency}${item.close} 
                <span style="color: ${trendColor} !important;">(${item.change})</span>
            </span>`;
    });

    ribbon.innerHTML = html;
    console.log("Ribbon HTML populated with", data.length, "items.");
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


