import React, { useEffect, useState } from 'react';
import '../styles/AssignVehicle.css';

const AssignVehicle = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [vehicleNumbers, setVehicleNumbers] = useState(['']);
  const [existingVehicles, setExistingVehicles] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/customers')
      .then(res => res.json())
      .then(setCustomers);
  }, []);

  const handleCustomerChange = e => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    fetch(`http://localhost:5000/api/vehicles/${id}`)
      .then(res => res.json())
      .then(data => {
        const vehicles = data || [];
        setVehicleNumbers(vehicles.map(v => v.vehicleNumber) || ['']);
        setExistingVehicles(vehicles);
      });
  };

  const handleVehicleChange = (i, value) => {
    const updated = [...vehicleNumbers];
    updated[i] = value.toUpperCase(); // Convert to uppercase
    setVehicleNumbers(updated);
  };

  const addVehicleField = () => setVehicleNumbers([...vehicleNumbers, '']);

  const removeVehicleField = i => {
    const updated = [...vehicleNumbers];
    updated.splice(i, 1);
    setVehicleNumbers(updated);
  };

  const handleSave = async () => {
    if (!selectedCustomerId) return alert('Select a customer.');
    const validVehicles = vehicleNumbers.filter(v => v.trim() !== '');
    if (!validVehicles.length) return alert('Enter at least one vehicle number.');

    const res = await fetch(`http://localhost:5000/api/vehicles/${selectedCustomerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicles: validVehicles })
    });

    if (res.ok) {
      alert('Saved successfully.');
      // Re-fetch updated vehicles
      fetch(`http://localhost:5000/api/vehicles/${selectedCustomerId}`)
        .then(res => res.json())
        .then(data => {
          setExistingVehicles(data || []);
          setVehicleNumbers(data.map(v => v.vehicleNumber) || ['']);
        });
    } else {
      alert('Failed to save.');
    }
  };

  return (
    <div className="assign-vehicle-container">
      <h2>Assign Vehicle Numbers</h2>

      <select value={selectedCustomerId} onChange={handleCustomerChange}>
        <option value="">-- Select Account Name --</option>
        {customers.map(c => (
          <option key={c.customerId} value={c.customerId}>
            {c.accountName}
          </option>
        ))}
      </select>

      {vehicleNumbers.map((v, i) => (
        <div key={i} className="vehicle-field">
          <input
            type="text"
            value={v}
            placeholder={`Vehicle #${i + 1}`}
            onChange={e => handleVehicleChange(i, e.target.value)}
          />
          {i > 0 && (
            <button className="remove-btn" onClick={() => removeVehicleField(i)}>
              Remove
            </button>
          )}
        </div>
      ))}

      <button className="add-btn" onClick={addVehicleField}>
        Add Another Vehicle
      </button>
      <button className="save-btn" onClick={handleSave}>
        Save
      </button>

      {existingVehicles.length > 0 && (
        <div className="existing-vehicles">
          <h3>Previously Assigned Vehicles</h3>
          <ul>
            {existingVehicles.map((v, i) => (
              <li key={i}>{v.vehicleNumber}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AssignVehicle;