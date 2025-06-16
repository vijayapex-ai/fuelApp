import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PumpConfiguration.css';
import { useUser } from '../../contextApi/UserContext';

const PumpConfiguration = () => {
  const [productList, setProductList] = useState([]);
  const [rows, setRows] = useState([
    { productId: '', productName: '', pumpCode: '', initialReading: '' }
  ]);
  const [configurations, setConfigurations] = useState([]);
  const [readings, setReadings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const { user } = useUser();

  useEffect(() => {
    getProducts();
    fetchConfigurations();
    fetchOpeningReadings();
  }, [user.shiftNo, user.shiftDate]);

  const getProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProductList(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchConfigurations = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/pump-config');
      const configsWithEdit = res.data.map(config => ({
        ...config,
        isEditing: false,
        tempPumpCode: config.pumpCode
      }));
      setConfigurations(configsWithEdit);
    } catch (err) {
      console.error('Error fetching configurations:', err);
    }
  };

  const fetchOpeningReadings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/pump-config/opening', {
        params: { shift: user.shiftNo, date:user.shiftDate }
      });
      setReadings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching opening readings:', err);
    }
  };

  const addRow = () => {
    setRows([...rows, { productId: '', productName: '', pumpCode: '', initialReading: '' }]);
  };

  const removeRow = (index) => {
    const updated = [...rows];
    updated.splice(index, 1);
    setRows(updated);
  };

  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const submitData = async () => {
    const isValid = rows.every(row => row.productId && row.productName && row.pumpCode);
    if (!isValid) {
      alert("Please fill all fields before submitting.");
      return;
    }

    const cleanData = rows.map(row => ({
      productCode: row.productId,
      productName: row.productName,
      pumpCode: row.pumpCode,
    }));

    try {
      await axios.post('http://localhost:5000/api/pump-config', cleanData);

      const initialReadingEntries = rows.map(row => ({
        productCode: row.productId,
        productName: row.productName,
        pumpCode: row.pumpCode,
        openingReading: parseFloat(row.initialReading) || 0,
        closingReading: 0,
        saleLitre: 0,
        shift: user.shiftNo,
        date: user.shiftDate,
        readingDate: user.shiftDate,
      }));

      await axios.post('http://localhost:5000/api/pump-config/init-reading', {
        entries: initialReadingEntries
      });

      fetchConfigurations();
      fetchOpeningReadings();
      setRows([{ productId: '', productName: '', pumpCode: '', initialReading: '' }]);
    } catch (err) {
      console.error('Error submitting data:', err);
    }
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = configurations.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <div className="pump-config-container">
      <h2>Pump Configuration</h2>

      {rows.map((row, index) => (
        <div key={index} className="pump-row">
          <select
            value={row.productId}
            onChange={(e) => {
              const selected = productList.find(p => p.productId === parseInt(e.target.value));
              updateRow(index, 'productId', selected?.productId || '');
              updateRow(index, 'productName', selected?.name || '');
            }}
          >
            <option value="">Select Product ID</option>
            {productList.map(product => (
              <option key={product.productId} value={product.productId}>
                {product.productId}
              </option>
            ))}
          </select>

          <input placeholder="Product Name" value={row.productName} readOnly />

          <input
            placeholder="Pump Code"
            value={row.pumpCode}
            onChange={(e) => updateRow(index, 'pumpCode', e.target.value)}
          />

          <input
            placeholder="Initial Reading"
            type="number"
            value={row.initialReading}
            onChange={(e) => updateRow(index, 'initialReading', e.target.value)}
          />

          {index > 0 && (
            <button onClick={() => removeRow(index)}>Remove</button>
          )}
        </div>
      ))}

      <button onClick={addRow}>Add Row</button>
      <button onClick={submitData}>Submit</button>

      <h3>Submitted Configurations</h3>
      <table>
        <thead>
          <tr>
            <th>Product Code</th>
            <th>Product Name</th>
            <th>Pump Code</th>
            <th>Opening Reading</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentRecords.map((config, idx) => {
            const matchedReading = readings.find(r => r.pumpCode === config.pumpCode);
            return (
              <tr key={config.id}>
                <td>{config.productCode}</td>
                <td>{config.productName}</td>
                <td>
                  {config.isEditing ? (
                    <input
                      value={config.tempPumpCode}
                      onChange={(e) => {
                        const updated = [...configurations];
                        updated[indexOfFirstRecord + idx].tempPumpCode = e.target.value;
                        setConfigurations(updated);
                      }}
                    />
                  ) : (
                    config.pumpCode
                  )}
                </td>
                <td>{matchedReading ? matchedReading.openingReading : '0.00'}</td>
                <td>
                  {config.isEditing ? (
                    <button
                      onClick={async () => {
                        try {
                          const updatedConfig = configurations[indexOfFirstRecord + idx];
                          await axios.put(
                            `http://localhost:5000/api/pump-config/${updatedConfig.id}`,
                            { pumpCode: updatedConfig.tempPumpCode }
                          );
                          fetchConfigurations();
                        } catch (err) {
                          console.error('Error updating:', err);
                        }
                      }}
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const updated = [...configurations];
                        updated[indexOfFirstRecord + idx].isEditing = true;
                        setConfigurations(updated);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="pagination">
        {Array.from({ length: Math.ceil(configurations.length / recordsPerPage) }, (_, i) => (
          <button key={i + 1} onClick={() => setCurrentPage(i + 1)}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PumpConfiguration;
