let publicKey = '';
let secretKey = '';

async function createAccount() {
    const response = await fetch('/create-account', { method: 'POST' });
    const data = await response.json();
    publicKey = data.publicKey;
    secretKey = data.secretKey;
    document.getElementById('public-key').textContent = publicKey;
    document.getElementById('secret-key').textContent = secretKey;
    await checkBalance();
}

async function checkBalance() {
    if (!publicKey) {
        alert('Please create an account first');
        return;
    }
    const response = await fetch(`/balance/${publicKey}`);
    const data = await response.json();
    document.getElementById('balance').textContent = data.balance;
}

async function sendPayment() {
    const destination = document.getElementById('destination').value;
    const amount = document.getElementById('amount').value;
    if (!secretKey || !destination || !amount) {
        alert('Please fill in all fields');
        return;
    }
    const response = await fetch('/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceSecret: secretKey, destination, amount })
    });
    const data = await response.json();
    if (data.success) {
        alert(`Payment sent successfully! Transaction hash: ${data.transactionHash}`);
        await checkBalance();
    } else {
        alert(`Error: ${data.error}`);
    }
}