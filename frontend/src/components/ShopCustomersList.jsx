import React, { useState } from 'react';
import { 
  User, 
  Search, 
  Calendar, 
  DollarSign, 
  Eye, 
  X, 
  ChevronRight, 
  ClipboardList, 
  ArrowUpDown, 
  MapPin
} from 'lucide-react';

export default function ShopCustomersList({ shop, orders, primaryColor }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('spent_desc'); // spent_desc, spent_asc, orders_desc, orders_asc, name_asc, name_desc, date_desc, date_asc
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const primary = primaryColor || shop.config?.theme?.primary || '#6366f1';

  // 1. Filter orders belonging to this shop
  const shopOrders = orders.filter(o => o.shop_id === shop.id);

  // 2. Group by customer to calculate statistics
  const customersMap = {};
  shopOrders.forEach(order => {
    const customerId = order.customer_id;
    const customerName = order.customer_name || 'Walk-in Customer';
    const key = customerId ? `id-${customerId}` : `name-${customerName}`;

    if (!customersMap[key]) {
      customersMap[key] = {
        id: customerId,
        name: customerName,
        totalOrders: 0,
        totalSpent: 0,
        lastPurchaseDate: new Date(0),
        cities: new Set(),
        orders: []
      };
    }

    const c = customersMap[key];
    c.totalOrders += 1;
    c.totalSpent += parseFloat(order.total_price || 0);

    const orderDate = new Date(order.created_at);
    if (orderDate > c.lastPurchaseDate) {
      c.lastPurchaseDate = orderDate;
    }

    if (order.city) {
      c.cities.add(order.city);
    }

    c.orders.push(order);
  });

  // Convert map to array and format city list
  const customersList = Object.values(customersMap).map(c => ({
    ...c,
    cities: Array.from(c.cities).join(', ') || 'N/A'
  }));

  // 3. Filter list based on search term
  const filteredCustomers = customersList.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cities.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 4. Sort list
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'spent_desc':
        return b.totalSpent - a.totalSpent;
      case 'spent_asc':
        return a.totalSpent - b.totalSpent;
      case 'orders_desc':
        return b.totalOrders - a.totalOrders;
      case 'orders_asc':
        return a.totalOrders - b.totalOrders;
      case 'date_desc':
        return b.lastPurchaseDate - a.lastPurchaseDate;
      case 'date_asc':
        return a.lastPurchaseDate - b.lastPurchaseDate;
      default:
        return 0;
    }
  });

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'pending':
        return { text: '#d97706', bg: '#fef3c7', label: 'Pending' };
      case 'confirmed':
        return { text: '#2563eb', bg: '#dbeafe', label: 'Confirmed' };
      case 'completed':
        return { text: '#16a34a', bg: '#dcfce7', label: 'Completed' };
      case 'cancelled':
        return { text: '#4b5563', bg: '#f3f4f6', label: 'Cancelled' };
      case 'rejected':
        return { text: '#e11d48', bg: '#ffe4e6', label: 'Rejected' };
      case 'delivered':
        return { text: '#059669', bg: '#ecfdf5', label: 'Delivered' };
      case 'ready_for_pickup':
        return { text: '#7c3aed', bg: '#f3e8ff', label: 'Ready for Pickup' };
      default:
        return { text: '#475569', bg: '#f1f5f9', label: status.toUpperCase() };
    }
  };

  return (
    <div style={{ width: '100%', color: '#0f172a' }}>
      {/* Header Panel */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>Customer Directory</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>View and analyze customers who purchased at your shop.</p>
      </div>

      {customersList.length === 0 ? (
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          border: '1px dashed #cbd5e1', 
          padding: '4rem 2rem', 
          textAlign: 'center',
          color: '#64748b'
        }}>
          <User size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.5, color: primary }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>No Customers Yet</h3>
          <p style={{ margin: 0 }}>Once customers place orders at your shop, their profiles and purchasing metrics will appear here.</p>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search customers by name or city..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px 12px 10px 40px', 
                  borderRadius: '12px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = primary}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpDown size={16} style={{ color: '#64748b' }} />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ 
                  padding: '10px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '0.9rem', 
                  background: 'white',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="spent_desc">Total Spent (High to Low)</option>
                <option value="spent_asc">Total Spent (Low to High)</option>
                <option value="orders_desc">Orders Count (High to Low)</option>
                <option value="orders_asc">Orders Count (Low to High)</option>
                <option value="name_asc">Name (A to Z)</option>
                <option value="name_desc">Name (Z to A)</option>
                <option value="date_desc">Last Purchased (Newest First)</option>
                <option value="date_asc">Last Purchased (Oldest First)</option>
              </select>
            </div>
          </div>

          {sortedCustomers.length === 0 ? (
            <div style={{ 
              background: 'white', 
              borderRadius: '20px', 
              border: '1px solid #e2e8f0', 
              padding: '3rem', 
              textAlign: 'center',
              color: '#64748b'
            }}>
              <p style={{ margin: 0 }}>No customers matched your search query.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="desktop-customers-view" style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Customer Name</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Location (Cities)</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Total Orders</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Total Revenue</th>
                      <th style={{ padding: '1.25rem 1.5rem' }}>Last Purchase</th>
                      <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCustomers.map((customer, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${primary}15`, color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{customer.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={14} style={{ opacity: 0.6 }} />
                            <span>{customer.cities}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '600', color: '#334155' }}>
                          {customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: '800', color: '#0f172a' }}>
                          LKR {customer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748b' }}>
                          {customer.lastPurchaseDate.getTime() > 0 ? (
                            customer.lastPurchaseDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                          <button 
                            onClick={() => setSelectedCustomer(customer)}
                            style={{ 
                              background: '#f1f5f9', border: 'none', color: '#475569', 
                              padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                              fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = `${primary}15`; e.currentTarget.style.color = primary; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                          >
                            <Eye size={15} /> View History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="mobile-customers-view" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {sortedCustomers.map((customer, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      background: 'white', 
                      borderRadius: '16px', 
                      border: '1px solid #e2e8f0', 
                      padding: '1.25rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${primary}15`, color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' }}>
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>{customer.name}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedCustomer(customer)}
                        style={{ 
                          background: 'none', border: 'none', color: primary, 
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                          fontWeight: '700', fontSize: '0.85rem'
                        }}
                      >
                        Details <ChevronRight size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Total Spent</div>
                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem', marginTop: '2px' }}>
                          LKR {customer.totalSpent.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Orders Count</div>
                        <div style={{ fontWeight: '700', color: '#334155', fontSize: '0.95rem', marginTop: '2px' }}>
                          {customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}
                        </div>
                      </div>
                      <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Last Purchase</div>
                        <div style={{ color: '#475569', fontWeight: '500', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} style={{ opacity: 0.7 }} />
                          {customer.lastPurchaseDate.getTime() > 0 ? (
                            customer.lastPurchaseDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          ) : (
                            'N/A'
                          )}
                        </div>
                      </div>
                      {customer.cities !== 'N/A' && (
                        <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Locations</div>
                          <div style={{ color: '#475569', fontWeight: '500', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} style={{ opacity: 0.7 }} />
                            <span>{customer.cities}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* VIEW CUSTOMER HISTORY DETAILS MODAL */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '700px',
            maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '1.25rem 1.5rem', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${primary}15`, color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.95rem' }}>
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{selectedCustomer.name}</h2>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Purchase History at this Shop</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Quick Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Orders</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#1e293b' }}>{selectedCustomer.totalOrders}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Revenue</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>
                    LKR {selectedCustomer.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Last Order Date</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#334155', marginTop: '2px' }}>
                    {selectedCustomer.lastPurchaseDate.getTime() > 0 ? (
                      selectedCustomer.lastPurchaseDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
              </div>

              {/* Order List Table */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClipboardList size={16} style={{ color: primary }} /> Detailed Purchases
                </h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                  {/* Modal Desktop Orders View */}
                  <div className="modal-desktop-orders" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                          <th style={{ padding: '10px 12px' }}>Order ID</th>
                          <th style={{ padding: '10px 12px' }}>Date</th>
                          <th style={{ padding: '10px 12px' }}>Product</th>
                          <th style={{ padding: '10px 12px' }}>Quantity</th>
                          <th style={{ padding: '10px 12px' }}>Total Price</th>
                          <th style={{ padding: '10px 12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCustomer.orders.map((order) => {
                          const badge = getStatusBadgeStyles(order.status);
                          return (
                            <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '700' }}>#{order.id}</td>
                              <td style={{ padding: '10px 12px', color: '#64748b' }}>
                                {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: '600', color: '#334155' }}>{order.product_id}</td>
                              <td style={{ padding: '10px 12px' }}>{order.quantity}</td>
                              <td style={{ padding: '10px 12px', fontWeight: '700' }}>LKR {parseFloat(order.total_price).toLocaleString()}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ 
                                  fontSize: '0.7rem', 
                                  fontWeight: '700', 
                                  color: badge.text, 
                                  background: badge.bg, 
                                  padding: '2px 8px', 
                                  borderRadius: '50px',
                                  display: 'inline-block'
                                }}>
                                  {badge.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal Mobile Orders View */}
                  <div className="modal-mobile-orders" style={{ display: 'none', flexDirection: 'column', gap: '8px', padding: '10px', background: '#f8fafc' }}>
                    {selectedCustomer.orders.map((order) => {
                      const badge = getStatusBadgeStyles(order.status);
                      return (
                        <div key={order.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Order #{order.id}</span>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: '700', 
                              color: badge.text, 
                              background: badge.bg, 
                              padding: '2px 8px', 
                              borderRadius: '50px'
                            }}>
                              {badge.label}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '600' }}>
                            {order.product_id} (x{order.quantity})
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            <span>{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>LKR {parseFloat(order.total_price).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button 
                onClick={() => setSelectedCustomer(null)}
                style={{ 
                  background: primary, 
                  color: 'white', 
                  border: 'none', 
                  padding: '10px 24px', 
                  borderRadius: '10px', 
                  fontWeight: '750', 
                  cursor: 'pointer',
                  boxShadow: `0 4px 6px -1px ${primary}33`
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive visibility CSS */}
      <style>{`
        @media (min-width: 769px) {
          .mobile-customers-view { display: none !important; }
          .modal-mobile-orders { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-customers-view { display: none !important; }
          .modal-desktop-orders { display: none !important; }
          .modal-mobile-orders { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
