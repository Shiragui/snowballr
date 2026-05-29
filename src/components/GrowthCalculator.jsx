import React, { useState, useEffect } from "react";
import { etfs } from "../data/etfs";

export default function GrowthCalculator({ etf, onData, onInputsChange, loadProjection }) {
  const [initialDeposit, setInitialDeposit] = useState(5000);
  const [yearsOfGrowth, setYearsOfGrowth] = useState(5);
  const [contributionAmount, setContributionAmount] = useState(100);
  const [contributionFrequency, setContributionFrequency] = useState("monthly");
  const [compareInput, setCompareInput] = useState("");
  const [compareSuggestions, setCompareSuggestions] = useState([]);
  const [compareFocused, setCompareFocused] = useState(false);
  const [estimatedRate, setEstimatedRate] = useState(10);
  const [summary, setSummary] = useState(null);
  
  const getDefaultEstimatedRate = (selectedEtf) => {
    const rate = Number(selectedEtf?.avgReturn);
    return !isNaN(rate) && rate > 0 ? rate : 10;
  };

  const parseNum = (value, fallback = 0) => {
    if (value === '') return fallback;
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  };

  const getNumericHandlers = (value, setValue, { min, max, emptyDefault, clampMinWhileTyping = true }) => ({
    onFocus: (e) => {
      if (Number(value) === 0) {
        setValue('');
      }
      e.target.select();
    },
    onBlur: () => {
      if (value === '') {
        setValue(emptyDefault ?? min ?? 0);
        return;
      }
      let num = Number(value);
      if (isNaN(num)) {
        setValue(emptyDefault ?? min ?? 0);
        return;
      }
      if (min !== undefined) num = Math.max(min, num);
      if (max !== undefined) num = Math.min(max, num);
      setValue(num);
    },
    onChange: (e) => {
      const raw = e.target.value;
      if (raw === '') {
        setValue('');
        return;
      }
      const num = Number(raw);
      if (isNaN(num)) return;
      let next = num;
      if (clampMinWhileTyping && min !== undefined) next = Math.max(min, next);
      if (max !== undefined) next = Math.min(max, next);
      setValue(next);
    },
  });
  
  // Get available ETFs for comparison
  const allETFs = etfs;
  
  // Find the selected compare ETF
  const compareETF = compareInput.trim() !== ""
    ? allETFs.find(e => e.ticker.toUpperCase() === compareInput.trim().toUpperCase())
    : null;
  
  const compareRateValue = compareETF ? compareETF.avgReturn / 100 : null;

  useEffect(() => {
    if (etf) {
      setEstimatedRate(getDefaultEstimatedRate(etf));
    }
  }, [etf?.ticker]);

  useEffect(() => {
    if (!loadProjection) return;
    setInitialDeposit(loadProjection.initialDeposit ?? 5000);
    setYearsOfGrowth(loadProjection.yearsOfGrowth ?? 5);
    setContributionAmount(loadProjection.contributionAmount ?? 100);
    setContributionFrequency(loadProjection.contributionFrequency || 'monthly');
    setEstimatedRate(loadProjection.estimatedRate ?? 10);
    setCompareInput(loadProjection.compareTicker || '');
  }, [loadProjection?.id]);

  useEffect(() => {
    if (!onInputsChange || !etf) return;
    onInputsChange({
      name: `${etf.ticker} · ${parseNum(yearsOfGrowth, 1)}y projection`,
      etfTicker: etf.ticker,
      initialDeposit: parseNum(initialDeposit, 0),
      yearsOfGrowth: parseNum(yearsOfGrowth, 1),
      contributionAmount: parseNum(contributionAmount, 0),
      contributionFrequency,
      estimatedRate: parseNum(estimatedRate, 0),
      compareTicker: compareInput.trim() || null,
    });
  }, [
    etf,
    initialDeposit,
    yearsOfGrowth,
    contributionAmount,
    contributionFrequency,
    estimatedRate,
    compareInput,
    onInputsChange,
  ]);

  // Handle compare input changes with autocomplete
  const handleCompareChange = (e) => {
    const value = e.target.value.toUpperCase();
    setCompareInput(value);
    if (value === "") {
      setCompareSuggestions([]);
    } else {
      setCompareSuggestions(allETFs.filter(e => 
        e.ticker.toUpperCase().includes(value) && e.ticker.toUpperCase() !== etf?.ticker.toUpperCase()
      ));
    }
  };
  
  const handleCompareFocus = () => {
    setCompareFocused(true);
    if (compareInput === "") {
      setCompareSuggestions(allETFs.filter(e => e.ticker.toUpperCase() !== etf?.ticker.toUpperCase()));
    } else {
      setCompareSuggestions(allETFs.filter(e => 
        e.ticker.toUpperCase().includes(compareInput.toUpperCase()) && e.ticker.toUpperCase() !== etf?.ticker.toUpperCase()
      ));
    }
  };
  
  const handleCompareBlur = () => {
    setTimeout(() => {
      setCompareFocused(false);
    }, 200);
  };
  
  const handleCompareSelect = (selectedETF) => {
    setCompareInput(selectedETF.ticker);
    setCompareSuggestions([]);
    setCompareFocused(false);
  };

  useEffect(() => {
    if (etf) {
      calculateGrowth();
    }
  }, [initialDeposit, yearsOfGrowth, contributionAmount, contributionFrequency, compareInput, estimatedRate, etf]);

  const calculateGrowth = () => {
    const deposit = parseNum(initialDeposit, 0);
    const years = Math.max(1, Math.min(100, parseNum(yearsOfGrowth, 1)));
    const contribution = parseNum(contributionAmount, 0);
    const rate = parseNum(estimatedRate, 0) / 100;
    
    // Determine comparison rate
    const compareRate = compareRateValue;
    
    const data = [];
    let balance = deposit;
    let compareBalance = compareRate !== null ? deposit : null;
    let totalDeposits = deposit;
    
    // Start with initial deposit (month 0 / year 0)
    data.push({ 
      month: 0, 
      year: 0, 
      balance: Math.round(balance),
      compareBalance: compareBalance !== null ? Math.round(compareBalance) : null,
      totalDeposits: Math.round(totalDeposits)
    });
    
    // Process month by month - stocks compound continuously, so we use monthly compounding
    const totalMonths = years * 12;
    const monthlyRate = rate / 12; // Annual rate divided by 12 for monthly compounding
    const compareMonthlyRate = compareRate !== null ? compareRate / 12 : null;
    
    // Calculate monthly contribution amount based on frequency
    const monthlyContribution = 
      contributionFrequency === "daily" ? contribution * 30 :
      contributionFrequency === "weekly" ? contribution * 4 :
      contributionFrequency === "monthly" ? contribution :
      0; // annually handled separately

    for (let month = 1; month <= totalMonths; month++) {
      // Add contribution first
      if (contributionFrequency === "annually" && month % 12 === 1) {
        // Add annual contribution at start of each year
        balance += contribution;
        if (compareBalance !== null) compareBalance += contribution;
        totalDeposits += contribution;
      } else if (contributionFrequency !== "annually") {
        // Add monthly contribution (calculated from daily/weekly/monthly)
        balance += monthlyContribution;
        if (compareBalance !== null) compareBalance += monthlyContribution;
        totalDeposits += monthlyContribution;
      }
      
      // Apply monthly growth (stocks compound continuously, monthly is a good approximation)
      balance = balance * (1 + monthlyRate);
      if (compareBalance !== null && compareMonthlyRate) {
        compareBalance = compareBalance * (1 + compareMonthlyRate);
      }
      
      // Record data for every month
      data.push({ 
        month, 
        year: month / 12, 
        balance: Math.round(balance),
        compareBalance: compareBalance !== null ? Math.round(compareBalance) : null,
        totalDeposits: Math.round(totalDeposits)
      });
    }

    if (onData) {
      onData(data);
    }

    const last = data[data.length - 1];
    if (last) {
      setSummary({
        finalBalance: last.balance,
        totalDeposits: last.totalDeposits,
        profit: last.balance - last.totalDeposits,
        compareFinal: last.compareBalance,
        years,
        compareLabel: compareETF ? compareETF.ticker : null,
      });
    }
  };

  if (!etf) return null;

  return (
    <div className="bg-primary-500/10 backdrop-blur-sm rounded-xl p-6 shadow-md border border-primary-500/20 sticky top-6">
      <h3 className="text-lg font-semibold mb-4 text-primary-300 drop-shadow-[0_0_6px_rgba(221,214,254,0.4)]">Prediction</h3>

      {summary && (
        <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-primary-400/25 to-primary-500/10 border border-primary-400/40 shadow-lg">
          <p className="text-primary-300 text-sm font-medium mb-1">
            Projected balance in {summary.years} {summary.years === 1 ? 'year' : 'years'}
          </p>
          <p className="text-4xl font-bold text-primary-100 drop-shadow-[0_0_10px_rgba(221,214,254,0.35)]">
            ${summary.finalBalance.toLocaleString()}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="text-green-400 font-medium">
              +${summary.profit.toLocaleString()} profit
            </span>
            <span className="text-primary-300/80">
              ${summary.totalDeposits.toLocaleString()} deposited
            </span>
          </div>
          {summary.compareFinal != null && (
            <p className="text-sm text-primary-300 mt-2 pt-2 border-t border-primary-400/20">
              {summary.compareLabel}:{' '}
              <span className="text-primary-200 font-semibold">
                ${summary.compareFinal.toLocaleString()}
              </span>
            </p>
          )}
        </div>
      )}

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
              {...getNumericHandlers(initialDeposit, setInitialDeposit, { min: 0, emptyDefault: 0 })}
              className="w-full pl-7 pr-10 py-2.5 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200"
              placeholder="0"
            />
            <div className="number-spinner">
              <button
                type="button"
                onClick={() => setInitialDeposit(prev => parseNum(prev, 0) + 100)}
                aria-label="Increase"
              >
                <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 7 L5 3 L8 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setInitialDeposit(prev => Math.max(0, parseNum(prev, 0) - 100))}
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
              {...getNumericHandlers(yearsOfGrowth, setYearsOfGrowth, {
                min: 1,
                max: 100,
                emptyDefault: 1,
                clampMinWhileTyping: false,
              })}
              className="w-full px-3 pr-10 py-2.5 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200"
              placeholder="Enter years"
            />
            <div className="number-spinner">
              <button
                type="button"
                onClick={() => setYearsOfGrowth(prev => Math.min(100, parseNum(prev, 1) + 1))}
                aria-label="Increase"
              >
                <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 7 L5 3 L8 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setYearsOfGrowth(prev => Math.max(1, parseNum(prev, 1) - 1))}
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
          <div className="relative number-input-wrapper">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={estimatedRate}
              {...getNumericHandlers(estimatedRate, setEstimatedRate, { min: 0, max: 100, emptyDefault: 0 })}
              className="w-full px-3 pr-10 py-2.5 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200"
              placeholder="10"
            />
            <span className="absolute right-10 top-1/2 transform -translate-y-1/2 text-primary-200">%</span>
            <div className="number-spinner">
              <button
                type="button"
                onClick={() => setEstimatedRate(prev => Math.min(100, Math.round((parseNum(prev, 0) + 0.1) * 10) / 10))}
                aria-label="Increase"
              >
                <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 7 L5 3 L8 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setEstimatedRate(prev => Math.max(0, Math.round((parseNum(prev, 0) - 0.1) * 10) / 10))}
                aria-label="Decrease"
              >
                <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3 L5 7 L8 3" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-primary-300/70 text-xs mt-1">
            Defaults to {etf.ticker} average ({getDefaultEstimatedRate(etf).toFixed(1)}%) — edit to customize
          </p>
        </div>

        {/* Compare With Input */}
        <div className="flex flex-col relative">
          <label className="text-primary-300 text-sm font-medium mb-2">Compare with Stock</label>
          <div className="relative">
            <input
              type="text"
              value={compareInput}
              onChange={handleCompareChange}
              onFocus={handleCompareFocus}
              onBlur={handleCompareBlur}
              placeholder="Type ETF ticker (e.g., VOO, SPY)"
              className="w-full px-3 py-2.5 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200 placeholder-primary-300/50"
            />
            {/* Dropdown suggestions */}
            {compareFocused && compareSuggestions.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-primary-500/20 backdrop-blur-md rounded-lg shadow-xl border border-primary-500/30 overflow-hidden z-10">
                {compareSuggestions.map((s) => (
                  <div
                    key={s.ticker}
                    onClick={() => handleCompareSelect(s)}
                    className="px-4 py-2 hover:bg-primary-500/30 cursor-pointer transition-all duration-150 border-b border-primary-500/20 last:border-b-0 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-primary-300 group-hover:text-primary-200 transition-colors">
                          {s.ticker}
                        </span>
                        <span className="text-primary-200/90 ml-2 text-sm">
                          {s.name}
                        </span>
                      </div>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 text-primary-300/70 group-hover:text-primary-200 transition-colors" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Show rate when ETF is selected */}
          {compareETF && (
            <>
              <div className="relative mt-2">
                <input
                  type="text"
                  value={`${compareETF.avgReturn.toFixed(1)}%`}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-lg bg-primary-500/15 backdrop-blur-sm border border-primary-500/20 text-primary-200 cursor-not-allowed"
                />
              </div>
              <p className="text-primary-300/70 text-xs mt-1">Based on {compareETF.ticker} average annual return</p>
            </>
          )}
          
          {compareInput.trim() !== "" && !compareETF && (
            <p className="text-primary-300/70 text-xs mt-1">ETF not found. Available: {allETFs.map(e => e.ticker).join(", ")}</p>
          )}
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
              {...getNumericHandlers(contributionAmount, setContributionAmount, { min: 0, emptyDefault: 0 })}
              className="w-full pl-7 pr-10 py-2.5 rounded-lg bg-primary-500/10 backdrop-blur-sm border border-primary-500/20 focus:outline-none focus:border-primary-400/40 text-primary-200"
              placeholder="0"
            />
            <div className="number-spinner">
              <button
                type="button"
                onClick={() => setContributionAmount(prev => parseNum(prev, 0) + 10)}
                aria-label="Increase"
              >
                <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 7 L5 3 L8 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setContributionAmount(prev => Math.max(0, parseNum(prev, 0) - 10))}
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
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setContributionFrequency("daily")}
              className={`py-2.5 rounded-lg border transition-colors text-sm ${
                contributionFrequency === "daily"
                  ? "bg-primary-400/30 border-primary-400 text-primary-200"
                  : "bg-primary-500/10 border-primary-500/20 text-primary-300 hover:border-primary-400/40"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setContributionFrequency("weekly")}
              className={`py-2.5 rounded-lg border transition-colors text-sm ${
                contributionFrequency === "weekly"
                  ? "bg-primary-400/30 border-primary-400 text-primary-200"
                  : "bg-primary-500/10 border-primary-500/20 text-primary-300 hover:border-primary-400/40"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setContributionFrequency("monthly")}
              className={`py-2.5 rounded-lg border transition-colors text-sm ${
                contributionFrequency === "monthly"
                  ? "bg-primary-400/30 border-primary-400 text-primary-200"
                  : "bg-primary-500/10 border-primary-500/20 text-primary-300 hover:border-primary-400/40"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setContributionFrequency("annually")}
              className={`py-2.5 rounded-lg border transition-colors text-sm ${
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
