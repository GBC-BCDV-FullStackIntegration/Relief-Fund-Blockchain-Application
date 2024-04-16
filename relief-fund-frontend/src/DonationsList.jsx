import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ReliefFund from './artifacts/contracts/ReliefFund.sol/ReliefFund.json';
// import dotenv from 'dotenv';
// dotenv.config();

const contractAddress = '0x0cc2BC845c8BDeCfd771cdE51Ac9B6Ae5cE47931'; 

// Initialize provider
const provider = new ethers.providers.JsonRpcProvider("");

function DonationsList() {
 const [donations, setDonations] = useState([]);

 useEffect(() => {
    async function fetchDonations() {
      try {
        const contract = new ethers.Contract(contractAddress, ReliefFund.abi, provider);
        console.log("Contract instance:", contract);
        // Total number of donations
        const totalDonations = await contract.getTotalDonations();
        

        // Fetch each donation
        const fetchedDonations = [];
        for (let i = 1; i <= totalDonations; i++) {
          const donation = await contract.getDonation(i);
          fetchedDonations.push(donation);
        }
        console.log("Fetched donations:", fetchedDonations);

        setDonations(fetchedDonations);
      } catch (error) {
        console.error("Failed to fetch donations:", error);
      }
    }

    fetchDonations();
 }, []);

 return (
    <div>
      <h2>Donations</h2>
      {donations.map((donation, index) => (
        <div key={index}>
          <p>Donor: {donation.donor}</p>
          <p>Amount: {ethers.utils.formatEther(donation.amount)} ETH</p>
          <p>Description: {donation.description}</p>
        </div>
      ))}
    </div>
 );
}

export default DonationsList;
