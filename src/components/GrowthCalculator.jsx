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
    <div className="bg-gray-800 rounded-xl p-4 mt-6 shadow-md">
      <h3 className="text-lg font-semibold mb-4">Growth Simulator</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="text-gray-400 text-sm">Initial Investment</label>
          <input
            type="number"
            value={initial}
            onChange={(e) => setInitial(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-gray-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">Monthly Contribution</label>
          <input
            type="number"
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-gray-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">Years</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-gray-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">Profile</label>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="w-full p-2 rounded-lg bg-gray-700 focus:outline-none"
          >
            <option value="conservative">Conservative</option>
            <option value="average">Average</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="bg-emerald-400 hover:bg-emerald-500 text-gray-900 font-semibold px-4 py-2 rounded-lg"
      >
        Calculate
      </button>
    </div>
  );
}
