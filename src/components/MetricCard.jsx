import React from "react";

export default function MetricCard({ title, value }) {
  return (
    <div className="bg-primary-500/10 backdrop-blur-sm rounded-lg p-3 shadow-md flex flex-col items-center justify-center border border-primary-500/20">
      <h4 className="text-primary-300 text-xs font-medium mb-1">{title}</h4>
      <p className="text-primary-200 text-base font-semibold drop-shadow-[0_0_4px_rgba(221,214,254,0.4)]">{value}</p>
    </div>
  );
}
