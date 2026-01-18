// main.js - FinWise Master Dashboard (Currency & Strategy Integrated)
import { db, auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 1. DATA SOURCES ---
const SOURCES = [
    {
        url: "https://docs.google.com/spreadsheets/d/1W4G9JNnxBMCBOg5c42j1_8AthrTT9wfLIHGkYP5uqxs/export?format=csv&gid=0",
        currency: "₹" // Indian Market Sheet
    },
    {
        url: "https://docs.google.com/spreadsheets/d/1Pbv4FY0VHNt59hAPCvI5Md4_93rNUnJISlrNljyr2Zs/export?format=csv&gid=1283683778",
        currency: "$" // US Market / S&P 500 Sheet
    }
];

// --- 2. THE BRAIN: Real-time Profile Listener ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        onSnapshot(doc(db, "users", user.uid), (doc) => {
            const data = doc.data();
            const currentBias = data?.bias || 'Default';
            document.getElementById('currentBiasHeader').innerText = `Strategy: ${currentBias}`;
            refreshDashboard(currentBias);
        });
    } else {
        window.location.href = "https://anusin1805.github.io/F11EcosystemSubs-login/";
    }
});

// --- 3. THE ENGINE: Data Fetcher ---
async function refreshDashboard(bias) {
    let combinedData = [];

    for (const source of SOURCES) {
        try {
            const response = await fetch(source.url);
            const csvText = await response.text();
            const rows = csvText.split('\n').map(row => row.split(','));
            
            // Map the rows and attach the correct currency symbol
            const formattedRows = rows.slice(1).map(row => ({
                symbol: row[3]?.trim(),       // Ticker Symbol
                close: row[8]?.trim(),        // Close Column (Index 8)
                change: row[12]?.trim(),      // % Change Column (Index 12)
                currency: source.currency
            }));
            
            combinedData = combinedData.concat(formattedRows);
        } catch (e) {
            console.error("Fetch error for source:", source.currency, e);
        }
    }
    renderRibbon(combinedData, bias);
}

// --- 4. THE UI: Strategy-Based Filter ---
function renderRibbon(data, bias) {
    let html = "";
    
    // Define which tickers show up for which Behavioral Profile
    const strategies = {
        'Loss Aversion': ['RELIANCE', 'TCS', 'AAPL', 'MSFT', 'GOLD'], // "Fortress" Blue Chips
        'Self-Attribution': ['ZOMATO', 'ADANIGREEN', 'TSLA', 'NVDA', 'BTC'], // "Growth" Aggressive
        'Default': ['RELIANCE', 'AAPL', 'GOOGL', 'TCS', 'INFY', 'AMZN']
    };

    const targetTickers = strategies[bias] || strategies['Default'];

    data.forEach(item => {
        if (item.symbol && targetTickers.includes(item.symbol)) {
            const isDown = item.change && item.change.includes('-');
            const trendColor = isDown ? '#ff4d4d' : '#2ecc71';

            html += `
                <span class="stock-item" style="margin-right: 45px; font-weight: 700;">
                    ${item.symbol}: 
                    <span style="color: #222;">${item.currency}${item.close}</span> 
                    <span style="color: ${trendColor}; font-size: 0.85em; margin-left: 4px;">
                        (${item.change})
                    </span>
                </span>`;
        }
    });

    document.getElementById('stockRibbon').innerHTML = html || "Updating Market Strategy...";
}

// --- 5. NAVIGATION & COMMUNICATION ---
window.loadApp = (page) => {
    const apps = {
        'profile': 'https://anusin1805.github.io/F11FinWiseBehaviorFinanceProfiling/',
        'market': 'https://reinvestmentpoint-ms7xuznw25ojwy4zgw2sxk.streamlit.app/',
        'chat': 'https://vc-chat-box.onrender.com/'
    };
    document.getElementById('view').src = apps[page];
};

// Listener for the Behavioral Wheel "Spin" result
window.addEventListener('message', (event) => {
    if (event.data.type === 'BIAS_DETECTED') {
        refreshDashboard(event.data.value);
    }
});
