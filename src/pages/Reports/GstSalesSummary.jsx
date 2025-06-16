import axios from "axios";
import React, { useState } from "react";

export default function GSTSalesSummaryReport() {
  const [fromDate, setFromDate] = useState("2025-04-01");
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:5000/api/gstsalessummary/summary`, {
        params: { fromDate, toDate }
      });
      setSalesData(res.data);
      setCurrentPage(1); // Reset to first page when new data is fetched
    } catch (err) {
      console.error("Failed to fetch summary:", err);
      setError(err.message || "Failed to load data");
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExit = () => {
    window.location.href = "/dashboard";
  };

  const formatNumber = (value) => {
    return value ? parseFloat(value).toFixed(2) : "0.00";
  };

  const totalPages = Math.ceil(salesData.length / itemsPerPage);
  const paginatedData = salesData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 bg-purple-50 min-h-screen font-sans print:p-0">
      <div className="container mx-auto print:w-full print:max-w-none">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <div className="flex flex-col">
            <label className="mb-2 font-semibold">From Date:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              max={toDate}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 font-semibold">To Date:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              min={fromDate}
            />
          </div>

          <div className="self-end">
            <button
              onClick={fetchReport}
              disabled={loading}
              className={`px-6 py-2 rounded-lg transition duration-300 ${
                loading
                  ? "bg-purple-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg print:hidden">
            {error}
          </div>
        )}

        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-purple-700">
            GST SALES SUMMARY REPORT
          </h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg print:shadow-none print:border print:border-gray-300">
          <h2 className="text-lg font-semibold text-purple-800 mb-2">
            GST SALES SUMMARY
          </h2>
          <p className="text-gray-600 mb-4">
            PRODUCTWISE - TAX SUMMARY - GST BILLS FOR THE DATE FROM:{" "}
            {fromDate} TO: {toDate}
          </p>

          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-purple-100">
                <th className="px-4 py-2 border-b font-medium">PRODUCT</th>
                <th className="px-4 py-2 border-b font-medium text-right">Sales QTY</th>
                <th className="px-4 py-2 border-b font-medium text-right">G.PROD</th>
                <th className="px-4 py-2 border-b font-medium text-right">CU</th>
                <th className="px-4 py-2 border-b font-medium text-right">AMOUNT</th>
                <th className="px-4 py-2 border-b font-medium text-right">CGST</th>
                <th className="px-4 py-2 border-b font-medium text-right">SGST</th>
                <th className="px-4 py-2 border-b font-medium text-right">IGST</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-4 text-center text-gray-500">
                    {loading ? "Loading data..." : "No data available for selected dates"}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-purple-50">
                    <td className="px-4 py-2 border-b">{item.product || "N/A"}</td>
                    <td className="px-4 py-2 border-b text-right">{item.qty || 0}</td>
                    <td className="px-4 py-2 border-b text-right">{item.gstproduct || 0}</td>
                    <td className="px-4 py-2 border-b text-right">{item.unit}</td>
                    <td className="px-4 py-2 border-b text-right">{formatNumber(item.amount)}</td>
                    <td className="px-4 py-2 border-b text-right">{formatNumber(item.cgst)}</td>
                    <td className="px-4 py-2 border-b text-right">{formatNumber(item.sgst)}</td>
                    <td className="px-4 py-2 border-b text-right">{formatNumber(item.igst)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {salesData.length > itemsPerPage && (
            <div className="flex justify-center items-center mt-4 gap-4 print:hidden">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between gap-4 print:hidden">
          <button 
            onClick={fetchReport}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Refresh
          </button>
          <button 
            onClick={handlePrint}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
          >
            Print
          </button>
          <button 
            onClick={handleExit}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
