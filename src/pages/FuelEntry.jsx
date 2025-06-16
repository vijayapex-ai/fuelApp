import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/GstBill.css';
import CustomerDropdown from '../components/reusable/CustomerDropdown' 
import {useUser} from '../contextApi/UserContext';

const FuelEntry = () => {
  const [form, setForm] = useState({
    billNumber: '', partyName: '', indentNumber: '', billPrint: 'Yes',
    modeOfSales: 'Cash', vehicleNumber: '', saleType: 'S', discount: '',
    code: '', productName: '', unit: '', qty: '', rate: '', amount: '',
    productList: [],
  });
  const {user} = useUser();

  const [productOptions, setProductOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    // Fetch all required data
    const fetchData = async () => {
      try {
        const [productsRes, customersRes, billRes] = await Promise.all([
          axios.get('http://localhost:5000/api/products'),
          axios.get('http://localhost:5000/api/customers'),
          axios.get('http://localhost:5000/api/billEntry/next-bill-number'),
        ]);
        
        setProductOptions(productsRes.data);
        console.log(productsRes)
        setCustomerOptions(customersRes.data);

        setForm((prev) => ({
          ...prev,
          billNumber: billRes.data.nextBillNumber.toString()
        }));

      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  // Time Update
  useEffect(() => {
      const interval = setInterval(() => {
        setCurrentTime(new Date().toLocaleTimeString());
      }, 1000);
  
      // Cleanup on component unmount
      return () => clearInterval(interval);
    }, []);

  useEffect(() => {
  }, [productOptions]);

    const handleChange = (field, value) => {
      const updatedForm = { ...form, [field]: value };
    
      if (field === 'partyName') {
        const selectedCustomer = customerOptions.find(c => c.accountName === value);
        if (selectedCustomer) {
          axios.get(`http://localhost:5000/api/vehicles/${selectedCustomer.customerId}`)
            .then(res => setVehicleOptions(res.data))
            .catch(err => console.error('Error fetching vehicles:', err));
        } else {
          setVehicleOptions([]);
        }
      }
        
      // Calculate amount if qty is changed
      if (field === 'qty') {
        const qty = parseFloat(value);
        const rate = parseFloat(updatedForm.rate);
        if (!isNaN(qty) && !isNaN(rate)) {
          updatedForm.amount = (qty * rate).toFixed(2);
        }
      }
      
      // Calculate qty if amount is changed
      if (field === 'amount') {
        const amount = parseFloat(value);
        const rate = parseFloat(updatedForm.rate);
        if (!isNaN(amount) && !isNaN(rate) && rate !== 0) {
          updatedForm.qty = (amount / rate).toFixed(3);
        }
      }
      
      // Recalculate if rate is changed
      if (field === 'rate') {
        const rate = parseFloat(value);
        const qty = parseFloat(updatedForm.qty);
        if (!isNaN(rate)) {
          if (!isNaN(qty)) {
            updatedForm.amount = (qty * rate).toFixed(2);
          } else if (updatedForm.amount) {
            const amount = parseFloat(updatedForm.amount);
            if (!isNaN(amount) && rate !== 0) {
              updatedForm.qty = (amount / rate).toFixed(3);
            }
          }
        }
      }
    
      setForm(updatedForm);
    };
  
  const handleProductChange = (e) => {
    const selectedProduct = productOptions.find(p => p.name === e.target.value);
    if (!selectedProduct) return;
  
    const updatedForm = { 
      ...form,
      productName: selectedProduct.name,
      code: selectedProduct.productId,
      unit: "LTR",
      rate: selectedProduct.rate
    };
  
    // Recalculate based on what the user has already entered
    if (form.qty) {
      updatedForm.amount = (parseFloat(form.qty) * parseFloat(updatedForm.rate)).toFixed(2);
    } else if (form.amount) {
      updatedForm.qty = (parseFloat(form.amount) / parseFloat(updatedForm.rate)).toFixed(3);
    }
  
    setForm(updatedForm);
  };

  const handleCodeChange = (e) => {
    const productId = e.target.value;
    handleChange('code', productId);
  
    const selectedProduct = productOptions.find(p => p.productId == productId);
    if (selectedProduct) {
      const updatedForm = { 
        ...form,
        code: selectedProduct.productId,
        productName: selectedProduct.name,
        unit: "LTR",
        rate: selectedProduct.rate
      };
  
      // Recalculate based on what the user has already entered
      if (form.qty) {
        updatedForm.amount = (parseFloat(form.qty) * parseFloat(updatedForm.rate)).toFixed(2);
      } else if (form.amount) {
        updatedForm.qty = (parseFloat(form.amount) / parseFloat(updatedForm.rate)).toFixed(3);
      }
  
      setForm(updatedForm);
    }
  };

  const handleAddProduct = () => {
    const selectedProduct = productOptions.find(p => p.productId == form.code);
    if (!selectedProduct) return;
  
    const newProduct = {
      code: form.code, 
      productName: form.productName, 
      unit: form.unit,
      gstProduct: selectedProduct.gstProduct, // This is crucial
      qty: form.qty, 
      rate: form.rate, 
      amount: form.amount
    };
    
    setForm({
      ...form,
      productList: [...form.productList, newProduct],
      code: '', productName: '', unit: '', qty: '', rate: '', amount: ''
    });
  };


  const handleSaveBill = async () => {
    try {
      const payload = {
        ...form,
        shiftNo: user.shiftNo,
        shiftDate: user.shiftDate,
      };
  
      const res = await axios.post('http://localhost:5000/api/billEntry/save', payload);
      alert('✅ Bill saved successfully!');
      console.log(res.data);
    } catch (err) {
      console.error('❌ Error saving bill:', err);
      alert('❌ Failed to save bill');
    }
  };
  
  
  return (
    <div className="form-container">
      <div className="header">
        <span>Shift Date: {new Date().toLocaleDateString()}</span>
        <strong>Bill Entry</strong>
        <div>
          <div>User Name: {user.username}</div>
          <div>Shift : {user.shiftNo}</div>
          <div>Shift Date: {user.shiftDate}</div>
          <div>Time: {currentTime}</div> {/* Updated Time */}
        </div>
      </div>

      <hr className="my-4" />

      <div className="grid grid-cols-3 gap-4 mb-4">
      <label htmlFor="billPrint" className="block text-sm font-medium text-gray-700 mb-1">Bill Print</label>
        <select
          id="billPrint"
          value={form.billPrint}
          onChange={(e) => handleChange('billPrint', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        <input 
          type="text" 
          placeholder="Bill Number" 
          value={form.billNumber} 
          readOnly 
          className="input bg-gray-100 cursor-not-allowed" 
        />

        <select value={form.modeOfSales} onChange={(e) => handleChange('modeOfSales', e.target.value)} className="input">
          <option value="Cash">Cash</option>
          <option value="Credit">Credit</option>
        </select>

        {form.modeOfSales === 'Credit' ? (
          <>
          <CustomerDropdown
            value={form.partyName}
            onChange={(val) => handleChange('partyName', val)}
            showVehicleDropdown={true}
            onVehicleChange={(val) => handleChange('vehicleNumber', val)}
            vehicleValue={form.vehicleNumber}
          />
          <input type="text" placeholder="Indent Number" value={form.indentNumber} onChange={(e) => handleChange('indentNumber', e.target.value)} className="input" />
          </>

        ) : (
          <>
          <input type="text" placeholder="Party Name" value={form.partyName} onChange={(e) => handleChange('partyName', e.target.value)} className="input" />
          <input type="text" placeholder="Vehcile Number" value={form.vehicleNumber} onChange={(e) => handleChange('vehicleNumber', e.target.value)} className="input" />
          </>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        <input
          list="productCodes"
          type="text"
          placeholder="Code"
          value={form.code}
          onChange={handleCodeChange}
          className="input"
        />
        <datalist id="productCodes">
          {productOptions.map(p => (
            <option key={p.productId} value={p.productId}>
              {p.name} {p.category}
            </option>
          ))}
        </datalist>        

        <select 
          value={form.productName} 
          onChange={handleProductChange} 
          className="input"
        >
          <option value="">Select Product</option>
          {productOptions.map((p) => (
            <option key={p.productId} value={p.name}>
              {p.name} {p.category}
            </option>
          ))}
        </select>

        <input type="text" placeholder="Unit" value={form.unit} readOnly className="input" />
        <input type="number" placeholder="Qty" value={form.qty} onChange={(e) => handleChange('qty', e.target.value)} className="input" min="0" step="0.001" />
        <input type="number" placeholder="Rate" value={form.rate} onChange={(e) => handleChange('rate', e.target.value)} className="input" min="0" step="0.01" />
        <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => handleChange('amount', e.target.value)} className="input" min="0" step="0.01" />
        <button className="btn bg-blue-500 text-white" onClick={handleAddProduct}>Add</button>
      </div>

      <table className="w-full table-auto border text-sm mb-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">S.No</th>
            <th className="p-2">Code</th>
            <th className="p-2">Product</th>
            <th className="p-2">Unit</th>
            <th className="p-2">Qty</th>
            <th className="p-2">Rate</th>
            <th className="p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {form.productList.map((item, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2 text-center">{idx + 1}</td>
              <td className="p-2 text-center">{item.code}</td>
              <td className="p-2">{item.productName}</td>
              <td className="p-2 text-center">{item.unit}</td>
              <td className="p-2 text-right">{parseFloat(item.qty).toFixed(3)}</td>
              <td className="p-2 text-right">{parseFloat(item.rate).toFixed(2)}</td>
              <td className="p-2 text-right">{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right">
        <button 
          onClick={handleSaveBill} 
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Save Bill
        </button>
      </div>

    </div>
  );
};

export default FuelEntry;