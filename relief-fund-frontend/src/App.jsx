import React from "react";
import "./App.css";
import DonateForm from "./DonateForm";
import WithdrawForm from "./WithdrawForm";
import DonationsList from "./DonationsList";

function App() {
  return (
    <div className="App">
      <h1>Relief Fund</h1>
      <DonateForm />
      <WithdrawForm />
      <DonationsList />
    </div>
  );
}

export default App;
