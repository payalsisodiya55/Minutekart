const fs = require('fs');

let f = fs.readFileSync('OrdersMain.jsx', 'utf8');

// 1. Map restaurantNote in transformOrderForList & lists
f = f.replace(/itemsSummary: buildOrderItemsSummary\(order\.items\),/g, `itemsSummary: buildOrderItemsSummary(order.items),
  restaurantNote: order.restaurantNote || order.note || null,`);

// 2. Pass restaurantNote as prop where <OrderCard is used
f = f.replace(/itemsSummary=\{order\.itemsSummary\}/g, `itemsSummary={order.itemsSummary}
                restaurantNote={order.restaurantNote}`);

// 3. Add to OrderCard component signature
f = f.replace(/itemsSummary,\n  paymentMethod,/g, `itemsSummary,
  restaurantNote,
  paymentMethod,`);

// 4. Add to onSelect?.({ ... }) in OrderCard
f = f.replace(/itemsSummary,\n            paymentMethod,/g, `itemsSummary,
            restaurantNote,
            paymentMethod,`);

// 5. Add popup display in bottom sheet
const oldPopup = `              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Items</p>
                <p className="text-xs text-gray-600">
                  {selectedOrder.itemsSummary}
                </p>
              </div>`;

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

f = f.replace(oldPopup, newPopup);

fs.writeFileSync('OrdersMain.jsx', f);
