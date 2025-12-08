// ------------------------------
// FULL MENU JS w/ TOTAL CALC
// ------------------------------

/*
Behavior:
- Keeps group toggle, add/added toggle, quantity plus/minus, portion button toggle
- Persists quantities, added state, group open state, and portion selection to localStorage
- Adds a TOTAL section and updates it live
- NEW: Includes delivery zones, delivery fee, and a final total for WhatsApp
*/

// ------------------------------
// HELPERS
// ------------------------------

function parsePriceFromText(text) {
    if (!text) return 0;

    // normalize all hyphens to a single dash
    text = text.replace(/—/g, "-").replace(/–/g, "-");

    // always extract the part AFTER the dash
    const parts = text.split("-");
    if (parts.length < 2) return 0;

    // Example: " 50 Ksh" → "50"
    const priceText = parts[1].replace(/\D/g,"").trim(); // remove all non-digits
    return parseInt(priceText, 10) || 0;

}


function formatShillings(n) {
    return n.toLocaleString('en-KE');
}

function ensureTotalElement() {
    let totalWrapper = document.getElementById('order-total');
    if (!totalWrapper) {
        const grid = document.querySelector('.food-grid');
        totalWrapper = document.createElement('div');
        totalWrapper.id = 'order-total';
        totalWrapper.style.marginTop = '20px';
        totalWrapper.innerHTML =
            `<h2 style="font-weight:700;">TOTAL: <span id="totalAmount">0</span> shillings</h2>`;
        grid.parentNode.insertBefore(totalWrapper, grid.nextSibling);
    }
}


// ------------------------------
// PORTION BUTTON TOGGLE FUNCTIONALITY
// ------------------------------
// Handle portion button toggles



document.querySelectorAll('.portion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const foodItem = btn.closest('.food-item');
    const isSingleSelect = btn.dataset.singleSelect && btn.dataset.singleSelect.toLowerCase() === "true";


    if (isSingleSelect) {
      // Frozen Fish: single-select with deselect option
      if (btn.classList.contains('selected')) {
        // Already selected → deselect it
        btn.classList.remove('selected');
      } else {
        // Clear all others, then select this one
        foodItem.querySelectorAll('.portion-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      }
    } else {
      // Other categories: multi-select toggle
      btn.classList.toggle('selected');
    }

    updateTotal();
  });
});


// Handle quantity controls per portion-section
document.querySelectorAll('.portion-section').forEach(section => {
  const minus = section.querySelector('.minus');
  const plus = section.querySelector('.plus');
  const number = section.querySelector('.number');

  let count = parseInt(number.textContent);

  if (minus) {
    minus.addEventListener('click', () => {
      if (count > 0) {
        count--;
        number.textContent = count;
        updateTotal();
      }
    });
  }

  if (plus) {
    plus.addEventListener('click', () => {
      count++;
      number.textContent = count;
      updateTotal();
    });
  }
});

// -------------------------
// ADD BUTTON HANDLER
// -------------------------
document.querySelectorAll('.food-item').forEach((item, index) => {
  const addBtn = item.querySelector('.add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      localStorage.setItem(`added_${index}`, "true");
      updateTotal();
    });
  }
});

