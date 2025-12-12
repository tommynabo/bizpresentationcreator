// Check authentication on load
async function checkAuth() {
    try {
        const res = await fetch('/api/check-auth');
        const data = await res.json();
        const authBanner = document.getElementById('authBanner');

        if (data.authenticated) {
            authBanner.classList.add('hidden');
        } else {
            authBanner.classList.remove('hidden');
        }
    } catch (e) {
        console.error(e);
    }
}

// Poll for auth parameter
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('auth') === 'success') {
    window.location.href = '/'; // clear query param
} else {
    checkAuth();
}

document.getElementById('generatorForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = document.getElementById('generatorForm');
    const loadingState = document.getElementById('loadingState');
    const resultState = document.getElementById('resultState');
    const submitBtn = document.getElementById('submitBtn');
    const loadingText = document.getElementById('loadingText');

    const conversation = document.getElementById('conversation').value;
    const linkedinUrl = document.getElementById('linkedinUrl').value;

    // UI Updates
    form.classList.add('hidden');
    loadingState.classList.remove('hidden');

    const steps = [
        "Analyzing LinkedIn Profile...",
        "Scraping Company Website...",
        "Cleaning Conversation Data...",
        "Generating Strategic Content...",
        "Building Google Slides Deck..."
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
        if (stepIndex < steps.length) {
            loadingText.textContent = steps[stepIndex];
            stepIndex++;
        }
    }, 3000);

    try {
        const response = await fetch('/api/generate-presentation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation, linkedinUrl })
        });

        const data = await response.json();

        clearInterval(interval);
        loadingState.classList.add('hidden');

        if (data.success) {
            resultState.classList.remove('hidden');
            document.getElementById('presentationLink').href = data.presentationUrl || '#';
        } else {
            if (response.status === 401) {
                alert("Please connect Google Account first!");
                // Optionally redirect to /auth/google
                window.location.href = '/auth/google';
            } else {
                alert('Error: ' + data.error);
                form.classList.remove('hidden');
            }
        }

    } catch (error) {
        clearInterval(interval);
        loadingState.classList.add('hidden');
        form.classList.remove('hidden');
        alert('An unexpected error occurred.');
        console.error(error);
    }
});
