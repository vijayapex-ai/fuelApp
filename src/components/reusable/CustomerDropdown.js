import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CustomerDropdown = ({ value, onChange, showVehicleDropdown = false, onVehicleChange, vehicleValue }) => {
  const [customerOptions, setCustomerOptions] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/customers')
      .then(res => setCustomerOptions(res.data))
      .catch(err => console.error('Error fetching customers:', err));
  }, []);

  useEffect(() => {
    const selectedCustomer = customerOptions.find(c => c.accountName === value);
    if (selectedCustomer && showVehicleDropdown) {
      axios.get(`http://localhost:5000/api/vehicles/${selectedCustomer.customerId}`)
        .then(res => setVehicleOptions(res.data))
        .catch(err => console.error('Error fetching vehicles:', err));
    }
  }, [value]);

  return (
    <>
      <select value={value} onChange={e => onChange(e.target.value)} className="input">
        <option value="">Select Party</option>
        {customerOptions.map(customer => (
          <option key={customer.customerId} value={customer.accountName}>
            {customer.accountName}
          </option>
        ))}
      </select>

      {showVehicleDropdown && (
        <select value={vehicleValue} onChange={e => onVehicleChange(e.target.value)} className="input">
          <option value="">Select Vehicle</option>
          <>
            <option value="GENSET">GENSET</option>
            {vehicleOptions.map((v, i) => (
              <option key={i} value={v.vehicleNumber}>{v.vehicleNumber}</option>
            ))}
          </>
        </select>
      )}
    </>
  );
};

export default CustomerDropdown;
