const express = require('express');
const bodyParser = require('body-parser');
const StellarSdk = require('stellar-sdk');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

app.post('/create-account', async (req, res) => {
    try {
        const pair = StellarSdk.Keypair.random();
        const response = await fetch(
            `https://friendbot.stellar.org?addr=${encodeURIComponent(pair.publicKey())}`
        );
        res.json({ publicKey: pair.publicKey(), secretKey: pair.secret() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/balance/:publicKey', async (req, res) => {
    try {
        const account = await server.loadAccount(req.params.publicKey);
        const balance = account.balances.find(b => b.asset_type === 'native').balance;
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/send', async (req, res) => {
    try {
        const { sourceSecret, destination, amount } = req.body;
        const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
        const sourcePublicKey = sourceKeypair.publicKey();

        const account = await server.loadAccount(sourcePublicKey);
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET
        })
            .addOperation(StellarSdk.Operation.payment({
                destination: destination,
                asset: StellarSdk.Asset.native(),
                amount: amount.toString()
            }))
            .setTimeout(30)
            .build();

        transaction.sign(sourceKeypair);
        const result = await server.submitTransaction(transaction);
        res.json({ success: true, transactionHash: result.hash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));