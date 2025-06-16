import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/CustomerMaster.css';

const RECORDS_PER_PAGE = 25;

const CustomerMaster = () => {
  const [formData, setFormData] = useState({
    accountName: '',
    address1: '',
    address2: '',
    place: '',
    state: '',
    pinCode: '',
    tinNo: '',
    cstNo: '',
    gstNo: '',
    mobileNumber: ''
  });

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(c =>
      c.accountName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [search, customers]);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Failed to fetch customers');
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.accountName || !formData.mobileNumber) {
      alert('Account Name and Mobile Number are required');
      return;
    }

    try {
      if (editingId) {
        // Update existing customer
        await axios.put(`http://localhost:5000/api/customers/${editingId}`, formData);
        alert('Customer updated successfully');
      } else {
        // Create new customer
        await axios.post('http://localhost:5000/api/customers', formData);
        alert('Customer added successfully');
      }
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert(`Failed to save customer: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      accountName: customer.accountName,
      address1: customer.address1 || '',
      address2: customer.address2 || '',
      place: customer.place || '',
      state: customer.state || '',
      pinCode: customer.pinCode || '',
      tinNo: customer.tinNo || '',
      cstNo: customer.cstNo || '',
      gstNo: customer.gstNo || '',
      mobileNumber: customer.mobileNumber
    });
    setEditingId(customer.customerId);
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`http://localhost:5000/api/customers/${customerId}`);
        alert('Customer deleted successfully');
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      accountName: '',
      address1: '',
      address2: '',
      place: '',
      state: '',
      pinCode: '',
      tinNo: '',
      cstNo: '',
      gstNo: '',
      mobileNumber: ''
    });
    setEditingId(null);
  };

  // Pagination logic
  const indexOfLast = currentPage * RECORDS_PER_PAGE;
  const indexOfFirst = indexOfLast - RECORDS_PER_PAGE;
  const currentRecords = filteredCustomers.slice(indexOfFirst, indexOfLast);
  const totalPages = filteredCustomers.length > 0 ? Math.ceil(filteredCustomers.length / RECORDS_PER_PAGE) : 1;

  return (
    <div className="customer-master-container">
      <h2>Customer Master</h2>

      <div className="form-grid">
        {Object.keys(formData).map((key) => (
          <input
            key={key}
            name={key}
            placeholder={key.replace(/([A-Z])/g, ' $1')}
            value={formData[key]}
            onChange={handleChange}
          />
        ))}
      </div>

      <div className="action-buttons">
        <button onClick={handleSubmit}>{editingId ? 'Update' : 'Save'}</button>
        <button onClick={resetForm}>Clear</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by Account Name"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <h3>Customer List</h3>
      <table>
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Place</th>
            <th>Mobile</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentRecords.map(c => (
            <tr key={c.customerId}>
              <td>{c.accountName}</td>
              <td>{c.place}</td>
              <td>{c.mobileNumber}</td>
              <td>
                <button onClick={() => handleEdit(c)}>Edit</button>
                <button onClick={() => handleDelete(c.customerId)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={currentPage === i + 1 ? 'active' : ''}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomerMaster;