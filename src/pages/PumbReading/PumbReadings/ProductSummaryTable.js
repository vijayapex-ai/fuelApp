import React from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';

const ProductSummaryTable = ({ productTotals }) => {
  return (
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
          <TableCell>No. of Pumps</TableCell>
          <TableCell>Product Name</TableCell>
          <TableCell align="right">By Reading</TableCell>
          <TableCell align="right">By Bill (LTR)</TableCell>
          <TableCell align="right">Diff (Reading - Bill)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {productTotals.map((product, index) => (
          <TableRow key={index} hover>
            <TableCell>{product.pumpCount}</TableCell>
            <TableCell>{product.productName}</TableCell>
            <TableCell align="right">{product.saleTotal}</TableCell>
            <TableCell align="right">{product.billQty}</TableCell>
            <TableCell 
              align="right"
              sx={{ 
                color: parseFloat(product.difference) !== 0 ? 'red' : 'inherit',
                fontWeight: parseFloat(product.difference) !== 0 ? 'bold' : 'normal'
              }}
            >
              {product.difference}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProductSummaryTable;