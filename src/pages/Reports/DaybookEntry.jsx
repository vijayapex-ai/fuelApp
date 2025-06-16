import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../../contextApi/UserContext';
import debounce from 'lodash.debounce';

const DayBookEntry = () => {
  const [customers, setCustomers] = useState([]);
  const [savedEntries, setSavedEntries] = useState([]);
  const [entries, setEntries] = useState([
    { entryType: '', accountName: '', customName: '', debit: '', credit: '', description: '' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const { user } = useUser();
  const saveInProgress = useRef(false);

  // Fetch customer list
  useEffect(() => {
    axios.get('http://localhost:5000/api/customers')
      .then(res => setCustomers(res.data))
      .catch(err => console.error('Failed to load customers', err));
  }, []);

  // Fetch existing saved entries
  useEffect(() => {
    if (!user.shiftDate || !user.shiftNo) return;

    axios.get('http://localhost:5000/api/daybookentry', {
      params: {
        shiftDate: user.shiftDate,
        shiftNo: user.shiftNo
      }
    })
    .then(res => {
      if (res.data.length > 0) {
        setSavedEntries(res.data);
        setEntries([{ entryType: '', accountName: '', customName: '', debit: '', credit: '', description: '' }]);
      }
    })
    .catch(err => {
      console.error('Failed to load daybook entries', err);
    });
  }, [user.shiftDate, user.shiftNo]);

  const handleChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const saveEntries = useCallback(async (entriesToSave) => {
    if (saveInProgress.current || !entriesToSave || entriesToSave.length === 0) return;

    try {
      saveInProgress.current = true;
      setIsSaving(true);

      const validEntries = entriesToSave.filter(entry =>
        entry.entryType && (entry.accountName || entry.customName) && (entry.debit || entry.credit)
      );

      if (validEntries.length === 0) return;

      const payload = {
        shiftDate: user.shiftDate,
        shiftNo: user.shiftNo,
        entries: validEntries.map(entry => ({
          ...entry,
          accountName: entry.accountName === '__OTHER__' ? entry.customName : entry.accountName
        }))
      };

      await axios.post('http://localhost:5000/api/daybookentry', payload);
      
      // Move saved entries to read-only list
      setSavedEntries(prev => [...prev, ...payload.entries]);
      setLastSaved(new Date().toLocaleTimeString());
      
      return true; // Indicate success
    } catch (err) {
      console.error('Save failed', err);
      return false;
    } finally {
      saveInProgress.current = false;
      setIsSaving(false);
    }
  }, [user]);

  const addRow = async () => {
    // First save the current entries
    const success = await saveEntries(entries);
    
    if (!success) {
      alert('Failed to save current entries. Please check your inputs.');
      return;
    }

    // Only add a new row if save was successful
    setEntries([{ entryType: '', accountName: '', customName: '', debit: '', credit: '', description: '' }]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Save any unsaved entries when component unmounts
      const hasValidEntry = entries.some(entry =>
        entry.entryType &&
        (entry.accountName || entry.customName) &&
        (entry.debit || entry.credit)
      );
  
      if (hasValidEntry) {
        saveEntries();
      }
    };
  }, [entries, saveEntries]);
  

  return (
    <div className="p-4 max-w-6xl mx-auto font-mono">
      <div className="flex justify-between items-center mb-4">
        <div><strong>Shift Date:</strong> {user.shiftDate}</div>
        <div><strong>Shift No:</strong> {user.shiftNo}</div>
      </div>

      <h2 className="text-center text-xl font-bold bg-blue-600 text-white py-2 mb-4">DAY BOOK ENTRY</h2>

      {/* Saved Read-only Table */}
      {savedEntries.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Saved Entries</h3>
          <table className="w-full border text-sm bg-gray-50">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-2 py-1">Entry Type</th>
                <th className="border px-2 py-1">Account Name</th>
                <th className="border px-2 py-1">Debit</th>
                <th className="border px-2 py-1">Credit</th>
                <th className="border px-2 py-1">Description</th>
              </tr>
            </thead>
            <tbody>
              {savedEntries.map((entry, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1">{entry.entryType}</td>
                  <td className="border px-2 py-1">{entry.accountName}</td>
                  <td className="border px-2 py-1 text-right">{entry.debit}</td>
                  <td className="border px-2 py-1 text-right">{entry.credit}</td>
                  <td className="border px-2 py-1">{entry.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editable Entry Table */}
      <table className="w-full border text-sm">
        <thead className="bg-blue-700 text-white">
          <tr>
            <th className="border px-2 py-1">Entry type</th>
            <th className="border px-2 py-1">Account Name</th>
            <th className="border px-2 py-1">Debit</th>
            <th className="border px-2 py-1">Credit</th>
            <th className="border px-2 py-1">Description</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((row, index) => (
            <tr key={index}>
              <td className="border px-1 py-1">
                <select
                  value={row.entryType}
                  onChange={(e) => handleChange(index, 'entryType', e.target.value)}
                  className="w-full"
                >
                  <option value="">--Select--</option>
                  <option value="BANK PAYMENT">BANK PAYMENT</option>
                  <option value="BANK RECEIPT">BANK RECEIPT</option>
                  <option value="CASH PAYMENT">CASH PAYMENT</option>
                  <option value="CASH RECEIPT">CASH RECEIPT</option>
                  <option value="JOURNAL">JOURNAL</option>
                  <option value="PURCHASE">PURCHASE</option>
                  <option value="SALES">SALES</option>
                </select>
              </td>
              <td className="border px-1 py-1">
                <select
                  value={row.accountName}
                  onChange={(e) => handleChange(index, 'accountName', e.target.value)}
                  className="w-full mb-1"
                >
                  <option value="">--Select--</option>
                  <option value="__OTHER__">-- Other --</option>
                  {customers.map(cust => (
                    <option key={cust.customerId} value={cust.accountName}>
                      {cust.accountName}
                    </option>
                  ))}
                </select>
                {row.accountName === '__OTHER__' && (
                  <input
                    type="text"
                    placeholder="Enter Name"
                    value={row.customName}
                    onChange={(e) => handleChange(index, 'customName', e.target.value)}
                    className="w-full"
                  />
                )}
              </td>
              <td className="border px-1 py-1">
                <input
                  type="number"
                  value={row.debit}
                  onChange={(e) => handleChange(index, 'debit', e.target.value)}
                  className="w-full text-right"
                />
              </td>
              <td className="border px-1 py-1">
                <input
                  type="number"
                  value={row.credit}
                  onChange={(e) => handleChange(index, 'credit', e.target.value)}
                  className="w-full text-right"
                />
              </td>
              <td className="border px-1 py-1">
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  className="w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-4 mt-4">
        <button
          onClick={addRow}
          disabled={isSaving}
          className="bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
        >
          {isSaving ? 'Saving...' : 'Save & Add New'}
        </button>
      </div>
      
      {lastSaved && (
        <div className="mt-2 text-sm text-gray-500">
          Last saved at: {lastSaved}
        </div>
      )}
    </div>
  );
};

export default DayBookEntry;