import React, { useState, useEffect } from "react";

export default function GrowthCalculator({ etf, onData }) {
  const [initialDeposit, setInitialDeposit] = useState(5000);
  const [yearsOfGrowth, setYearsOfGrowth] = useState(5);
  const [contributionAmount, setContributionAmount] = useState(100);
  const [contributionFrequency, setContributionFrequency] = useState("monthly");
  const [compoundFrequency, setCompoundFrequency] = useState("monthly");

  // Calculate rate based on ETF's average return
  // For longer time periods, we might want to be slightly more conservative
  const getRateOfReturn = () => {
    if (!etf) return 0;
    const baseRate = etf.avgReturn / 100;
    // Slightly adjust based on years (longer = slightly more conservative)
    const adjustment = yearsOfGrowth > 20 ? -0.002 : 0;
    return Math.max(0, baseRate + adjustment);
  };

  const rateOfReturn = getRateOfReturn();

  useEffect(() => {
    if (etf) {
      calculateGrowth();
    }
  }, [initialDeposit, yearsOfGrowth, contributionAmount, contributionFrequency, compoundFrequency, etf]);

  const calculateGrowth = () => {
    const rate = rateOfReturn;
    const data = [];
    let balance = initialDeposit;
    
    // Process month by month for accuracy
    const totalMonths = yearsOfGrowth * 12;
    const monthlyRate = compoundFrequency === "monthly" ? rate / 12 : 0;
    const annualRate = compoundFrequency === "annually" ? rate : 0;

    for (let month = 1; month <= totalMonths; month++) {
      // Add contribution
      if (contributionFrequency === "monthly") {
        balance += contributionAmount;
      } else if (contributionFrequency === "annually" && month % 12 === 1) {
        // Add annual contribution at start of each year
        balance += contributionAmount;
      }
      
      // Compound interest
      if (compoundFrequency === "monthly") {
        balance = balance * (1 + monthlyRate);
      } else if (compoundFrequency === "annually" && month % 12 === 0) {
        // Compound annually at end of each year
        balance = balance * (1 + annualRate);
      }
      
      // Record data at end of each year
      if (month % 12 === 0) {
        data.push({ year: month / 12, balance: Math.round(balance) });
      }
    }

    if (onData) {
      onData(data);
    }
  };

  if (!etf) return null;

  return (
    <div className="bg-primary-500/10 backdrop-blur-sm rounded-xl p-6 shadow-md border border-primary-500/20 sticky top-6">
      <h3 className="text-lg font-semibold mb-6 text-primary-200 drop-shadow-[0_0_6px_rgba(221,214,254,0.4)]">Investment Calculator</h3>

      <div className="space-y-4">
        {/* Initial Deposit */}
        <div className="flex flex-col">
          <label className="text-primary-300 text-sm font-medium mb-2">Initial deposit</label>
          <div className="relative number-input-wrapper">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-200 z-10">$</span>
            <input
              type="number"
              min="0"
              step="100"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(Math.max(0, Number(e.target.value) || 0))}
              className="w-full pl-7 pr-10 py-2.5 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200"
              placeholder="0"
            />
            <div className="number-spinner">
              <button
                type="button"
                onClick={() => setInitialDeposit(prev => Math.max(0, prev + 100))}
                aria-label="Increase"
              >
                <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 7 L5 3 L8 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setInitialDeposit(prev => Math.max(0, prev - 100))}
                aria-label="Decrease"
              >
                <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3 L5 7 L8 3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Years of Growth */}
        <div className="flex flex-col">
          <label className="text-primary-300 text-sm font-medium mb-2">Years of growth</label>
          <div className="relative number-input-wrapper">
            <input
              type="number"
              min="1"
              max="100"
              value={yearsOfGrowth}
              onChange={(e) => {
                const value = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                setYearsOfGrowth(value);
              }}
              className="w-full px-3 pr-10 py-2.5 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200"
              placeholder="Enter years"
            />
            <div className="number-spinner">
              <button
                type="button"
                onClick={() => setYearsOfGrowth(prev => Math.min(100, prev + 1))}
                aria-label="Increase"
              >
                <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 7 L5 3 L8 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setYearsOfGrowth(prev => Math.max(1, prev - 1))}
                aria-label="Decrease"
              >
                <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3 L5 7 L8 3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Estimated Rate of Return */}
        <div className="flex flex-col">
          <label className="text-primary-300 text-sm font-medium mb-2">Estimated rate of return</label>
          <div className="relative">
            <input
              type="text"
              value={`${(rateOfReturn * 100).toFixed(1)}%`}
              readOnly
              className="w-full px-3 py-2.5 rounded-lg bg-primary-500/15 backdrop-blur-sm border border-primary-500/20 text-primary-200 cursor-not-allowed"
            />
          </div>
          <p className="text-primary-300/70 text-xs mt-1">Based on {etf.ticker} average return</p>
        </div>

        {/* Compound Frequency */}
        <div className="flex flex-col">
          <label className="text-primary-300 text-sm font-medium mb-2">Compound frequency</label>
          <div className="flex gap-2">
            <button
              onClick={() => setCompoundFrequency("monthly")}
              className={`flex-1 py-2.5 rounded-lg border transition-colors ${
                compoundFrequency === "monthly"
                  ? "bg-primary-400/30 border-primary-400 text-primary-200"
                  : "bg-primary-500/10 border-primary-500/20 text-primary-300 hover:border-primary-400/40"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCompoundFrequency("annually")}
              className={`flex-1 py-2.5 rounded-lg border transition-colors ${
                compoundFrequency === "annually"
                  ? "bg-primary-400/30 border-primary-400 text-primary-200"
                  : "bg-primary-500/10 border-primary-500/20 text-primary-300 hover:border-primary-400/40"
              }`}
            >
              Annually
            </button>
          </div>
        </div>

        {/* Contribution Amount */}
        <div className="flex flex-col">
          <label className="text-primary-300 text-sm font-medium mb-2">Contribution amount</label>
          <div className="relative number-input-wrapper">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-200 z-10">$</span>
            <input
              type="number"
              min="0"
              step="10"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(Math.max(0, Number(e.target.value) || 0))}
              className="w-full pl-7 pr-10 py-2.5 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200"
              placeholder="0"
            />
            <div className="number-spinner">
              <button
                type="button"
                onClick={() => setContributionAmount(prev => prev + 10)}
                aria-label="Increase"
              >
                <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 7 L5 3 L8 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setContributionAmount(prev => Math.max(0, prev - 10))}
                aria-label="Decrease"
              >
                <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3 L5 7 L8 3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Contribution Frequency */}
        <div className="flex flex-col">
          <label className="text-primary-300 text-sm font-medium mb-2">Contribution frequency</label>
          <div className="flex gap-2">
            <button
              onClick={() => setContributionFrequency("monthly")}
              className={`flex-1 py-2.5 rounded-lg border transition-colors ${
                contributionFrequency === "monthly"
                  ? "bg-primary-400/30 border-primary-400 text-primary-200"
                  : "bg-primary-500/10 border-primary-500/20 text-primary-300 hover:border-primary-400/40"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setContributionFrequency("annually")}
              className={`flex-1 py-2.5 rounded-lg border transition-colors ${
                contributionFrequency === "annually"
                  ? "bg-primary-400/30 border-primary-400 text-primary-200"
                  : "bg-primary-500/10 border-primary-500/20 text-primary-300 hover:border-primary-400/40"
              }`}
            >
              Annually
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
