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

async function refreshDashboard(bias) {
    let combinedData = [];
    const ribbonContainer = document.getElementById('stockRibbon');

    for (const source of SOURCES) {
        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            const csvText = data.contents; 

            // Split by lines and handle potential carriage returns (\r)
            const rows = csvText.split(/\r?\n/).map(row => row.split(','));
            
            const formattedRows = rows.slice(1).map(row => ({
                symbol: row[3]?.replace(/"/g, '').trim(), 
                close: row[8]?.replace(/"/g, '').trim(), 
                change: row[12]?.replace(/"/g, '').trim(), 
                currency: source.currency
            })).filter(item => item.symbol && item.symbol !== ""); 

            combinedData = combinedData.concat(formattedRows);
        } catch (e) {
            console.error(`Error fetching ${source.currency} data:`, e);
        }
    }
    
    // Pass the combined ₹ and $ data to be displayed
    renderRibbon(combinedData, bias);
}

function renderRibbon(data, bias) {
    let html = "";
    const strategies = {
        'Loss Aversion': ['RELIANCE', 'TCS', 'AAPL', 'MSFT', 'GOLD'],
        'Self-Attribution': ['ZOMATO', 'ADANIGREEN', 'TSLA', 'NVDA', 'BTC'],
        'Default': ['RELIANCE', 'AAPL', 'GOOGL', 'TCS', 'INFY', 'AMZN', 'MSFT']
    };

    const targetTickers = strategies[bias] || strategies['Default'];
    const filtered = data.filter(item => 
    targetTickers.map(t => t.toUpperCase()).includes(item.symbol?.toUpperCase()));
    
    if (filtered.length === 0) {
        html = "<span>No tickers found for strategy: " + bias + "</span>";
    } else {
        filtered.forEach(item => {
            const isDown = item.change && item.change.includes('-');
            const trendColor = isDown ? '#ff4d4d' : '#2ecc71';
            html += `
                <span class="stock-item">
                    ${item.symbol}: ${item.currency}${item.close} 
                    <span style="color: ${trendColor}; font-size: 0.9em;">(${item.change})</span>
                </span>`;
        });
    }

    document.getElementById('stockRibbon').innerHTML = html;
}

// Initial Call
onAuthStateChanged(auth, (user) => {
    if (user) {
        onSnapshot(doc(db, "users", user.uid), (doc) => {
            const currentBias = doc.data()?.bias || 'Default';
            document.getElementById('currentBiasHeader').innerText = `Strategy: ${currentBias}`;
            refreshDashboard(currentBias);
        });
    }
});

window.loadApp = (page) => {
    const apps = {
        'profile': 'https://anusin1805.github.io/F11FinWiseBehaviorFinanceProfiling/',
        'market': 'https://reinvestmentpoint-ms7xuznw25ojwy4zgw2sxk.streamlit.app/',
        'chat': 'https://vc-chat-box.onrender.com/'
    };
    document.getElementById('view').src = apps[page];
};
