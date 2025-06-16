import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/GstBill.css';
import CustomerDropdown from '../components/reusable/CustomerDropdown' 
import { useUser } from '../contextApi/UserContext';

const GSTSalesForm = () => {
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
  const [taxOptions, setTaxOptions] = useState([]);
  const [isInterState, setIsInterState] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  useEffect(() => {
    // Fetch all required data
    const fetchData = async () => {
      try {
        const [productsRes, customersRes, taxesRes, billRes] = await Promise.all([
          axios.get('http://localhost:5000/api/productmaster'),
          axios.get('http://localhost:5000/api/customers'),
          axios.get('http://localhost:5000/api/gsttax'),
          axios.get('http://localhost:5000/api/gstbillEntry/next-bill-number')
        ]);
        
        setProductOptions(productsRes.data);
        setCustomerOptions(customersRes.data);
        setTaxOptions(taxesRes.data);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, []);

  // Add this near your data fetching to verify the data
  useEffect(() => {
  }, [productOptions, taxOptions]);

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
    
      if (field === 'saleType' && form.productName) {
        const selectedProduct = productOptions.find(p => p.productName === form.productName);
        if (selectedProduct) {
          updatedForm.rate = value === 'S' ? selectedProduct.salesRate : selectedProduct.mrp;
          if (form.qty) {
            updatedForm.amount = (parseFloat(form.qty) * parseFloat(updatedForm.rate)).toFixed(2);
          }
        }
      }
    
      if (field === 'qty' || field === 'rate') {
        const qty = parseFloat(field === 'qty' ? value : updatedForm.qty);
        const rate = parseFloat(field === 'rate' ? value : updatedForm.rate);
        if (!isNaN(qty) && !isNaN(rate)) {
          updatedForm.amount = (qty * rate).toFixed(2);
        }
      }
    
      setForm(updatedForm);
    };
  
  const handleProductChange = (e) => {
    const selectedProduct = productOptions.find(p => p.productName === e.target.value);
    if (!selectedProduct) return;
  
    const updatedForm = { 
      ...form,
      productName: selectedProduct.productName,
      code: selectedProduct.productId,
      unit: selectedProduct.unitOfMeasurement,
      gstProduct: selectedProduct.gstProduct, // Add this
      rate: form.saleType === 'S' ? selectedProduct.salesRate : selectedProduct.mrp
    };
  
    if (form.qty) {
      updatedForm.amount = (parseFloat(form.qty) * parseFloat(updatedForm.rate)).toFixed(2);
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
        productName: selectedProduct.productName,
        unit: selectedProduct.unitOfMeasurement,
        gstProduct: selectedProduct.gstProduct, // Add this line
        rate: form.saleType === 'S' ? selectedProduct.salesRate : selectedProduct.mrp
      };
  
      if (form.qty) {
        updatedForm.amount = (parseFloat(form.qty) * parseFloat(updatedForm.rate)).toFixed(2);
      }
  
      setForm(updatedForm);
    }
  };

  const handleAddProduct = () => {
    const selectedProduct = productOptions.find(p => p.productId == form.code);
    if (!selectedProduct) return;
  
    const amount = parseFloat(form.amount) || 0;
    const productTax = taxOptions.find(tax => 
      tax.description.trim().toUpperCase() === selectedProduct.gstProduct.trim().toUpperCase()
    );
    console.log(productTax.hsnCode)
    let hsnCode = '';
    
    if (productTax && productTax.hsnCode) {
      hsnCode = productTax.hsnCode;
    }
    let cgst = 0, sgst = 0, igst = 0;
  
    if (productTax) {
      if (isInterState) {
        igst = amount * (productTax.igst / 100);
      } else {
        cgst = amount * (productTax.cgst / 100);
        sgst = amount * (productTax.sgst / 100);
      }
    }
  
    const newProduct = {
      code: form.code,
      productName: form.productName,
      unit: form.unit,
      gstProduct: selectedProduct.gstProduct, // Make sure this is included
      hsnCode: hsnCode,  
      qty: form.qty,
      rate: form.rate,
      amount: form.amount,
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      igst: igst.toFixed(2)
    };
  
    setForm({
      ...form,
      productList: [...form.productList, newProduct],
      code: '', productName: '', unit: '', qty: '', rate: '', amount: ''
    });
  };


  const calculateTaxes = (products) => {
    let totalAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
  
    products.forEach(product => {
      const amount = parseFloat(product.amount) || 0;
      totalAmount += amount;
  
      // Match product's gstProduct with tax description (case insensitive)
      const productTax = taxOptions.find(tax => 
        tax.description.trim().toUpperCase() === product.gstProduct.trim().toUpperCase()
      );
    
      if (productTax) {
        if (isInterState) {
          totalIGST += amount * (productTax.igst / 100);
        } else {
          totalCGST += amount * (productTax.cgst / 100);
          totalSGST += amount * (productTax.sgst / 100);
        }
      } else {
        console.warn(`No tax found for product: ${product.productName} with GST category: ${product.gstProduct}`);
      }
    });
  
    return {
      totalAmount: totalAmount.toFixed(2),
      cgst: totalCGST.toFixed(2),
      sgst: totalSGST.toFixed(2),
      igst: totalIGST.toFixed(2),
      grandTotal: (totalAmount + totalCGST + totalSGST + totalIGST).toFixed(2)
    };
  };

  const taxSummary = calculateTaxes(form.productList);

  const handleSaveBill = async () => {
    try {
      const payload = {
        ...form,
        shiftNo: user.shiftNo,
        shiftDate: user.shiftDate,
        isInterState: isInterState // Include the interstate status
      };
  
      const res = await axios.post('http://localhost:5000/api/gstbillEntry/save', payload);
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
        <strong>GST SALES</strong>
        <div>
          <div>User Name: JAI SHANKAR</div>
          <div>Time: {currentTime}</div> {/* Updated Time */}
        </div>
      </div>

      <hr className="my-4" />

      <div className="grid grid-cols-3 gap-4 mb-4">
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
          <CustomerDropdown
            value={form.partyName}
            onChange={(val) => handleChange('partyName', val)}
            showVehicleDropdown={true}
            onVehicleChange={(val) => handleChange('vehicleNumber', val)}
            vehicleValue={form.vehicleNumber}
          />
        ) : (
          <>
          <input type="text" placeholder="Party Name" value={form.partyName} onChange={(e) => handleChange('partyName', e.target.value)} className="input" />
          <input type="text" placeholder="Vehcile Number" value={form.vehicleNumber} onChange={(e) => handleChange('vehicleNumber', e.target.value)} className="input" />
          </>

        )}

        <input type="text" placeholder="Indent Number" value={form.indentNumber} onChange={(e) => handleChange('indentNumber', e.target.value)} className="input" />

        <div className="flex items-center">
          <select value={form.saleType} onChange={(e) => handleChange('saleType', e.target.value)} className="input">
            <option value="S">Sales Rate</option>
            <option value="M">MRP</option>
          </select>

          <label className="ml-2 flex items-center">
            <input 
              type="checkbox" 
              checked={isInterState} 
              onChange={() => setIsInterState(!isInterState)} 
              className="mr-1"
            />
            Interstate
          </label>
        </div>
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
              {p.productName} ({p.category || 'STD'})
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
            <option key={p.productId} value={p.productName}>
              {p.productName} ({p.category || 'STD'})
            </option>
          ))}
        </select>

        <input type="text" placeholder="Unit" value={form.unit} readOnly className="input" />
        <input type="number" placeholder="Qty" value={form.qty} onChange={(e) => handleChange('qty', e.target.value)} className="input" min="0" step="0.01" />
        <input type="number" placeholder="Rate" value={form.rate} onChange={(e) => handleChange('rate', e.target.value)} className="input" min="0" step="0.01" />
        <input type="text" placeholder="Amount" value={form.amount} readOnly className="input" />
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
              <td className="p-2 text-right">{parseFloat(item.qty).toFixed(2)}</td>
              <td className="p-2 text-right">{parseFloat(item.rate).toFixed(2)}</td>
              <td className="p-2 text-right">{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="w-full text-sm border mt-4">
  <tbody>
    <tr className="bg-gray-50 font-bold text-gray-700">
      <td className="p-3 border">Subtotal</td>
      <td className="p-3 border text-right">₹{taxSummary.totalAmount}</td>
    </tr>

    {!isInterState && (
      <>
        <tr className="bg-gray-50">
          <td className="p-3 border font-bold text-gray-700">CGST</td>
          <td className="p-3 border text-right">₹{taxSummary.cgst}</td>
        </tr>
        <tr className="bg-gray-50">
          <td className="p-3 border font-bold text-gray-700">SGST</td>
          <td className="p-3 border text-right">₹{taxSummary.sgst}</td>
        </tr>
      </>
    )}

    {isInterState && (
      <tr className="bg-gray-50">
        <td className="p-3 border font-bold text-gray-700">IGST</td>
        <td className="p-3 border text-right">₹{taxSummary.igst}</td>
      </tr>
    )}

    <tr className="bg-gray-100 font-bold text-gray-800">
      <td className="p-3 border">Total Tax</td>
      <td className="p-3 border text-right">
        ₹{(parseFloat(taxSummary.cgst) + parseFloat(taxSummary.sgst) + parseFloat(taxSummary.igst)).toFixed(2)}
      </td>
    </tr>

    <tr className="bg-blue-100 font-bold text-blue-700 text-lg">
      <td className="p-3 border">Grand Total (Including Tax)</td>
      <td className="p-3 border text-right text-blue-600 text-xl">₹{taxSummary.grandTotal}</td>
    </tr>
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

export default GSTSalesForm;