// -------------------------
// TOTAL CALCULATION
// -------------------------
function updateTotal() {
  ensureTotalElement();
  const totalEl = document.getElementById('totalAmount');
  const items = document.querySelectorAll('.food-item');
  let total = 0;

  items.forEach((item, index) => {
    const added = localStorage.getItem(`added_${index}`) === "true";
    if (!added) return; // Only count items that were "added"

    item.querySelectorAll('.portion-section').forEach(section => {
      const portions = section.querySelectorAll('.portion');
      const quantitySpan = section.querySelector('.quantity .number');

      if (portions.length > 0) {
        // Frozen Fish style: one quantity shared by all buttons
        portions.forEach(portion => {
          const btn = portion.querySelector('.portion-btn');
          const priceText = portion.querySelector('span')?.textContent || "";
          if (btn && btn.classList.contains('selected')) {
            const qty = parseInt(quantitySpan?.textContent || "0", 10);
            const match = priceText.match(/(\d+)\s*Ksh/);
            const unitPrice = match ? parseInt(match[1], 10) : 0;
            total += unitPrice * qty;
          }
        });
      } else {
        // Case A: Normal foods (one button + quantity per section)
        const btn = section.querySelector('.portion-btn');
        const numberSpan = section.querySelector('.number');
        if (btn && btn.classList.contains('selected')) {
          const qty = parseInt(numberSpan?.textContent || "0", 10);
          const sectionText = section.textContent.trim();
          const match = sectionText.match(/(\d+)\s*Ksh/);
          const unitPrice = match ? parseInt(match[1], 10) : 0;
          total += unitPrice * qty;
        }

        // Case B: Snacks (no portion buttons, just text + quantity)
        if (!btn) {
          const numberSpanSnack = section.querySelector('.number');
          const qtySnack = parseInt(numberSpanSnack?.textContent || "0", 10);
          const sectionTextSnack = section.textContent.trim();
          const matchSnack = sectionTextSnack.match(/(\d+)\s*Ksh/);
          const unitPriceSnack = matchSnack ? parseInt(matchSnack[1], 10) : 0;
          total += unitPriceSnack * qtySnack;
        }
      }
    });
  });

  totalEl.textContent = formatShillings(total);
  updateFormTotals();
}





// Ensure total updates correctly after page reload
window.addEventListener("load", () => {
    restoreGroupState();
    restoreAddButtons();
    restoreQuantities();
    restorePortions();
    updateTotal(); // total now reloads properly
});




// ------------------------------
// RESTORE FUNCTIONS
// ------------------------------
function restoreGroupState() {
    document.querySelectorAll('.group-toggle').forEach((toggle, index) => {
        const items = toggle.nextElementSibling;
        const saved = localStorage.getItem(`group_${index}_open`);
        items.style.display = saved === "true" ? "block" : "none";
    });
}

document.querySelectorAll('.group-toggle').forEach((toggle, index) => {
    toggle.addEventListener('click', () => {
        const items = toggle.nextElementSibling;
        const isOpen = items.style.display === 'block';
        items.style.display = isOpen ? 'none' : 'block';
        localStorage.setItem(`group_${index}_open`, !isOpen);
    });
});

document.querySelectorAll('.food-item').forEach((item, index) => {
    const minus = item.querySelector('.minus');
    const plus = item.querySelector('.plus');
    const number = item.querySelector('.number');
    const addBtn = item.querySelector('.add-btn');

    const savedQuantity = localStorage.getItem(`quantity_${index}`);
    if (savedQuantity) number.textContent = savedQuantity;

    if (minus) {
        minus.addEventListener('click', () => {
            let val = parseInt(number.textContent, 10);
            if (val > 1) {
                number.textContent = val - 1;
                localStorage.setItem(`quantity_${index}`, number.textContent);
                updateTotal();
            }
        });
    }

    if (plus) {
        plus.addEventListener('click', () => {
            let val = parseInt(number.textContent, 10);
            number.textContent = val + 1;
            localStorage.setItem(`quantity_${index}`, number.textContent);
            updateTotal();
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const portionButtons = item.querySelectorAll('.portion-btn');

            if (addBtn.classList.contains('added')) {
                addBtn.classList.remove('added');
                addBtn.textContent = "ADD";
                localStorage.setItem(`added_${index}`, false);
                number.textContent = 1;
                localStorage.setItem(`quantity_${index}`, 1);
                portionButtons.forEach(btn => btn.classList.remove('selected'));
                localStorage.removeItem(`portion_${index}`);
            } else {
                addBtn.classList.add('added');
                addBtn.textContent = "ADDED ✔";
                localStorage.setItem(`added_${index}`, true);
            }
            updateTotal();
        });
    }
});

