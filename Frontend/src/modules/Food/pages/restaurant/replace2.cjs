const fs = require('fs');

let f = fs.readFileSync('OrdersMain.jsx', 'utf8');

// 1. Map restaurantNote in transformOrderForList & lists
f = f.split('itemsSummary: buildOrderItemsSummary(order.items),').join(`itemsSummary: buildOrderItemsSummary(order.items),
  restaurantNote: order.restaurantNote || order.note || null,`);

// 2. Pass restaurantNote as prop where <OrderCard is used
f = f.split('itemsSummary={order.itemsSummary}').join(`itemsSummary={order.itemsSummary}
                restaurantNote={order.restaurantNote}`);

// 3. Add to OrderCard component signature
f = f.split(`  itemsSummary,
  paymentMethod,`).join(`  itemsSummary,
  restaurantNote,
  paymentMethod,`);
f = f.split(`  itemsSummary,\r\n  paymentMethod,`).join(`  itemsSummary,\r\n  restaurantNote,\r\n  paymentMethod,`);

// 4. Add to onSelect?.({ ... }) in OrderCard
f = f.split(`            itemsSummary,
            paymentMethod,`).join(`            itemsSummary,
            restaurantNote,
            paymentMethod,`);
f = f.split(`            itemsSummary,\r\n            paymentMethod,`).join(`            itemsSummary,\r\n            restaurantNote,\r\n            paymentMethod,`);

// 5. Add popup display in bottom sheet
const oldPopup = `              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Items</p>
                <p className="text-xs text-gray-600">
                  {selectedOrder.itemsSummary}
                </p>
              </div>`;
const oldPopupCRLF = oldPopup.replace(/\n/g, '\r\n');

const newPopup = `              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Items</p>
                <p className="text-xs text-gray-600">
                  {selectedOrder.itemsSummary}
                </p>
              </div>

              {selectedOrder.restaurantNote && (
                <div className="mb-3 bg-orange-50 p-2 rounded-lg border border-orange-100">
                  <p className="text-[11px] font-medium text-orange-800 mb-0.5">Note from Customer</p>
                  <p className="text-xs text-orange-900">
                    {selectedOrder.restaurantNote}
                  </p>
                </div>
              )}`;
const newPopupCRLF = newPopup.replace(/\n/g, '\r\n');

if (f.includes(oldPopupCRLF)) {
  f = f.replace(oldPopupCRLF, newPopupCRLF);
} else {
  f = f.replace(oldPopup, newPopup);
}

fs.writeFileSync('OrdersMain.jsx', f);
console.log("Success");
