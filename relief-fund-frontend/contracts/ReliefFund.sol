// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReliefFund {
    // Variables for the organizer who deployed the contract, total Ether donations
    // and an array of struct 
    address public organizer;
    uint public totalDonations;
    Donation[] public donations;

    // Struct for storing the address of the owner, amount and message
    struct Donation {
        address donor;
        uint amount;
        string description;
    }

    // Creating a modifier for only the the address
    // that deployed this contract can call certain functions
    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only organizer can call this function");
        _;
    }

    // Stores the address of the organizer that deployed the contract
    constructor() {
        organizer = msg.sender;
    }

    // Function to donate Ether to the fund
    function donate(string memory _description) public payable {
        require(msg.value > 0, "Donation amount should be greater than 0");
        
        Donation memory newDonation = Donation({
            donor: msg.sender,
            amount: msg.value,
            description: _description
        });
        
        donations.push(newDonation);
        totalDonations += msg.value;
    }

    // Function for only the organizer can withdrew all the Ether donations
    function withdraw() public onlyOrganizer {
        payable(organizer).transfer(address(this).balance);
    }

    // Returns the total Donation count
    function getDonationsCount() public view returns (uint) {
        return donations.length;
    }

    // Retrieves the details of the specific donation
    function getDonation(uint index) public view returns (address, uint, string memory) {
        require(index < donations.length, "Invalid index");
        Donation memory donation = donations[index];
        return (donation.donor, donation.amount, donation.description);
    }
}
