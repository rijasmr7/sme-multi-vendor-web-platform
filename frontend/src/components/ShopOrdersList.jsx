import React, { useState } from 'react';
import axios from 'axios';
import { 
  ClipboardList, 
  Eye, 
  XCircle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Loader2, 
  X,
  Package,
  Calendar,
  DollarSign
} from 'lucide-react';

const API_GATEWAY = 'http://localhost:5000';

export default function ShopOrdersList({ shop, orders, onOrdersUpdated, primaryColor }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('vendorToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const refreshOrders = async () => {
    const token = localStorage.getItem('vendorToken');
    if (!token) return;
    try {
      const vendorId = JSON.parse(atob(token.split('.')[1])).id;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_GATEWAY}/orders/vendor/${vendorId}`, config);
      if (res.data.success) {
        onOrdersUpdated(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to refresh orders:', err);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setIsUpdating(true);
    try {
      const res = await axios.put(
        `${API_GATEWAY}/orders/${orderId}/status`,
        { status: newStatus },
        getAuthHeaders()
      );
      if (res.data.success) {
        await refreshOrders();
        // Reset modals
        setSelectedOrder(null);
        setRejectingOrder(null);
      }
    } catch (err) {
      alert('Failed to update order status: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUpdating(false);
    }
  };

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
        <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>Orders Management</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Track, verify details, and manage customer order lifecycles.</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          border: '1px dashed #cbd5e1', 
          padding: '4rem 2rem', 
          textAlign: 'center',
          color: '#64748b'
        }}>
          <ClipboardList size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>No Orders Yet</h3>
          <p style={{ margin: 0 }}>When customers buy items from your storefront, they will show up here.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (hidden on mobile) */}
          <div className="desktop-orders-view" style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Order</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Date</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Product Info</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Total</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const badge = getStatusBadgeStyles(order.status);
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="hover:bg-slate-50/50">
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '700', color: '#0f172a' }}>#{order.id}</td>
                      <td style={{ padding: '1rem 1.5rem', color: '#64748b' }}>
                        {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{order.product_id}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Qty: {order.quantity} x LKR {parseFloat(order.unit_price).toLocaleString()}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: '800', color: '#0f172a' }}>
                        LKR {parseFloat(order.total_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '700', 
                          color: badge.text, 
                          background: badge.bg, 
                          padding: '4px 10px', 
                          borderRadius: '50px',
                          display: 'inline-block'
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          
                          {/* View details - always shown */}
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            style={{ 
                              background: '#f1f5f9', border: 'none', color: '#475569', 
                              padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Eye size={15} /> View
                          </button>

                          {/* Reject - only shown for pending and confirmed */}
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <button 
                              onClick={() => setRejectingOrder(order)}
                              style={{ 
                                background: '#ffe4e6', border: 'none', color: '#e11d48', 
                                padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              <XCircle size={15} /> Reject
                            </button>
                          )}

                          {/* Complete - only shown for confirmed */}
                          {order.status === 'confirmed' && (
                            <button 
                              onClick={() => handleStatusUpdate(order.id, 'completed')}
                              style={{ 
                                background: '#dcfce7', border: 'none', color: '#16a34a', 
                                padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                                fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              <CheckCircle size={15} /> Complete
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (hidden on desktop) */}
          <div className="mobile-orders-view" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {orders.map((order) => {
              const badge = getStatusBadgeStyles(order.status);
              return (
                <div 
                  key={order.id} 
                  style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0', 
                    padding: '1.25rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>Order #{order.id}</span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '700', 
                      color: badge.text, 
                      background: badge.bg, 
                      padding: '4px 10px', 
                      borderRadius: '50px'
                    }}>
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#1e293b', marginTop: '4px' }}>
                      <Package size={14} />
                      {order.product_id} (x{order.quantity})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '750', color: '#0f172a', marginTop: '4px', fontSize: '0.95rem' }}>
                      <DollarSign size={14} />
                      LKR {parseFloat(order.total_price).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '4px' }}>
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      style={{ 
                        flex: 1, background: '#f1f5f9', border: 'none', color: '#475569', 
                        padding: '10px', borderRadius: '10px', cursor: 'pointer',
                        fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.85rem'
                      }}
                    >
                      <Eye size={14} /> View
                    </button>

                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button 
                        onClick={() => setRejectingOrder(order)}
                        style={{ 
                          flex: 1, background: '#ffe4e6', border: 'none', color: '#e11d48', 
                          padding: '10px', borderRadius: '10px', cursor: 'pointer',
                          fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.85rem'
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    )}

                    {order.status === 'confirmed' && (
                      <button 
                        onClick={() => handleStatusUpdate(order.id, 'completed')}
                        style={{ 
                          flex: 1, background: '#dcfce7', border: 'none', color: '#16a34a', 
                          padding: '10px', borderRadius: '10px', cursor: 'pointer',
                          fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.85rem'
                        }}
                      >
                        <CheckCircle size={14} /> Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px',
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
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Order Invoice #{selectedOrder.id}</h2>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Status Indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                <span style={{ fontWeight: '700', color: '#475569' }}>Current Status</span>
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: '800', 
                  color: getStatusBadgeStyles(selectedOrder.status).text, 
                  background: getStatusBadgeStyles(selectedOrder.status).bg, 
                  padding: '6px 12px', 
                  borderRadius: '50px' 
                }}>
                  {getStatusBadgeStyles(selectedOrder.status).label}
                </span>
              </div>

              {/* Purchase Details */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Summary</h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                    <span>{selectedOrder.product_id}</span>
                    <span>LKR {parseFloat(selectedOrder.total_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Quantity: {selectedOrder.quantity} units x LKR {parseFloat(selectedOrder.unit_price).toLocaleString()} each
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivery Method:</span>
                    <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>
                      {selectedOrder.delivery_type?.replace(/_/g, ' ') || 'Shop Pickup'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer & Shipping Info</h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                    <User size={16} style={{ color: primaryColor }} />
                    <span style={{ fontWeight: '600' }}>{selectedOrder.customer_name || 'Walk-in Customer'}</span>
                  </div>
                  {selectedOrder.customer_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <Phone size={16} style={{ color: primaryColor }} />
                      <span>{selectedOrder.customer_phone}</span>
                    </div>
                  )}
                  {selectedOrder.delivery_type === 'home_delivery' && (selectedOrder.address_line || selectedOrder.city) ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.9rem', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                      <MapPin size={16} style={{ color: primaryColor, marginTop: '2px' }} />
                      <div style={{ lineHeight: '1.4' }}>
                        <p style={{ margin: 0 }}>{selectedOrder.address_line}</p>
                        <p style={{ margin: 0 }}>{selectedOrder.city}{selectedOrder.zip_code ? `, ${selectedOrder.zip_code}` : ''}</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                      <MapPin size={16} />
                      <span>Customer selected physical Shop Pickup (No shipping address).</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyBetween: 'space-between', gap: '10px', justifyContent: 'flex-end' }}>
              
              {/* Context Actions inside details */}
              {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                <button 
                  onClick={() => { setRejectingOrder(selectedOrder); }}
                  disabled={isUpdating}
                  style={{ 
                    background: '#ffe4e6', border: 'none', color: '#e11d48', 
                    padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
                    fontWeight: '700', fontSize: '0.9rem'
                  }}
                >
                  Reject Order
                </button>
              )}

              {selectedOrder.status === 'confirmed' && (
                <button 
                  onClick={() => handleStatusUpdate(selectedOrder.id, 'completed')}
                  disabled={isUpdating}
                  style={{ 
                    background: '#dcfce7', border: 'none', color: '#16a34a', 
                    padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
                    fontWeight: '700', fontSize: '0.9rem'
                  }}
                >
                  Complete Order
                </button>
              )}

              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ 
                  background: '#e2e8f0', 
                  color: '#475569', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '10px', 
                  fontWeight: '700', 
                  cursor: 'pointer' 
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION WARNING DIALOG MODAL */}
      {rejectingOrder && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 4000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ 
                width: '56px', height: '56px', borderRadius: '50%', background: '#ffe4e6', 
                color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 1rem' 
              }}>
                <XCircle size={32} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Reject Order #{rejectingOrder.id}?</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>
                Are you sure you want to reject this order? This will mark the transaction as rejected and notify the customer. This action is permanent and cannot be undone.
              </p>
            </div>
            
            <div style={{ 
              padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
              display: 'flex', gap: '10px'
            }}>
              <button
                disabled={isUpdating}
                onClick={() => setRejectingOrder(null)}
                style={{ 
                  flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1',
                  background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleStatusUpdate(rejectingOrder.id, 'rejected')}
                style={{ 
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                  background: '#e11d48', color: 'white', fontWeight: '700', cursor: 'pointer',
                  fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Styles for responsive visibility */}
      <style>{`
        @media (min-width: 769px) {
          .mobile-orders-view { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-orders-view { display: none !important; }
        }
      `}</style>
    </div>
  );
}
