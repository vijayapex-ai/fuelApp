

const generateTxtContent = (fromDate, toDate, party, bills, summaryData) => {
    const PAGE_LINES = 66; // Standard 11-inch page, 6 lines per inch
    const HEADER_LINES = 6;
    const FOOTER_LINES = 3;
    const MAX_LINES_PER_PAGE = PAGE_LINES - HEADER_LINES - FOOTER_LINES;
    
    let lines = [];
    let page = 1;
    let currentLineCount = 0;

    const addLine = (line) => {
        if (currentLineCount >= MAX_LINES_PER_PAGE) {
            lines.push(` Continued at next page ...   Run Date : ${new Date().toLocaleDateString()}            Page No. ${page}`);
            lines.push("\f"); // Form feed for page break
            currentLineCount = 0;
            page++;
            printHeader(fromDate, toDate, party, page);
        }
        lines.push(line);
        currentLineCount++;
    };

    const printHeader = (fromDate, toDate, party, page) => {
        addLine("\x1B\x78\x31       RAJASHRI FUELS,TIRUNELVELI\x1B\x30");
        addLine("");
        addLine(`\x1BG           CREDIT BILLS LIST FOR THE PERIOD ${fromDate} TO ${toDate}\x1BH`);
        addLine(`PARTY NAME : \x1BE${party.padEnd(45)} VEH. NO: ${bills.length > 0 ? bills[0].vehicle : ""}\x1BF`);
        addLine("+------------------------------------------------------------------------------+");
        addLine("| DATE    | IND.NO. | PRODUCT         |   QTY   | UNIT   |BILL NO. |   AMOUNT  |");
        addLine("+---------|---------+-----------------|---------|--------|---------|-----------+");
    };

    printHeader(fromDate, toDate, party, page);

    // Add the bill details
    bills.forEach(group => {
        addLine("");
        addLine(`\x1BE                                                          VEH. NO: ${group.vehicle}\x1BF`);
        addLine("+------------------------------------------------------------------------------+");
    
        group.bills.forEach(item => {
            const date = item.date.padEnd(9);                   
            const indNo = item.indent.toString().padStart(5).padEnd(9);     
            const unit = item.unit.toString().padStart(5).padEnd(8);        
            const billNo = item.billNo.toString().padStart(5).padEnd(9);    
            const qty = item.qty.toString().padStart(8).padEnd(9);  
            const amount = isNaN(item.amount) ? '0.00' : parseFloat(item.amount).toFixed(2).padStart(11);

            // Wrap product names longer than 15 characters
            const productLines = [];
            const productName = item.product.toString();
            for (let i = 0; i < productName.length; i += 15) {
                productLines.push(productName.substring(i, i + 15));
            }

            // Add first line with full details
            addLine(`|${date}|${indNo}|${productLines[0].padEnd(17)}|${qty}|${unit}|${billNo}|${amount}|`);
            // Add any remaining product lines, without repeating other columns
            for (let i = 1; i < productLines.length; i++) {
                addLine(`|         |         |${productLines[i].padEnd(15)}  |         |        |         |           |`);
            }
        });

        addLine("+------------------------------------------------------------------------------+");
        const total = isNaN(group.total) ? '0.00' : parseFloat(group.total).toFixed(2).padStart(10);
        addLine(`|         | TOTAL ...                 |         |        |         | ${total}|`);
        addLine("+------------------------------------------------------------------------------+");
    });

    // Summary Section (if available)
    if (summaryData) {
        addLine("");
        addLine("\x1BG       VEHICLE-WISE BILLS SUMMARY FOR THE PARTY : " + summaryData.partyName + "\x1BH");
        addLine("      +-----------------------------------------+");
        addLine("      | VEHICLE NO.                   AMOUNT    |");
        addLine("      +-----------------------------------------+");

        summaryData.vehicles.forEach(v => {
            const vehicle = v.vehicle.padEnd(24);
            const amt = parseFloat(v.amount).toFixed(2).padStart(16);
            addLine(`      |${vehicle} ${amt}|`);
            addLine("      |                                         |");
        });

        addLine("      +-----------------------------------------+");
        addLine("      | TOTAL ...                     " + parseFloat(summaryData.grandTotal).toFixed(2).padStart(10) + "|");
        addLine("      +-----------------------------------------+");
        addLine("");
        addLine("  Rupees " + numberToWords(Math.floor(summaryData.grandTotal)) + " only");
        addLine("");
        addLine("  PREPARED BY                    CHECKED BY                 AUTHORISED SIGNATORY");
        addLine("");
        addLine("");
        addLine("")
    }

    // Add final page number
    addLine(` ** END OF VEHICLE LIST **                                     Page No. ${page}`);
    
    return lines.join('\n');
};



const numberToWords = (num) => {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const thousands = ["", "Thousand", "Lakh", "Crore"];

  if (num === 0) return "Zero";

  let words = "";
  let parts = [];
  let numStr = num.toFixed(2); // 2 decimal places

  // Split into rupees and paise
  let [rupees, paise] = numStr.split(".");
  rupees = parseInt(rupees);
  paise = parseInt(paise);

  // Convert Rupees
  let i = 0;
  while (rupees > 0) {
      let chunk = rupees % 1000;
      if (chunk > 0) {
          parts.unshift(convertChunk(chunk) + " " + thousands[i]);
      }
      rupees = Math.floor(rupees / 1000);
      i++;
  }

  words += parts.join(" ") + " Rupees";

  // Convert Paise if present
  if (paise > 0) {
      words += " and " + convertChunk(paise) + " Paise";
  }

  return words.trim() + " only";
};

const convertChunk = (num) => {
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    
    let words = "";
  
    if (num >= 100) {
        words += units[Math.floor(num / 100)] + " Hundred ";
        num %= 100;
    }
    if (num >= 20) {
        words += tens[Math.floor(num / 10)] + " ";
        num %= 10;
    } else if (num >= 10) {
        words += teens[num - 10] + " ";
        num = 0;
    }
    if (num > 0) {
        words += units[num] + " ";
    }
  
    return words.trim();
  };
  

export {generateTxtContent, numberToWords, convertChunk}