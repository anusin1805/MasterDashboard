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
    console.log("Fetching for Bias:", bias);

    for (const source of SOURCES) {
        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`;
            const response = await fetch(proxyUrl);
            const json = await response.json();
            const csvText = json.contents;

            const rows = csvText.split(/\r?\n/).map(row => row.split(','));
            
            // --- DIAGNOSTIC LOG ---
            console.log(`Source ${source.currency} Row 1 (Headers):`, rows[0]);
            console.log(`Source ${source.currency} Row 2 (First Data):`, rows[1]);

            const formattedRows = rows.slice(1).map((row, index) => {
                // If your columns shifted, row[3] might be the wrong data.
                // We are looking for the column containing "RELIANCE", "AAPL", etc.
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
    
    console.log("Combined Data Array:", combinedData);
    renderRibbon(combinedData, bias);
}

function renderRibbon(data, bias) {
    const ribbon = document.getElementById('stockRibbon');
    
    if (data.length === 0) {
        ribbon.innerHTML = `<span style="color:red;">Error: No data parsed. Check Column Indexes.</span>`;
        return;
    }

    // REMOVE FILTERING TEMPORARILY: Show everything to prove connection
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
