const express = require('express');
const Web3 = require('web3');
const cors = require('cors');
require('dotenv').config()
const ReliefFundABI = require('../relief-fund-frontend/artifacts/contracts/ReliefFund.sol/ReliefFund.json');

const app = express();
app.use(cors({
    origin: '*', // Allow any origin to access the server
    methods: 'GET,POST', // Allow GET and POST requests
    allowedHeaders: 'Content-Type,Authorization' // Allow specified headers
  }));
const PORT = process.env.PORT;

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.API_URL)); // Update with your Ethereum node URL
const contractAddress = '0x6FFeDD31aDd29438A6095249B7Eb5985039be808'; // Update with your deployed contract address
const reliefFundContract = new web3.eth.Contract(ReliefFundABI.abi, contractAddress);

app.use(express.json());

app.get('/totalDonations', async (req, res) => {
    try {
      const totalDonations = await reliefFundContract.methods.totalDonations().call();
      res.json({ totalDonations: web3.utils.fromWei(totalDonations.toString(), 'ether') });
      
    } catch (error) {
      console.error('Error getting total donations:', error);
      res.status(500).json({ error: 'Failed to get total donations' });
    }
  });
  
  app.get('/donations', async (req, res) => {
    try {
      const donationsCount = await reliefFundContract.methods.getDonationsCount().call();
      const donations = [];
  
      for (let i = 0; i < donationsCount; i++) {
        const donation = await reliefFundContract.methods.getDonation(i).call();
        donations.push({
          donor: donation[0],
          amount: web3.utils.fromWei(donation[1].toString(), 'ether'),
          description: donation[2],
        });
      }
  
      res.json({ donations });
    } catch (error) {
      console.error('Error getting donations:', error);
      res.status(500).json({ error: 'Failed to get donations' });
    }
  });
  

app.post('/withdraw', async (req, res) => {
    const { fromAddress } = req.body;
  
    const accounts = await web3.eth.getAccounts();
    const account = fromAddress || accounts[0];
  
    try {
      const result = await reliefFundContract.methods.withdraw().send({
        from: account,
      });
  
      res.json({ transactionHash: result.transactionHash });
    } catch (error) {
      console.error('Error withdrawing:', error);
      res.status(500).json({ error: 'Failed to withdraw' });
    }
  });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
