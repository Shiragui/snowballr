import React from "react";

export default function MetricCard({ title, value }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 m-2 shadow-md flex flex-col items-center">
      <h4 className="text-gray-400 text-sm">{title}</h4>
      <p className="text-emerald-400 text-lg font-semibold">{value}</p>
    </div>
  );
}
