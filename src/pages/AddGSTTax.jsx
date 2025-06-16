import React, { useState, useEffect } from 'react';
import '../styles/AddGSTTax.css';

const AddGSTTax = () => {
  const [formData, setFormData] = useState({
    description: '',
    hsnCode: '',
    gstUnit: '',
    totalTax: '',
    cgst: '',
    sgst: '',
    igst: '',
    category: ''
  });
  const [taxList, setTaxList] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch('http://localhost:5000/api/gsttax')
      .then(res => res.json())
      .then(data => setTaxList(data));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      description: '',
      hsnCode: '',
      gstUnit: '',
      totalTax: '',
      cgst: '',
      sgst: '',
      igst: '',
      category: ''
    });
    setEditingId(null);
  };

  const isDuplicateDescription = () => {
    const trimmedDesc = formData.description.trim().toLowerCase();
    return taxList.some(tax =>
      tax.description.trim().toLowerCase() === trimmedDesc &&
      tax.taxId !== editingId
    );
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      alert("Description cannot be empty.");
      return;
    }

    if (isDuplicateDescription()) {
      alert("A record with this description already exists.");
      return;
    }

    const response = await fetch('http://localhost:5000/api/gsttax', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      resetForm();
      fetchData();
    }
  };

  const handleEdit = (tax) => {
    setFormData(tax);
    setEditingId(tax.taxId);
  };

  const handleUpdate = async () => {
    if (!formData.description.trim()) {
      alert("Description cannot be empty.");
      return;
    }

    if (isDuplicateDescription()) {
      alert("A record with this description already exists.");
      return;
    }

    const response = await fetch(`http://localhost:5000/api/gsttax/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      resetForm();
      fetchData();
    }
  };

  return (
    <div className="sales-tax-container">
      <h2>GST Master</h2>
      <div className="form-row">
        <input name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
        <input name="hsnCode" placeholder="HSN Code" value={formData.hsnCode} onChange={handleChange} />
        <input name="gstUnit" placeholder="GST Unit" value={formData.gstUnit} onChange={handleChange} />
        <input name="totalTax" placeholder="Total Tax %" value={formData.totalTax} onChange={handleChange} />
        <input name="cgst" placeholder="CGST %" value={formData.cgst} onChange={handleChange} />
        <input name="sgst" placeholder="SGST %" value={formData.sgst} onChange={handleChange} />
        <input name="igst" placeholder="IGST %" value={formData.igst} onChange={handleChange} />
        <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} />
        {editingId ? (
          <>
            <button onClick={handleUpdate}>Update</button>
            <button onClick={resetForm}>Cancel</button>
          </>
        ) : (
          <button onClick={handleSubmit}>Save</button>
        )}
      </div>

      <h3>Existing Records</h3>
      <table className="sales-tax-table">
        <thead>
          <tr>
            <th>Description</th><th>HSN</th><th>Unit</th><th>Total</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Category</th><th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {taxList.map(tax => (
            <tr key={tax.taxId}>
              <td>{tax.description}</td>
              <td>{tax.hsnCode}</td>
              <td>{tax.gstUnit}</td>
              <td>{tax.totalTax}</td>
              <td>{tax.cgst}</td>
              <td>{tax.sgst}</td>
              <td>{tax.igst}</td>
              <td>{tax.category}</td>
              <td><button onClick={() => handleEdit(tax)}>✏️</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AddGSTTax;
