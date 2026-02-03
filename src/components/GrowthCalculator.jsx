import React, { useState } from "react";

export default function GrowthCalculator({ onData }) {
  const [initial, setInitial] = useState(1000);
  const [monthly, setMonthly] = useState(100);
  const [years, setYears] = useState(10);
  const [profile, setProfile] = useState("average");

  const growthRates = {
    conservative: 0.05,
    average: 0.08,
    aggressive: 0.11
  };

  const handleCalculate = () => {
    const rate = growthRates[profile];
    const data = [];
    let balance = initial;

    for (let i = 1; i <= years; i++) {
      balance = balance * (1 + rate) + monthly * 12;
      data.push({ year: i, balance: Math.round(balance) });
    }

    onData(data);
  };

  return (
    <div className="bg-primary-500/10 backdrop-blur-sm rounded-xl p-6 shadow-md border border-primary-500/20">
      <h3 className="text-lg font-semibold mb-6 text-primary-200 drop-shadow-[0_0_6px_rgba(221,214,254,0.4)]">Growth Simulator</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-primary-300 text-sm font-medium mb-2">Initial Investment</label>
          <input
            type="number"
            value={initial}
            onChange={(e) => setInitial(Number(e.target.value))}
            className="w-full p-3 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-primary-300 text-sm font-medium mb-2">Monthly Contribution</label>
          <input
            type="number"
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="w-full p-3 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-primary-300 text-sm font-medium mb-2">Years</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full p-3 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-primary-300 text-sm font-medium mb-2">Profile</label>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="w-full p-3 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200"
          >
            <option value="conservative">Conservative</option>
            <option value="average">Average</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="bg-primary-400 hover:bg-primary-500 text-gray-900 font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        Calculate
      </button>
    </div>
  );
}
