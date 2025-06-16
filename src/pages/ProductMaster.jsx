import React, { useState, useEffect } from 'react';
import '../styles/ProductMaster.css';

const ProductMaster = () => {
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    commodityName: 'OIL PRODUCT',
    unitOfMeasurement: '',
    gstProduct: '',
    conversionFactor: '',
    salesRate: '',
    mrp: ''
  });

  const [gstList, setGstList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 25;

  useEffect(() => {
    fetchGSTList();
    fetchProducts();
  }, []);

  const fetchGSTList = async () => {
    const res = await fetch('http://localhost:5000/api/gsttax');
    const data = await res.json();
    setGstList(data.map(item => item.description));
  };

  const fetchProducts = async () => {
    const res = await fetch('http://localhost:5000/api/productmaster');
    const data = await res.json();
    setProductList(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      productName: '',
      commodityName: 'OIL PRODUCT',
      unitOfMeasurement: '',
      gstProduct: '',
      conversionFactor: '',
      salesRate: '',
      mrp: ''
    });
    setEditingId(null);
  };

  const isDuplicate = () => {
    if (productList.length === 0) return false;

    const normalizedId = formData.productId.trim().toLowerCase();
    const normalizedName = formData.productName.trim().toLowerCase();

    return productList.some(product =>
      (product.productId.toLowerCase() === normalizedId ||
       product.productName.toLowerCase() === normalizedName) &&
      product.productId !== editingId
    );
  };

  const handleSubmit = async () => {
    if (!formData.productId || !formData.productName) {
      alert("Product ID and Product Name are required.");
      return;
    }

    if (!editingId && isDuplicate()) {
      alert("Duplicate Product ID or Product Name found.");
      return;
    }

    const url = editingId
      ? `http://localhost:5000/api/productmaster/${editingId}`
      : 'http://localhost:5000/api/productmaster';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      resetForm();
      fetchProducts();
    } else {
      alert("Failed to save the product.");
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product.productId);
  };

  // Filter products based on search query
  const filteredProducts = productList.filter(product =>
    product.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate the filtered results
  const totalPages = Math.ceil(filteredProducts.length / recordsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  return (
    <div className="product-master-container">
      <h2>Product Master</h2>
      <div className="form-row">
        <input
          name="productId"
          placeholder="Product ID"
          value={formData.productId}
          onChange={handleChange}
        />
        <input
          name="productName"
          placeholder="Product Name"
          value={formData.productName}
          onChange={handleChange}
        />

        <select name="commodityName" value={formData.commodityName} onChange={handleChange}>
          <option value="OIL PRODUCT">OIL PRODUCT</option>
          <option value="CLOTH">CLOTH</option>
          <option value="WATER">WATER</option>
          <option value="COOLANT">COOLANT</option>
        </select>

        <input
          name="unitOfMeasurement"
          placeholder="Unit of Measurement"
          value={formData.unitOfMeasurement}
          onChange={handleChange}
        />

        <select name="gstProduct" value={formData.gstProduct} onChange={handleChange}>
          <option value="">Select GST Product</option>
          {gstList.map((desc, index) => (
            <option key={index} value={desc}>{desc}</option>
          ))}
        </select>

        <input
          name="conversionFactor"
          placeholder="Conversion Factor"
          value={formData.conversionFactor}
          onChange={handleChange}
        />
        <input
          name="salesRate"
          placeholder="Sales Rate"
          value={formData.salesRate}
          onChange={handleChange}
        />
        <input
          name="mrp"
          placeholder="M.R.P."
          value={formData.mrp}
          onChange={handleChange}
        />

        {editingId ? (
          <>
            <button onClick={handleSubmit}>Update</button>
            <button onClick={resetForm}>Cancel</button>
          </>
        ) : (
          <button onClick={handleSubmit}>Save</button>
        )}
      </div>

      <div className="search-pagination-controls">
        <input
          type="text"
          placeholder="Search by Product ID or Name"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // reset to first page on new search
          }}
          className="search-box"
        />
      </div>

      <h3>Product List</h3>
      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Commodity</th><th>Unit</th><th>GST</th><th>Conversion</th><th>Rate</th><th>MRP</th><th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProducts.map(product => (
            <tr key={product.productId}>
              <td>{product.productId}</td>
              <td>{product.productName}</td>
              <td>{product.commodityName}</td>
              <td>{product.unitOfMeasurement}</td>
              <td>{product.gstProduct}</td>
              <td>{product.conversionFactor}</td>
              <td>{product.salesRate}</td>
              <td>{product.mrp}</td>
              <td><button onClick={() => handleEdit(product)}>✏️</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination-controls">
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
          ◀ Previous
        </button>
        <span> Page {currentPage} of {totalPages} </span>
        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
          Next ▶
        </button>
      </div>
    </div>
  );
};

export default ProductMaster;