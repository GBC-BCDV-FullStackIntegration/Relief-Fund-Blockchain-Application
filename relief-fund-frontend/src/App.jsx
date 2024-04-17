import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { ethers } from "ethers";
import ReliefFundABI from "../artifacts/contracts/ReliefFund.sol/ReliefFund.json";

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
      <p>Connected Account: {account}</p>
      <p>Total Donations: {totalDonations} ETH</p>
      <input
        type="text"
        placeholder="Amount (ETH)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button onClick={donate}>Donate</button>
      <button onClick={withdraw}>Withdraw</button>
      <h2>Donations List</h2>
      <ul>
        {donations &&
          donations.map((donation, index) => (
            <li key={index}>
              <p>Donor: {donation.donor}</p>
              <p>Amount: {donation.amount} ETH</p>
              <p>Description: {donation.description}</p>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default App;
