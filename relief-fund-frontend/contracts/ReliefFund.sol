// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ReliefFund {
    address public organizer;
    uint public totalDonations;
    Donation[] public donations;

    struct Donation {
        address donor;
        uint amount;
        string description;
    }

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only organizer can call this function");
        _;
    }

    constructor() {
        organizer = msg.sender;
    }

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

    function withdraw() public onlyOrganizer {
        payable(organizer).transfer(address(this).balance);
    }

    function getDonationsCount() public view returns (uint) {
        return donations.length;
    }

    function getDonation(uint index) public view returns (address, uint, string memory) {
        require(index < donations.length, "Invalid index");
        Donation memory donation = donations[index];
        return (donation.donor, donation.amount, donation.description);
    }
}
