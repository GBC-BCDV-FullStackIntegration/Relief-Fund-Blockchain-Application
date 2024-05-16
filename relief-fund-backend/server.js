const express = require('express');
const Web3 = require('web3');
const cors = require('cors');
require('dotenv').config()

// Contract ABI
const ReliefFundABI = require('../relief-fund-frontend/artifacts/contracts/ReliefFund.sol/ReliefFund.json');

// Initializing Express Application
const app = express();

// Enabling CORS for all origins
app.use(cors({
    origin: '*', // Allow any origin to access the server
    methods: 'GET,POST', // Allow GET and POST requests
    allowedHeaders: 'Content-Type,Authorization' // Allow specified headers
  }));

const PORT = process.env.PORT;

// Ethereum node URL
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.API_URL));

// Deployed contract address
const contractAddress = '0x6FFeDD31aDd29438A6095249B7Eb5985039be808';
const reliefFundContract = new web3.eth.Contract(ReliefFundABI.abi, contractAddress);

app.use(express.json());

// Endpoint to get the total donations
app.get('/totalDonations', async (req, res) => {
    try {
      // Call the totalDonations() of the contract
      const totalDonations = await reliefFundContract.methods.totalDonations().call();
      // Convert Wei to Ether to display at the frontend
      res.json({ totalDonations: web3.utils.fromWei(totalDonations.toString(), 'ether') });
    } catch (error) {
      console.error('Error getting total donations:', error);
      res.status(500).json({ error: 'Failed to get total donations' });
    }
  });
  
  // Endpoint to get all donations
  app.get('/donations', async (req, res) => {
    try {
      // Get the count of donations
      const donationsCount = await reliefFundContract.methods.getDonationsCount().call();
      const donations = [];
  
      // Fetch each donation and adding it to the array
      for (let i = 0; i < donationsCount; i++) {
        const donation = await reliefFundContract.methods.getDonation(i).call();
        donations.push({
          donor: donation[0],
          amount: web3.utils.fromWei(donation[1].toString(), 'ether'),
          description: donation[2],
        });
      }
  
      // Send the donations array as response
      res.json({ donations });
    } catch (error) {
      console.error('Error getting donations:', error);
      res.status(500).json({ error: 'Failed to get donations' });
    }
  });
  
// Endpoint for withdrawal
app.post('/withdraw', async (req, res) => {
    const { fromAddress } = req.body;
  
    // Get the list of available accounts
    const accounts = await web3.eth.getAccounts();
    // Set account as provided address or default to the first address
    const account = fromAddress || accounts[0];
  
    try {
      // Call the withdraw() of the contract
      const result = await reliefFundContract.methods.withdraw().send({
        from: account,
      });
  
      res.json({ transactionHash: result.transactionHash });
    } catch (error) {
      console.error('Error withdrawing:', error);
      res.status(500).json({ error: 'Failed to withdraw' });
    }
  });

// Server details
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
