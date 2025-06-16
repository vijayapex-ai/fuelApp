import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../../contextApi/UserContext';

const PumpClosingReading = () => {
  const [readings, setReadings] = useState([]);
  const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
  const [isShiftClosed, setIsShiftClosed] = useState(false);
  const { user } = useUser();
  const [editMode, setEditMode] = useState(false);

  const shiftRef = useRef('');
  const dateRef = useRef('');
  const [billTotals, setBillTotals] = useState([]);

  useEffect(() => {
    const fetchBillData = async () => {
      
      try {
        const response = await axios.get('http://localhost:5000/api/billEntry/product-totals', {
          params: {
            shiftDate:user.shiftDate,
            shiftNo: user.shiftNo
          }
        });
        setBillTotals(response.data);
      } catch (err) {
        console.error('Error fetching bill totals:', err);
      }
    };

      fetchBillData();
  }, [user.shiftNo, user.shiftDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {

        // The backend will handle finding records that span this date
        const [configRes, openingRes, closingRes] = await Promise.all([
          axios.get('http://localhost:5000/api/pump-config'),
          axios.get(`http://localhost:5000/api/pump-config/opening`, {
            params: { 
              shift: user.shiftNo,
              date: user.shiftDate // Use the login date directly
            }
          }),
          axios.get(`http://localhost:5000/api/pump-config/closing`, {
            params: {
              shift: user.shiftNo,
              date: user.shiftDate // Use the login date directly
            }
          })
        ]);
  

        const configData = configRes.data;
        const openingData = Array.isArray(openingRes.data) ? openingRes.data : [];
        const closingData = Array.isArray(closingRes.data) ? closingRes.data : [];

        const merged = configData.map(config => {
          const openingMatch = openingData.find(o => o.pumpCode === config.pumpCode);
          const closingMatch = closingData.find(c => c.pumpCode === config.pumpCode);

          let saleLTR = '0.00';
          if (closingMatch && openingMatch) {
            saleLTR = (parseFloat(closingMatch.closingReading) - parseFloat(openingMatch.openingReading)).toFixed(2);
          }

          return {
            ...config,
            id: openingMatch?.id || closingMatch?.id,
            openingReading: openingMatch?.openingReading || '0.00',
            closingReading: closingMatch?.closingReading || '0.00',
            saleLTR: saleLTR,
            status: closingMatch?.status || openingMatch?.status || 'pending'
          };
        });

        setReadings(merged);

        const shiftClosed = closingData.length > 0 && closingData.every(c => c.status === 'closed');
        setIsShiftClosed(shiftClosed);

        const allFilled = merged.every(
          r => parseFloat(r.openingReading) > 0 && parseFloat(r.closingReading) > 0
        );
        setIsSaveButtonDisabled(!allFilled && !shiftClosed);

      } catch (err) {
        console.error('Error fetching config/opening/closing data:', err);
      }
    };

    fetchData();
  }, [ user.shiftNo]);


  // Enable edit mode only if the latest closed record is for the current shift
  const toggleEditMode = () => {
      console.log("Current User Date:", user.shiftDate);
      console.log("Current Readings:", readings);

      // Find all closed entries
      const closedEntries = readings.filter(r => r.status === 'closed');
      console.log("Closed Entries Found:", closedEntries);

      if (closedEntries.length === 0) {
          console.log("No Closed Entries Found, No Shift Data");
          alert("There are no closed shifts to edit.");
          return;
      }

      // Find the last closed entry (using readingDate instead of date)
      const lastClosedEntry = closedEntries
          .sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate) || b.shift - a.shift)[0];

      console.log("Last Closed Entry Found:", lastClosedEntry);

      // Convert the dates to Date objects for comparison
      const entryDate = new Date(lastClosedEntry.readingDate || lastClosedEntry.date);
      const userDate = new Date(user.shiftDate);

      // Check if this is the current shift and date
      if (lastClosedEntry && 
          entryDate.toDateString() === userDate.toDateString() && 
          lastClosedEntry.shift === user.shiftNo) {
          console.log("Enabling Edit Mode");
          setEditMode(!editMode);
      } else {
          console.log("Edit Mode Not Allowed");
          alert("Only the last closed shift for the current date and shift can be edited.");
      }
  };

  const handleInputChange = (index, field, value) => {
     // Allow editing in edit mode or if shift isn't closed
    if (!editMode && isShiftClosed) return;

    const updated = [...readings];
    updated[index][field] = value;

    const open = parseFloat(updated[index].openingReading || 0);
    const close = parseFloat(value || 0);

    updated[index].saleLTR = (close - open).toFixed(2);
    updated[index].status = editMode ? 'edited' : 'active';

    setReadings(updated);

    const allFilled = updated.every(
      (r) => parseFloat(r.openingReading) > 0 && parseFloat(r.closingReading) > 0
    );
    setIsSaveButtonDisabled(!allFilled);
  };

  const handleKeyDown = (e, index) => {
    if (isShiftClosed) return;
    
    if (e.key === 'Enter' || e.key === 'Tab') {
      const entry = readings[index];
      const close = parseFloat(entry.closingReading || 0);
      if (!isNaN(close) && close > 0) {
        saveReading({ ...entry, status: 'active' });
      }
    }
  };

  const saveReading = async (entry) => {
    try {
            
      await axios.post('http://localhost:5000/api/pump-config/entry', {
        entries: [
          {
            id: entry.id,
            pumpCode: entry.pumpCode,
            openingReading: parseFloat(entry.openingReading),
            closingReading: parseFloat(entry.closingReading),
            saleLitre: parseFloat(entry.saleLTR),
            productCode: entry.productCode,
            productName: entry.productName,
            shift: shiftRef.current,
            readingDate: dateRef.current,
            status: entry.status
          }
        ]
      });
    } catch (err) {
      console.error('Error saving entry:', err);
    }
  };

  const handleSave = async () => {
  if (isShiftClosed && !editMode) {
    console.log('Shift already closed and not in edit mode, aborting');
    return;
  }

  try {
    // Prepare entry data
    const formattedEntries = readings.map(r => ({
      id: r.id || null,
      pumpCode: r.pumpCode,
      productCode: r.productCode,
      productName: r.productName,
      openingReading: parseFloat(r.openingReading) || 0,
      closingReading: parseFloat(r.closingReading) || 0,
      saleLitre: parseFloat(r.saleLTR) || 0,
      shift: user.shiftNo,
      date: user.shiftDate,
      readingDate: user.shiftDate,
      status: editMode ? 'closed' : 'closed' // Maintain closed status
    }));

    // Save the entries
    await axios.post('http://localhost:5000/api/pump-config/entry', {
      entries: formattedEntries
    });

    if (!editMode) {
      // Only create next shift openings if we're not in edit mode
      const nextShiftNumber = user.shiftNo === '1' ? '2' : '1';
      const nextShiftDate = user.shiftNo === '1' 
        ? user.shiftDate 
        : getNextDay(user.shiftDate);

      const nextShiftEntries = formattedEntries.map(e => ({
        pumpCode: e.pumpCode,
        productCode: e.productCode,
        productName: e.productName,
        openingReading: e.closingReading,
        closingReading: 0,
        saleLitre: 0,
        shift: nextShiftNumber,
        date: user.shiftDate,
        readingDate: nextShiftDate,
        status: 'pending'
      }));

      await axios.post('http://localhost:5000/api/pump-config/next-shift-opening', {
        entries: nextShiftEntries,
        currentShift: parseInt(user.shiftNo),
        date: user.shiftDate
      });
    }

    // Update UI
    setReadings(prev => prev.map(r => ({ ...r, status: 'closed' })));
    setIsSaveButtonDisabled(true);
    setIsShiftClosed(true);
    setEditMode(false);
    
    alert(editMode ? 'Changes saved successfully!' : 'Shift closed successfully!');
  } catch (err) {
    console.error('Error:', err);
    alert(`Failed to save: ${err.response?.data?.message || err.message}`);
  }
};

