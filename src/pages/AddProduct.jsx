import React, { useState, useEffect } from 'react';
import '../styles/AddPrice.css';

const AddProduct = () => {
  const [productList, setProductList] = useState([]);
  const [formData, setFormData] = useState({ name: '', rate: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setProductList(data));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setFormData({ name: '', rate: '' });
      fetchProducts();
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      rate: product.rate
    });
    setEditingId(product.productId);
  };

  const handleUpdate = async () => {
    const response = await fetch(`http://localhost:5000/api/products/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setFormData({ name: '', rate: '' });
      setEditingId(null);
      fetchProducts();
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', rate: '' });
    setEditingId(null);
  };

  return (
    <div className="price-form-container">
      <h2>{editingId ? 'Edit Product' : 'Add Product'}</h2>
      <div className="price-form">
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          type="number"
          name="rate"
          placeholder="Rate"
          value={formData.rate}
          onChange={handleChange}
        />

        {editingId ? (
          <>
            <button onClick={handleUpdate}>Update</button>
            <button onClick={handleCancel} className="cancel-btn">Cancel</button>
          </>
        ) : (
          <button onClick={handleSubmit}>Submit</button>
        )}
      </div>

      <h3>Product List</h3>
      <table className="price-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Rate</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {productList.map(product => (
            <tr key={product.productId}>
              <td>{product.name}</td>
              <td>{product.rate}</td>
              <td>
                <button onClick={() => handleEdit(product)}>✏️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AddProduct;
