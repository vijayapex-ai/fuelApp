import React, { useState, useEffect } from 'react';
import '../styles/Reports.css';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleFilter = () => {
    // Call API to filter data based on fromDate and toDate (optional)
    // For now, just refetch all
    fetchReports();
  };

  return (
    <div className="reports-container">
      <h2>📋 Fuel Sales Reports</h2>

      <div className="filter-section">
        <label>
          From:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>

        <label>
          To:
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>

        <button onClick={handleFilter}>Filter</button>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Bill No</th>
            <th>Date</th>
            <th>Mode</th>
            <th>Party Name</th>
            <th>Vehicle</th>
            <th>Product</th>
            <th>Unit</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {reports.length > 0 ? (
            reports.map((report, index) => (
              <tr key={index}>
                <td>{report.billNumber}</td>
                <td>{report.date}</td>
                <td>{report.mode}</td>
                <td>{report.partyName}</td>
                <td>{report.vehicleName}</td>
                <td>{report.productName}</td>
                <td>{report.unit}</td>
                <td>{report.rate}</td>
                <td>{report.amount}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9">No reports found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Reports;