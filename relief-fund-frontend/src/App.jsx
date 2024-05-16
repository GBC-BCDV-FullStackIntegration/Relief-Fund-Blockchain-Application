import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { ethers } from "ethers";
import ReliefFundABI from "../artifacts/contracts/ReliefFund.sol/ReliefFund.json";

// Material UI components
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

function App() {
  // State variables
  const [account, setAccount] = useState(""); // Connected MetaMask account
  const [amount, setAmount] = useState(""); // Amount to donate
  const [description, setDescription] = useState(""); // Description of the donation
  const [totalDonations, setTotalDonations] = useState(0); // Total donations in ETH
  const [donations, setDonations] = useState([]); // List of donations
  const [provider, setProvider] = useState(null); // Ethereum provider

  // Deployed ReliefFund contract address
  const reliefFundAddress = "0x6FFeDD31aDd29438A6095249B7Eb5985039be808";

  // Effect hook to initialize Ethereum provider and listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      window.ethereum.on("accountsChanged", async () => {
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        fetchTotalDonations();
        fetchDonations();
      });
    }
  }, []);

  // Function to fetch total donations from the backend
  const fetchTotalDonations = async () => {
    try {
      const response = await axios.get("http://localhost:3001/totalDonations");
      setTotalDonations(response.data.totalDonations);
    } catch (error) {
      console.error("Error fetching total donations:", error);
    }
  };

  // Function to fetch all donations from the backend
  const fetchDonations = async () => {
    try {
      const response = await axios.get("http://localhost:3001/donations");
      setDonations(response.data.donations);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  };

  // Function to connect MetaMask wallet
  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        fetchTotalDonations(); // Fetch total donations
        fetchDonations(); // Fetch all donations details
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
      }
    } else {
      console.error("MetaMask not detected");
    }
  };

  // Function to donate to the relief fund
  const donate = async () => {
    // Check if MetaMask is connected
    if (!account) {
      console.error("Please connect MetaMask");
      return;
    }

    // Convert the donation amount from ether to wei
    const amountInEther = parseFloat(amount);
    const amountInWei = ethers.utils.parseEther(amountInEther.toString());
    
    // Create a new instance of the relief fund contract
    const reliefFundContract = new ethers.Contract(
      reliefFundAddress,
      ReliefFundABI.abi,
      provider.getSigner()
    );

    try {
      // Call the donate function of the relief fund contract
      const tx = await reliefFundContract.donate(description, {
        value: amountInWei,
      });
      await tx.wait();
      console.log("Donation successful");
      setAmount("");
      setDescription("");
      fetchTotalDonations();
      fetchDonations();
    } catch (error) {
      console.error("Donation failed:", error);
    }
  };

  // Function to withdraw funds from the relief fund
  const withdraw = async () => {
    // Check if MetaMask is connected
    if (!account) {
      console.error("Please connect MetaMask");
      return;
    }

    // Create a new instance of the relief fund contract
    const reliefFundContract = new ethers.Contract(
      reliefFundAddress,
      ReliefFundABI.abi,
      provider.getSigner()
    );

    try {
       // Call the withdraw function of the relief fund contract
      const tx = await reliefFundContract.withdraw();
      await tx.wait();
      console.log("Withdrawal successful");
      // Fetch the updated total donations and donations list
      fetchTotalDonations();
      fetchDonations();
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

  return (
    <div className="App">
      <h1>Relief Fund</h1>
      <button onClick={connectMetaMask}>Connect MetaMask</button>
      <h2>Connected Account: {account}</h2>
      <h3>Total Donations: {totalDonations} ETH</h3>
      <Box
        component="form"
        sx={{
          "& > :not(style)": { m: 1, width: "25ch" },
        }}
        noValidate
        autoComplete="off"
      >
        <TextField
          id="outlined-basic"
          variant="outlined"
          type="text"
          label="Amount (ETH)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <TextField
          id="outlined-basic"
          variant="outlined"
          type="text"
          label="Message"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <br />
        <button onClick={donate}>Donate</button>
      </Box>
      <button onClick={withdraw}>Withdraw</button>
      <h2>Donations List</h2>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 1000 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Donor</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {donations &&
              donations.map((donation, index) => (
                <TableRow
                  key={index}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>{donation.donor}</TableCell>
                  <TableCell> {donation.amount} ETH</TableCell>
                  <TableCell> {donation.description}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default App;