// Helper function to get next day
const getNextDay = (dateString) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

  const calculateProductTotals = () => {
    const productMap = {};
  
    readings.forEach(reading => {
      if (!productMap[reading.productName]) {
        productMap[reading.productName] = {
          opening: 0,
          closing: 0,
          billQty: 0,
          sale: 0,
          pumpCount: 0
        };
      }
  
      productMap[reading.productName].opening += parseFloat(reading.openingReading) || 0;
      productMap[reading.productName].closing += parseFloat(reading.closingReading) || 0;
      productMap[reading.productName].sale += parseFloat(reading.saleLTR) || 0;
      productMap[reading.productName].pumpCount += 1;
    });
  
    billTotals.forEach(bill => {
      if (productMap[bill.productName]) {
        productMap[bill.productName].billQty = parseFloat(bill.totalQty) || 0;
        productMap[bill.productName].billCount = bill.billCount || 0;
      }
    });
  
    return Object.entries(productMap).map(([productName, totals]) => ({
      productName,
      openingTotal: totals.opening.toFixed(2),
      closingTotal: totals.closing.toFixed(2),
      billQty: totals.billQty.toFixed(2),
      saleTotal: totals.sale.toFixed(2),
      difference: (totals.sale - totals.billQty).toFixed(2),
      pumpCount: totals.pumpCount
    }));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>PUMP CLOSING READING - ENTRY</h2>
      {isShiftClosed && (
        <button
            onClick={toggleEditMode}
            style={{
                padding: '8px 16px',
                backgroundColor: editMode ? '#f44336' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '10px'
            }}
        >
            {editMode ? 'Cancel Edit' : 'Edit Mode'}
        </button>
    )}

      <div style={{ marginBottom: '10px' }}>
        <label><strong>Shift Date:</strong> {user.shiftDate}</label><br />
        <label><strong>Shift No.:</strong> {user.shiftNo}</label><br />
        <label><strong>User Name:</strong> {user.username}</label><br />
        <label><strong>Current Time:</strong> {new Date().toLocaleTimeString()}</label>
        {isShiftClosed && <div style={{ color: 'red', marginTop: '10px' }}>This shift has been closed!</div>}
      </div>

      <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Pump Code</th>
            <th>Product Name</th>
            <th>Opening Reading</th>
            <th>Closing Reading</th>
            <th>SALE LTR</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r, index) => (
            <tr key={r.pumpCode} style={{ 
              backgroundColor: r.status === 'closed' ? '#f0f0f0' : 'transparent'
            }}>
              <td>{r.pumpCode}</td>
              <td>{r.productName}</td>
              <td>
                <input 
                  type="number" 
                  value={r.openingReading} 
                  readOnly 
                  style={{ width: '80%' }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={r.closingReading}
                  onChange={(e) => handleInputChange(index, 'closingReading', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  readOnly={(r.status === 'closed' && !editMode) || (isShiftClosed && !editMode)}
                  style={{ 
                    width: '80%',
                    backgroundColor: editMode ? '#fffacd' : 'transparent'
                  }}
                />
              </td>
              <td>{r.saleLTR}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '30px' }}>
        <h3>Product Summary</h3>
        <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%', marginTop: '10px' }}>
          <thead>
            <tr>
              <th>No. of Pumps</th>
              <th>Product Name</th>
              <th>By Reading</th>
              <th>By Bill (LTR)</th>
              <th>Diff (Reading - Bill)</th>
            </tr>
          </thead>
          <tbody>
            {calculateProductTotals().map((product, index) => (
              <tr key={index}>
                <td>{product.pumpCount}</td>
                <td>{product.productName}</td>
                <td>{product.saleTotal}</td>
                <td>{product.billQty}</td>
                <td>{product.difference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {editMode ? (
        <button
            onClick={handleSave}
            style={{ 
                marginLeft: '10px',
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            }}
        >
            Save Changes
        </button>
    ) : (
        <button
            onClick={handleSave}
            disabled={isSaveButtonDisabled}
            style={{ 
                marginLeft: '10px',
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            }}
        >
            Save/Close
        </button>
    )}


    </div>
  );
};

export default PumpClosingReading;