// ShiftReport.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../../contextApi/UserContext';

const ShiftReport = () => {
  const { user } = useUser();
  const [creditDebitSummary, setCreditDebitSummary] = useState([]);
  const [balanceInHand, setBalanceInHand] = useState(0);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [daybookCredits, setDaybookCredits] = useState([]);
  const [daybookDebits, setDaybookDebits] = useState([]);
  const [retailSales, setRetailSales] = useState([]);
  const [gstSales, setGstSales] = useState([]);
  const [taxSummary, setTaxSummary] = useState([]);
  const [creditBills, setCreditBills] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/shift-reports/summary?date=${selectedDate}&shiftNo=${user.shiftNo}`);
        const data = await res.json();
  
        setCreditDebitSummary([
          { detail: 'OPENING BALANCE', credit: '', debit: '-' },
          { detail: 'BILLS : Sales', credit: data.totalSales, debit: '' },
          { detail: '        Credit', credit: data.creditSales, debit: '' },
          { detail: 'Net Sales', credit: '', debit: data.balanceInHand },
        ]);
        setBalanceInHand(parseFloat(data.balanceInHand || 0));; // <- Add a useState for this
      } catch (err) {
        console.error("Failed to fetch summary:", err);
      }
    };
  
    const fetchDaybookReceipts = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/shift-reports/daybook-receipts?date=${selectedDate}&shiftNo=${user.shiftNo}`
        );
        const data = await res.json();
        setDaybookCredits(data.credits || []);
        setDaybookDebits(data.debits || []);
      } catch (err) {
        console.error("Failed to fetch daybook receipts:", err);
      }
    };
    const fetchRetailSales = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/shift-reports/produtsaleretail?date=${selectedDate}&shiftNo=${user.shiftNo}`
        );
        const data = await res.json();
        setRetailSales(data|| []);
      } catch (err) {
        console.error("Failed to fetch retail sales:", err);
      }
    };

    const fetchGstSales = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/shift-reports/produtsalegst?date=${selectedDate}&shiftNo=${user.shiftNo}`
        );
        const data = await res.json();
        setGstSales(data|| []);
      } catch (err) {
        console.error("Failed to fetch retail sales:", err);
      }
    };

    const fetchTaxSumamry = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/shift-reports/tax-summary?date=${selectedDate}&shiftNo=${user.shiftNo}`
        );
        const data = await res.json();
        setTaxSummary(data|| []);
      } catch (err) {
        console.error("Failed to fetch retail sales:", err);
      }
    };

    const fetchCreditBills = async () => {
        
      try {
        const res = await fetch(
          `http://localhost:5000/api/shift-reports/credit-bills?date=${selectedDate}&shiftNo=${user.shiftNo}`
        );
        const data = await res.json();
        setCreditBills(data|| []);
      } catch (err) {
        console.error("Failed to fetch retail sales:", err);
      }
    };

    fetchCreditBills();
    fetchTaxSumamry();
    fetchRetailSales();
    fetchGstSales();
    fetchDaybookReceipts();
    fetchSummary();
  }, [selectedDate]);

  const totalCreditNum = daybookCredits.reduce(
    (sum, receipt) => sum + parseFloat(receipt.amount || 0),
    0
  );
  
  const totalDebitNum = daybookDebits.reduce(
    (sum, receipt) => sum + parseFloat(receipt.amount || 0),
    0
  );

  const totalCredit = totalCreditNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalDebit = totalDebitNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const closingBalance = ((balanceInHand + totalCreditNum) - totalDebitNum).toFixed(2);

  const headerData = {
    userName: '',
    date: selectedDate,
    runDate: '04-05-2025',
    runTime: '18:23:35',
  };

  return (
    <div className="p-6 text-sm font-mono">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">DAILY SALES SUMMARY</h2>
        <div className="flex justify-between mt-2">
          <div>User Name: {user.username}</div>
          <div>
            Date:
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ml-2 px-2 py-1 border rounded"
            />
          </div>
        </div>
        <div className="flex justify-between">
          <div>Run Date: {user.shiftDate}</div>
          <div>Run Time: {headerData.runTime}</div>
        </div>
      </div>

      {/* Credit/Debit Summary */}
      <div className="border-t border-b py-2 my-2">
        <h3 className="font-semibold">Credit/Debit Summary</h3>
        <table className="w-full text-left mt-1">
          <thead>
            <tr className="border-b">
              <th>Detail</th>
              <th>Credit</th>
              <th>Debit</th>
            </tr>
          </thead>
          <tbody>
            {creditDebitSummary.map((item, idx) => (
              <tr key={idx}>
                <td>{item.detail}</td>
                <td>{item.credit}</td>
                <td>{item.debit}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-semibold">
              <td>Total</td>
              <td>{totalCredit}</td>
              <td>{totalDebit}</td>
            </tr>
            <tr className="font-semibold">
              <td>CLOSING BALANCE</td>
              <td></td>
              <td>{closingBalance}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Daybook - Credit Receipts */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Daybook - Credit Receipts</h3>
        <table className="w-full text-left mt-1">
          <thead>
            <tr className="border-b">
              <th>Account</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {daybookCredits.map((receipt, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td>{receipt.accountName}</td>
                  <td className="text-right">
                    {parseFloat(receipt.amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                </tr>
                {receipt.note && (
                  <tr>
                    <td colSpan="2" className="pl-4 italic text-gray-600">
                      {receipt.note}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="text-right font-semibold mt-2">
          Total Credit: ₹ {totalCredit}
        </div>
      </div>

      {/* Daybook - Debit Payments */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Daybook - Debit Payments</h3>
        <table className="w-full text-left mt-1">
          <thead>
            <tr className="border-b">
              <th>Account</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {daybookDebits.map((receipt, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td>{receipt.accountName}</td>
                  <td className="text-right">
                    {parseFloat(receipt.amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                </tr>
                {receipt.note && (
                  <tr>
                    <td colSpan="2" className="pl-4 italic text-gray-600">
                      {receipt.note}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="text-right font-semibold mt-2">
          Total Debit: ₹ {totalDebit}
        </div>
      </div>

      {/* Product wise sales - Retail */}
      <div className="mt-4">
        <h3 className="font-semibold">Product Wise Sales - Retail Bill</h3>
        <table className="w-full text-left mt-1">
          <thead>
            <tr className="border-b">
              <th>Product</th>
              <th>Sale Qty</th>
              <th>Amount</th>
              <th>CGST</th>
              <th>SGST</th>
            </tr>
          </thead>
          <tbody>
            {retailSales.map((item, idx) => (
              <tr key={idx}>
                <td>{item.productName}</td>
                <td>{item.totalQty}</td>
                <td>{item.totalAmount}</td>
              </tr>
            ))}
          </tbody>
          
        </table>
        <div className="text-right font-semibold mt-2">
            Total Amount: ₹
            {retailSales.reduce((sum, item) => sum + parseFloat(item.totalAmount), 0).toFixed(2)}
        </div>
      </div>

      {/* Product wise sales - GST */}
      <div className="mt-4">
        <h3 className="font-semibold">Product Wise Sales - GST Bill</h3>
        <table className="w-full text-left mt-1">
          <thead>
            <tr className="border-b">
              <th>Product</th>
              <th>Sale Qty</th>
              <th>Amount</th>
              <th>CGST</th>
              <th>SGST</th>
            </tr>
          </thead>
          <tbody>
            {gstSales.map((item, idx) => (
              <tr key={idx}>
                <td>{item.productName}</td>
                <td>{item.totalQty}</td>
                <td>{item.totalAmount}</td>
                
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right font-semibold mt-2">
            Total Amount: ₹
            {gstSales.reduce((sum, item) => sum + parseFloat(item.totalAmount), 0).toFixed(2)}
        </div>
      </div>

      {/* Tax Summary - GST */}
      <div className="mt-4">
        <h3 className="font-semibold">Tax Summary</h3>
        <table className="w-full text-left mt-1 border">
          <thead className="border-b bg-gray-100">
            <tr>
              <th className="p-1">Product</th>
              <th className="p-1">HSN Code</th>
              <th className="p-1 text-right">Tax</th>
              <th className="p-1 text-right">Gross Amount</th>
              <th className="p-1 text-right">CGST</th>
              <th className="p-1 text-right">SGST</th>
              <th className="p-1 text-right">Bill Amount</th>
            </tr>
          </thead>

          {taxSummary?.data?.length > 0 && (
            <tbody>
            {taxSummary?.data?.length > 0 && (
              <React.Fragment>
                {taxSummary.data.map((item, idx) => {
                  // Ensure taxPercent is a valid number before using toFixed()
                  const taxPercent = !isNaN(item.taxPercent) ? parseFloat(item.taxPercent) : 0;
                  const cgstPercent = !isNaN(item.cgstPercent) ? parseFloat(item.cgstPercent) : 0;
                  const sgstPercent = !isNaN(item.sgstPercent) ? parseFloat(item.sgstPercent) : 0;
                  const grossAmt = !isNaN(item.grossAmt) ? parseFloat(item.grossAmt) : 0;
                  const totalCgst = !isNaN(item.totalCgst) ? parseFloat(item.totalCgst) : 0;
                  const totalSgst = !isNaN(item.totalSgst) ? parseFloat(item.totalSgst) : 0;
                  const billAmt = !isNaN(item.billAmt) ? parseFloat(item.billAmt) : 0;
          
                  return (
                    <tr key={idx} className="border-b">
                      <td className="p-1">{item.product}</td>
                      <td className="p-1">{item.hsnCode}</td>
                      <td className="p-1 text-right">{taxPercent.toFixed(1)}%</td>
                      <td className="p-1 text-right">{grossAmt.toFixed(2)}</td>
                      <td className="p-1 text-right">({cgstPercent.toFixed(1)}%) {totalCgst.toFixed(2)}</td>
                      <td className="p-1 text-right">({sgstPercent.toFixed(1)}%) {totalSgst.toFixed(2)}</td>
                      <td className="p-1 text-right">{billAmt.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            )}
          </tbody>
          
          )}

          <tfoot className="font-semibold bg-gray-50 border-t">
            <tr>
              <td colSpan={3}>Total:</td>
              <td>{taxSummary?.total?.grossAmt?.toFixed(2) || "0.00"}</td>
              <td>{taxSummary?.total?.totalCgst?.toFixed(2) || "0.00"}</td>
              <td>{taxSummary?.total?.totalSgst?.toFixed(2) || "0.00"}</td>
              <td>{taxSummary?.total?.billAmt?.toFixed(2) || "0.00"}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Credit Bill Details */}
      <div className="mt-4">
        <h3 className="font-semibold">Credit Bill Details</h3>
        <table className="w-full text-left mt-1">
          <thead>
            <tr className="border-b">
              <th>Account</th>
              <th>Vehicle</th>
              <th>Bill No</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {creditBills.map((item, idx) => (
              <tr key={idx}>
                <td>{item.ACCOUNT}</td>
                <td>{item.VEHICLE}</td>
                <td>{item.BILLNO}</td>
                <td>{item.AMOUNT}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right font-semibold mt-2">
            Total Amount: ₹
            {creditBills.reduce((sum, item) => sum + parseFloat(item.AMOUNT), 0).toFixed(2)}
        </div>
      </div>

    </div>
  );
};

export default ShiftReport;
