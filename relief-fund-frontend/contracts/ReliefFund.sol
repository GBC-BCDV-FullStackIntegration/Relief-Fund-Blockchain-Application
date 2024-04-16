// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReliefFund {
    address payable public owner;
    mapping(address => uint256) public donations;
    mapping(uint256 => Donation) public donationDetails;
    uint256 public totalDonations;

    struct Donation {
        address donor;
        uint256 amount;
        string description;
    }

    event DonationReceived(address indexed donor, uint256 amount, string description);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    constructor() {
        owner = payable(msg.sender);
    }

    function donate(string memory description) public payable {
        require(msg.value > 0, "Donation amount must be greater than 0");
        donations[msg.sender] += msg.value;
        totalDonations += msg.value;
        donationDetails[totalDonations] = Donation(msg.sender, msg.value, description);
        emit DonationReceived(msg.sender, msg.value, description);
    }

    function withdraw(uint256 amount) public {
        amount = amount;
        require(msg.sender == owner, "Only the owner can withdraw funds");
        require(address(this).balance >= amount, "Insufficient balance");
        owner.transfer(amount);
        emit FundsWithdrawn(owner, amount);
    }

    function getDonation(uint256 donationId) public view returns (Donation memory) {
        return donationDetails[donationId];
    }

    function getTotalDonations() public view returns (uint256) {
        return totalDonations;
    }
}