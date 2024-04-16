require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ethers = require('ethers');
require("dotenv").config();
const ReliefFund = require('../relief-fund-frontend/artifacts/contracts/ReliefFund.sol/ReliefFund.json');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to Ethereum
const provider = new ethers.providers.JsonRpcProvider(process.env.API_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Replace with your contract's ABI and address

const contractAddress = '0x0cc2BC845c8BDeCfd771cdE51Ac9B6Ae5cE47931'; // Your contract's deployed address
const contract = new ethers.Contract(contractAddress, ReliefFund.abi, wallet);

// Example route to donate
app.post('/donate', async (req, res) => {
 try {
    const { description, amount } = req.body;
    const donationAmount = ethers.utils.parseEther(amount);
    const tx = await contract.donate(description, { value: donationAmount });
    await tx.wait();
    res.json({ message: 'Donation successful', txHash: tx.hash });
 } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to donate' });
 }
});

// Example route to withdraw funds
app.post('/withdraw', async (req, res) => {
 try {
    const { amount } = req.body;
    console.log("amount: ",amount)
    const withdrawalAmount = ethers.utils.parseEther(amount);
    console.log("WA:", withdrawalAmount)
    const tx = await contract.withdraw(withdrawalAmount);
    await tx.wait();
    res.json({ message: 'Withdrawal successful', txHash: tx.hash });
 } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to withdraw' });
 }
});

app.get("/balance", async (req, res) => {
   const contractAddress = "0x0cc2BC845c8BDeCfd771cdE51Ac9B6Ae5cE47931"; // Replace with your contract address
   const balance = await web3.eth.getBalance(contractAddress);
   res.json({ balance: web3.utils.fromWei(balance, "ether") });
 });

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