function restoreQuantities() {
    document.querySelectorAll('.food-item').forEach((item, index) => {
        const number = item.querySelector('.number');
        const saved = localStorage.getItem(`quantity_${index}`);
        if (saved) number.textContent = saved;
    });
}

function restoreAddButtons() {
    document.querySelectorAll('.add-btn').forEach((btn, index) => {
        const saved = localStorage.getItem(`added_${index}`);
        const number = btn.closest('.food-item').querySelector('.number');
        if (saved === "true") {
            btn.classList.add('added');
            btn.textContent = "ADDED ✔";
        } else {
            btn.classList.remove('added');
            btn.textContent = "ADD";
            number.textContent = 1;
        }
    });
}

document.querySelectorAll('.food-item').forEach((item, index) => {
    const buttons = item.querySelectorAll('.portion-btn');

    // Restore saved portion for this item
    const savedPortion = localStorage.getItem(`portion_${index}`);
    if (savedPortion && buttons.length) {
        buttons.forEach(btn => {
            const span = btn.nextElementSibling;
            if (span && parsePriceFromText(span.textContent) === parseInt(savedPortion, 10)) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
                // Also mark the add button as added so total will recalc
        const addBtn = item.querySelector('.add-btn');
        if (addBtn && !addBtn.classList.contains('added')) {
            addBtn.classList.add('added');
            addBtn.textContent = "ADDED ✔";
            localStorage.setItem(`added_${index}`, true);
        }

    }

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove "selected" from all other buttons in this item
            buttons.forEach(b => b.classList.remove('selected'));

            // Select this one
            btn.classList.add('selected');

            // Save price to localStorage
            const span = btn.nextElementSibling;
            if (span) {
                const price = parsePriceFromText(span.textContent);
                localStorage.setItem(`portion_${index}`, price);
            }

            updateTotal(); // recalc total immediately
        });
    });
});


// ------------------------------
// DELIVERY ZONES
// ------------------------------
const deliveryZones = {
    zoneA: { fee: 150, areas: ["Embakasi Village","Pipeline","Fedha","Utawala","Imara Daima","Mukuru","Donholm","Savannah","Tassia"] },
    zoneB: { fee: 350, areas: ["South B","South C","Nyayo Estate","CBD","Kilimani","Kileleshwa","Parklands","Westlands"] },
    zoneC: { fee: 450, areas: ["Karen","Runda","Gigiri","Lavington","Muthaiga","Mountain View","Thome","Kahawa Sukari"] }
};

function populateAreas() {
    Object.keys(deliveryZones).forEach(zoneId => {
        const select = document.getElementById(zoneId);
        deliveryZones[zoneId].areas.forEach(area => {
            const opt = document.createElement("option");
            opt.value = area;
            opt.textContent = area;
            select.appendChild(opt);
        });
    });
}

populateAreas();

// ------------------------------
// FORM TOTALS
// ------------------------------
let deliveryFeeDisplay;
let finalTotalDisplay;

function createTotalSections() {
    const target = document.querySelector(".order-form-card");

    deliveryFeeDisplay = document.createElement("div");
    deliveryFeeDisplay.style.marginTop = "10px";
    deliveryFeeDisplay.style.fontWeight = "bold";
    deliveryFeeDisplay.style.color = "#4ca3dd";
    deliveryFeeDisplay.textContent = "Delivery Fee: 0 Ksh";

    finalTotalDisplay = document.createElement("div");
    finalTotalDisplay.style.marginTop = "5px";
    finalTotalDisplay.style.fontWeight = "bold";
    finalTotalDisplay.style.color = "#ff5fa2";
    finalTotalDisplay.textContent = "Total: 0 Ksh";

    target.insertBefore(deliveryFeeDisplay, sendWhatsApp);
    target.insertBefore(finalTotalDisplay, sendWhatsApp);
}

