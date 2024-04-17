import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { ethers } from "ethers";
import ReliefFundABI from "../artifacts/contracts/ReliefFund.sol/ReliefFund.json";

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
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [totalDonations, setTotalDonations] = useState(0);
  const [donations, setDonations] = useState([]);
  const [provider, setProvider] = useState(null);

  const reliefFundAddress = "0x6FFeDD31aDd29438A6095249B7Eb5985039be808";

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

  const fetchTotalDonations = async () => {
    try {
      const response = await axios.get("http://localhost:3001/totalDonations");
      setTotalDonations(response.data.totalDonations);
    } catch (error) {
      console.error("Error fetching total donations:", error);
    }
  };

  const fetchDonations = async () => {
    try {
      const response = await axios.get("http://localhost:3001/donations");
      setDonations(response.data.donations);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  };

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

  const donate = async () => {
    if (!account) {
      console.error("Please connect MetaMask");
      return;
    }

    const amountInEther = parseFloat(amount);
    const amountInWei = ethers.utils.parseEther(amountInEther.toString());
    const reliefFundContract = new ethers.Contract(
      reliefFundAddress,
      ReliefFundABI.abi,
      provider.getSigner()
    );

    try {
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

  const withdraw = async () => {
    if (!account) {
      console.error("Please connect MetaMask");
      return;
    }

    const reliefFundContract = new ethers.Contract(
      reliefFundAddress,
      ReliefFundABI.abi,
      provider.getSigner()
    );

    try {
      const tx = await reliefFundContract.withdraw();
      await tx.wait();
      console.log("Withdrawal successful");
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

      {/* <ul>
        {donations &&
          donations.map((donation, index) => (
            <li key={index}>
              <p>Donor: {donation.donor}</p>
              <p>Amount: {donation.amount} ETH</p>
              <p>Description: {donation.description}</p>
            </li>
          ))}
      </ul> */}
    </div>
  );
}

export default App;
