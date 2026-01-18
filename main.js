// main.js - The Conductor logic
export function loadApp(page) {
    const view = document.getElementById('view');
    const urls = {
        profile: "https://anusin1805.github.io/F11FinWiseBehaviorFinanceProfiling/",
        market: "https://reinvestmentpoint-ms7xuznw25ojwy4zgw2sxk.streamlit.app/",
        chat: "https://vc-chat-box.onrender.com/"
    };
    view.src = urls[page];
}

// Stock Ribbon Logic from your "Subs, pay, chat" file
export function updateRibbon() {
    // Fetch logic for Google Sheets data goes here
    console.log("Updating Stock Ribbon...");
}