createTotalSections();

function getSelectedDeliveryFee() {
    const a = document.getElementById("zoneA").value;
    const b = document.getElementById("zoneB").value;
    const c = document.getElementById("zoneC").value;

    if (a) return deliveryZones.zoneA.fee;
    if (b) return deliveryZones.zoneB.fee;
    if (c) return deliveryZones.zoneC.fee;
    return 0;
}

function updateFormTotals() {
    const foodTotal = parseInt(document.getElementById("totalAmount").textContent.replace(/,/g,"")) || 0;
    const deliveryFee = getSelectedDeliveryFee();
    const final = foodTotal + deliveryFee;

    deliveryFeeDisplay.textContent = `Delivery Fee: ${formatShillings(deliveryFee)} Ksh`;
    finalTotalDisplay.textContent = `Total: ${formatShillings(final)} Ksh`;
}

["zoneA","zoneB","zoneC"].forEach(zoneId => {
    document.getElementById(zoneId).addEventListener("change", e => {
        if (e.target.value !== "") {
            ["zoneA","zoneB","zoneC"].forEach(other => {
                if (other !== zoneId) document.getElementById(other).value = "";
            });
        }
        updateFormTotals();
        checkFormValidity();
    });
});

// ------------------------------
// WHATSAPP BUTTON
// ------------------------------
const sendBtn = document.getElementById("sendWhatsApp");
const extraInfo = document.getElementById("extraInfo");
const nameInput = document.getElementById("custName");
const phoneInput = document.getElementById("custPhone");

// Function to check if all required fields are filled
function checkFormValidity() {
    const zoneSelected =
        document.getElementById("zoneA").value ||
        document.getElementById("zoneB").value ||
        document.getElementById("zoneC").value;

    // Include extraInfo as required field
    if (nameInput.value.trim() && phoneInput.value.trim() && zoneSelected && extraInfo.value.trim()) {
        sendBtn.disabled = false;
        sendBtn.classList.add("enabled"); // Make button visually active
    } else {
        sendBtn.disabled = true;
        sendBtn.classList.remove("enabled"); // Button visually inactive
    }
}

// Listen to input changes for all required fields
[nameInput, phoneInput, extraInfo, document.getElementById("zoneA"), document.getElementById("zoneB"), document.getElementById("zoneC")].forEach(input => {
    input.addEventListener("input", checkFormValidity);
    input.addEventListener("change", checkFormValidity); // For dropdowns
});

// Initial check on page load
checkFormValidity();

// ------------------------------
// SEND TO WHATSAPP
// ------------------------------
sendBtn.addEventListener("click", () => {
    const foodTotal = parseInt(document.getElementById("totalAmount").textContent.replace(/,/g,"")) || 0;
    const deliveryFee = getSelectedDeliveryFee();
    const final = foodTotal + deliveryFee;

    const customer = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const location =
        document.getElementById("zoneA").value ||
        document.getElementById("zoneB").value ||
        document.getElementById("zoneC").value;

    const extras = extraInfo.value.trim();

    const msg =
        `Hello Catherine,%0A%0A` +
        `Name: ${customer}%0A` +
        `Phone: ${phone}%0A` +
        `Location: ${location}%0A` +
        `Extra Info: ${extras}%0A` +
        `Total: ${formatShillings(final)} Ksh`;

    const catherineNumber = "254742014253"; // Catherine's number in international format

    // Mobile app link
    const waAppLink = `whatsapp://send?phone=${catherineNumber}&text=${msg}`;
    // Web fallback link
    const waWebLink = `https://wa.me/${catherineNumber}?text=${msg}`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        window.location.href = waAppLink;
        setTimeout(() => {
            window.open(waWebLink, "_blank");
        }, 500);
    } else {
        window.open(waWebLink, "_blank");
    }
});


