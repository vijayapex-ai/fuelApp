import axios from "axios";
import React, { useState, useEffect } from "react";
import { generateTxtContent, numberToWords, convertChunk } from "../../reportsHelpers/BillList";

export default function BillListScreen() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [format, setFormat] = useState("Continuous Vehicles");
  const [party, setParty] = useState(""); // selected party
  const [partyList, setPartyList] = useState([]); // dropdown options
  const [summaryData, setSummaryData] = useState(null);

  const [bills, setBills] = useState([]);

  useEffect(() => {
    const fetchParty = async () => {
      if (fromDate && toDate) {
        try {
          const res = await axios.get('http://localhost:5000/api/bill-list/party', {
            params: { fromDate, toDate }
          });
          setPartyList(res.data.data); // FIXED: access .data.data
        } catch (err) {
          console.error("Error fetching party list", err);
        }
      }
    };
  
    fetchParty();
  }, [fromDate, toDate]); // run when either date changes
  

  // In your fetchData function, after receiving the data:
  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bill-list/bills", {
        params: { fromDate, toDate, format, party },
      });
      
      // Sort the bills array to put GENSET vehicles first
      const sortedBills = res.data.data.sort((a, b) => {
        if (a.vehicle === "GENSET" && b.vehicle !== "GENSET") return -1;
        if (a.vehicle !== "GENSET" && b.vehicle === "GENSET") return 1;
        return 0;
      });
  
      setBills(sortedBills);
  
      if (sortedBills.length > 0) {
        const summary = {
          partyName: sortedBills[0].partyName, // Assuming all are same party
          vehicles: sortedBills.map(group => ({
            vehicle: group.vehicle,
            amount: group.total
          })),
          grandTotal: sortedBills.reduce((sum, group) => sum + parseFloat(group.total), 0).toFixed(2)
        };
        setSummaryData(summary);
      }

      // Extract unique party names from result
      const allParties = res.data.data.map(item => item.partyName);
      const uniqueParties = [...new Set(allParties)];
      setPartyList(uniqueParties);
    } catch (err) {
      console.error("Error", err);
    }
  };

  const downloadTxtFile = () => {
    const content = generateTxtContent(fromDate, toDate, party, bills, summaryData);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "BILLSLIST.TXT";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 bg-beige min-h-screen font-sans text-sm">
      {/* Header Section */}
      <div className="flex justify-between text-xs text-black mb-2">
        <div>
          <div>Shift Date: <span className="font-semibold">19-04-2025</span></div>
          <div>Shift No: <span className="font-semibold">1</span></div>
        </div>
        <div className="text-right">
          <div>User Name: <span className="font-semibold">JAI SHANKAR</span></div>
          <div>Current Time: <span className="font-semibold">{new Date().toLocaleTimeString()}</span></div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="flex space-x-4 mb-3">
        <button className="bg-red-700 text-white font-bold py-2 px-6">BILLS LIST</button>
        <div className="flex-1 bg-red-200 p-3 rounded shadow">
          <div className="mb-2 font-semibold">Give input</div>
          <div className="grid grid-cols-6 gap-3 items-center">
            <label className="col-span-1">FROM DATE</label>
            <input type="date" className="col-span-1 border px-2 py-1" value={fromDate} onChange={e => setFromDate(e.target.value)} />

            <label className="col-span-1">UPTO DATE</label>
            <input type="date" className="col-span-1 border px-2 py-1" value={toDate} onChange={e => setToDate(e.target.value)} />

            <label className="col-span-1">FORMAT</label>
            <select className="col-span-1 border px-2 py-1" value={format} onChange={e => setFormat(e.target.value)}>
              <option>Continuous Vehicles</option>
              <option>Single Page Single AC</option>
            </select>

            <label className="col-span-1">SELECT PARTY NAME</label>
            <select className="col-span-2 border px-2 py-1" value={party} onChange={e => setParty(e.target.value)}>
              <option value="">-- Select Party --</option>
              {partyList.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
            </select>
            <button className="bg-red-600 text-white px-4 py-1 rounded col-span-1" onClick={fetchData}>
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Report display */}
      <div className="border h-[400px] mb-2 bg-white overflow-y-auto p-3 text-xs">
        {bills.length === 0 ? (
          <div className="text-center text-gray-400">No data to display</div>
        ) : (
          bills.map((group, i) => (
            <div key={i} className="mb-4">
              <div className="font-bold mb-1 border-b pb-1">
                {group.partyName} - {group.vehicle} (Total: ₹{group.total})
              </div>
              <table className="w-full text-left mb-2 border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="pr-2">Date</th>
                    <th className="pr-2">Indent</th>
                    <th className="pr-2">Product</th>
                    <th className="pr-2">Qty</th>
                    <th className="pr-2">Unit</th>
                    <th className="pr-2">Bill No</th>
                    <th className="pr-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {group.bills.map((item, j) => (
                    <tr key={j} className="border-b">
                      <td>{item.date}</td>
                      <td>{item.indent}</td>
                      <td>{item.product}</td>
                      <td>{item.qty}</td>
                      <td>{item.unit}</td>
                      <td>{item.billNo}</td>
                      <td>{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>

      {/* Report display */}
      <div className="border h-[400px] mb-2 bg-white overflow-y-auto p-3 text-xs">
        {bills.length === 0 ? (
          <div className="text-center text-gray-400">No data to display</div>
        ) : (
          <>
            {/* Vehicle-wise Summary Section */}
            {summaryData && (
              <div className="mb-6 border border-black p-2">
                <div className="text-center font-bold mb-2">
                  VEHICLE-WISE BILLS SUMMARY FOR THE PARTY : {summaryData.partyName}
                </div>
                <table className="w-full border border-black text-xs">
                    <thead>
                        <tr className="bg-gray-100 border-b border-black">
                        <th className="border-r border-black p-1 text-left w-3/4">VEHICLE NO.</th>
                        <th className="p-1 text-right w-1/4">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryData.vehicles.map((item, index) => (
                        <tr key={index} className="border-b border-black">
                            <td className="border-r border-black p-1">{item.vehicle}</td>
                            <td className="p-1 text-right">{parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        ))}
                        <tr className="font-bold border-t border-black">
                        <td className="border-r border-black p-1">TOTAL ...</td>
                        <td className="p-1 text-right">{parseFloat(summaryData.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                    </table>

                <div className="mt-2 text-center">
                  Rupees {numberToWords(Math.floor(summaryData.grandTotal))} and Paise {(summaryData.grandTotal % 1 * 100).toFixed(0)} only
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Pagination */}
      <div className="flex items-center justify-between text-xs mt-2">
        <div>Total Pages</div>
        <div className="flex items-center gap-2">
          <label>Filter Page from</label>
          <input className="border px-2 py-1 w-16" />
          <label>Filter Upto Page</label>
          <input className="border px-2 py-1 w-16" />
        </div>
        <div className="flex gap-2">
          <button className="bg-blue-700 text-white px-4 py-1">Load</button>
          <button className="bg-blue-700 text-white px-4 py-1" onClick={downloadTxtFile}>Print (Dot Matrix)</button>

          <button className="bg-purple-400 text-white px-4 py-1">Exit</button>
        </div>
      </div>
    </div>
  );
}
