const fs = require('fs');

let f = fs.readFileSync('GlobalNewOrderPopup.jsx', 'utf8');

const anchor = `                  {/* Total bill */}`;
const insertion = `                  {/* Customer Note */}
                  {((popupOrder || newOrder)?.restaurantNote || (popupOrder || newOrder)?.note) && (
                    <div className="mb-4 bg-orange-50 p-3 rounded-lg border border-orange-200 shadow-sm">
                      <p className="text-[11px] font-bold text-orange-800 mb-1 uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Note from Customer
                      </p>
                      <p className="text-sm font-medium text-orange-950">
                        {(popupOrder || newOrder)?.restaurantNote || (popupOrder || newOrder)?.note}
                      </p>
                    </div>
                  )}

                  {/* Total bill */}`;

f = f.split(anchor).join(insertion);

fs.writeFileSync('GlobalNewOrderPopup.jsx', f);
console.log("Success");
