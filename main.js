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
    
    ribbon.innerHTML = '<span style="color:blue; padding: 0 20px;">Fetching Latest Prices...</span>';

    for (const source of SOURCES) {
        try {
            // DIRECT FETCH: We add a cache-buster at the end
            const fetchUrl = `${source.url}&cachebust=${new Date().getTime()}`;
            
            const response = await fetch(fetchUrl);
            
            if (!response.ok) {
                // If direct fetch fails, fallback to a secondary proxy
                console.warn(`Direct fetch failed for ${source.currency}, trying fallback proxy...`);
                const fallbackProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(fetchUrl)}`;
                const fallbackResponse = await fetch(fallbackProxy);
                if (!fallbackResponse.ok) throw new Error("Both direct and proxy fetch failed.");
                var csvText = await fallbackResponse.text();
            } else {
                var csvText = await response.text();
            }

            // Split by rows and then by commas
            const rows = csvText.split(/\r?\n/).map(row => row.split(','));
            if (rows.length < 2) continue;

            // Using your exact spreadsheet indices from the image
            const formattedRows = rows.slice(1).map(row => {
         // We use your exact indices from the spreadsheet image
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
            // The last check ensures we don't accidentally include header text
            
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
// Ensure this is OUTSIDE any other functions at the top level of main.js

window.loadApp = function(page) {
    const apps = {
        'F11Grow': 'https://f11grow.onrender.com/',
        'profile': 'https://anusin1805.github.io/F11FinWiseBehaviorFinanceProfiling/',
        'Portfolio': 'https://anusin1805.github.io/F11BehaviourFinanceWheelTest/',
        'market': 'https://reinvestmentpoint-ms7xuznw25ojwy4zgw2sxk.streamlit.app/',
        'chat': 'https://vc-chat-box.onrender.com/', // Added missing comma
        'India Bot': 'https://anusin1805.github.io/FinanceF11IndiaBot/', // Added missing comma
        'US Bot': 'https://anusin1805.github.io/financeF11bot/', // Added missing comma
        'subs': 'https://anusin1805.github.io/SubscribeF11Service/',
        'F11FormBiases': 'https://anusin1805.github.io/F11LearnInvestmentProfiling/',
        'F11IdeaSupport': 'https://design2pptx-5.onrender.com/',
        'PortfolioDownload': 'https://f11portfoliowheelbiasesdriven-1.onrender.com/',
        'F11FitnessForest': 'https://www.canva.com/design/DAGyFY29QTo/oDjDY4VlhUB7uFqy9Rux2w/view?utm_content=DAGyFY29QTo&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hf284e4da97/',
        'SignIn': 'https://anusin1805.github.io/F11DashboardLogin/'
    };
    
    const iframe = document.getElementById('view'); 
    if (iframe && apps[page]) {
        iframe.src = apps[page];
    } else {
        console.error("App or iframe not found for:", page);
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
