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
    console.log("Fetching for Bias:", bias);

    for (const source of SOURCES) {
        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`;
            const response = await fetch(proxyUrl);
            const json = await response.json();
            const csvText = json.contents;

            const rows = csvText.split(/\r?\n/).map(row => row.split(','));
            
            // --- DIAGNOSTIC LOG (Check Console for these) ---
            if(rows.length > 1) {
                console.log(`Source ${source.currency} Headers:`, rows[0]);
                console.log(`Source ${source.currency} Row 1:`, rows[1]);
            }

            const formattedRows = rows.slice(1).map((row) => {
                // FALLBACK: If row[3] is empty, try to find the right column safely
                const ticker = row[3]?.replace(/"/g, '').trim(); 
                const price = row[8]?.replace(/"/g, '').trim(); 
                const pctChange = row[12]?.replace(/"/g, '').trim(); 

                return {
                    symbol: ticker,
                    close: price,
                    change: pctChange,
                    currency: source.currency
                };
            }).filter(item => item.symbol && item.symbol.length > 0);

            combinedData = combinedData.concat(formattedRows);
        } catch (e) {
            console.error("Fetch Error:", e);
        }
    }

    console.log("Total Items Found:", combinedData.length);
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
