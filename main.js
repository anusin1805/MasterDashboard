import { db, auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. DATA SOURCES & FETCHING
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
    const ribbon = document.getElementById('stockRibbon');
    if (ribbon) {
        ribbon.innerHTML = '<span style="color:blue; padding: 0 20px;">Fetching Latest Prices...</span>';
    }

    for (const source of SOURCES) {
        try {
            const fetchUrl = `${source.url}&cachebust=${new Date().getTime()}`;
            const response = await fetch(fetchUrl);
            let csvText = '';
            
            if (!response.ok) {
                console.warn(`Direct fetch failed for ${source.currency}, trying fallback proxy...`);
                const fallbackProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(fetchUrl)}`;
                const fallbackResponse = await fetch(fallbackProxy);
                if (!fallbackResponse.ok) throw new Error("Both direct and proxy fetch failed.");
                csvText = await fallbackResponse.text();
            } else {
                csvText = await response.text();
            }

            const rows = csvText.split(/\r?\n/).map(row => row.split(','));
            if (rows.length < 2) continue;

            const formattedRows = rows.slice(1).map(row => {
                const ticker = row[3] ? row[3].replace(/"/g, '').trim() : "";
                const price = row[8] ? row[8].replace(/"/g, '').trim() : "";
                const change = row[12] ? row[12].replace(/"/g, '').trim() : "";

                return {
                    symbol: ticker,
                    close: price,
                    change: change,
                    currency: source.currency
                };
            }).filter(item => item.symbol && item.symbol.length > 1 && item.symbol !== "Symbol"); 
            
            combinedData = combinedData.concat(formattedRows);

        } catch (e) {
            console.error(`Error for ${source.currency}:`, e);
        }
    }

    renderRibbon(combinedData, bias);
}

// 2. RIBBON RENDER FUNCTION
function renderRibbon(data, bias) {
    const ribbon = document.getElementById('stockRibbon');
    if (!ribbon) return;
    
    if (!data || data.length === 0) {
        ribbon.innerHTML = '<span style="color:red; padding:20px;">No data found. Check CSV column headers.</span>';
        return;
    }

    let html = "";
    data.forEach(item => {
        const isDown = item.change && item.change.includes('-');
        const trendColor = isDown ? '#ff4d4d' : '#2ecc71';
        html += `
            <span class="stock-item" style="display: inline-block; margin-right: 50px; color: black !important; font-weight: bold; font-family: sans-serif;">
                ${item.symbol}: ${item.currency}${item.close} 
                <span style="color: ${trendColor} !important;">(${item.change})</span>
            </span>`;
    });

    ribbon.innerHTML = html;
}

// 3. COMBINED LOAD APP ROUTER
window.loadApp = function(page, evt) {
    const viewIframe = document.getElementById('view'); 
    const appContainer = document.getElementById('app-container');

    // Visually update the active navigation button
    document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add('active');
    }

    const apps = {
        'F11Grow': 'https://anusin1805.github.io/F11Grow/',
        'profile': 'https://anusin1805.github.io/F11FinWiseBehaviorFinanceProfiling/',
        'market': 'https://reinvestmentpoint-ms7xuznw25ojwy4zgw2sxk.streamlit.app/?embed=true&embed_options=light_theme',
        'chat': 'https://vc-chat-box.onrender.com/',
        'India Bot': 'https://anusin1805.github.io/FinanceF11IndiaBot/',
        'US Bot': 'https://anusin1805.github.io/financeF11bot/',
        'F11Crypto': 'https://anusin1805.github.io/F11Crypto/',
        'subs': 'https://finwise-3.onrender.com',
        'F11FormBiases': 'https://anusin1805.github.io/F11LearnInvestmentProfiling/',
        'F11IdeaSupport': 'https://design2pptx-5.onrender.com/',
        'PortfolioDownload': 'https://f11portfoliowheelbiasesdriven-1.onrender.com/',
        'F11Prediction': 'https://anusin1805.github.io/F11-prediction-simulation/',
        'F11LiveMode': 'https://anusin1805.github.io/F11LiveMarketOrder/',
        'F11LiveOrder': 'https://anusin1805.github.io/F11LiveMarketOrder/',
        'F11FitnessForest': 'https://www.canva.com/design/DAGyFY29QTo/OLieFO6XQxwMzrwqjTN-bQ/view?embed',
        'SignIn': 'https://anusin1805.github.io/F11DashboardLogin/'
    };

    if (page === 'Portfolio') {
        // Hide iframe and show Supabase Container for Custom Portfolio logic
        if (viewIframe) viewIframe.style.display = 'none';
        if (appContainer) {
            appContainer.style.display = 'block';
            appContainer.innerHTML = '<h2>Loading your Supabase Portfolio...</h2>';
        }
    } else if (apps[page]) {
        // Show iframe and route to requested application URL
        if (appContainer) appContainer.style.display = 'none';
        if (viewIframe) {
            viewIframe.style.display = 'block';
            viewIframe.src = apps[page];
        }
    } else {
        if (viewIframe) viewIframe.style.display = 'none';
        if (appContainer) {
            appContainer.style.display = 'block';
            appContainer.innerHTML = `<h3>${page} module coming soon.</h3>`;
        }
    }
};

// 4. AUTHENTICATION & INITIALIZATION LOGIC
refreshDashboard('Default');

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User Logged In:", user.uid);
        onSnapshot(doc(db, "users", user.uid), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const currentBias = docSnapshot.data().bias || 'Default';
                const header = document.getElementById('currentBiasHeader');
                if (header) header.innerText = `Strategy: ${currentBias}`;
                
                refreshDashboard(currentBias);
            }
        });
    } else {
        console.log("No user logged in.");
    }
});
