import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import EventFeed from './EventFeed';
import { Activity, BarChart2 } from 'lucide-react';
import KPISection from './analytics/KPISection';
import ViewsChart from './analytics/ViewsChart';
import OrdersChart from './analytics/OrdersChart';
import TopProducts from './analytics/TopProducts';
const SOCKET_SERVER_URL = 'http://localhost:5003';

const LiveDashboard = ({ vendorId }) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({ totalViews: 0, totalOrders: 0, arOpens: 0, recommendationClicks: 0 });
  const [events, setEvents] = useState([]);
  const [viewsData, setViewsData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  
  const eventsRef = useRef(events);
  const statsRef = useRef(stats);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    eventsRef.current = events;
    statsRef.current = stats;
  }, [events, stats]);

  useEffect(() => {
    const suffix = vendorId ? `?vendor_id=${vendorId}` : '';

    // 1. Initial Fetch for REST data
    const fetchInitialData = async () => {
      try {
        const [kpiRes, viewsRes, ordersRes, productsRes, eventsRes] = await Promise.all([
          fetch(`${SOCKET_SERVER_URL}/analytics/kpis${suffix}`).then(res => res.json()),
          fetch(`${SOCKET_SERVER_URL}/analytics/charts/views${suffix}`).then(res => res.json()),
          fetch(`${SOCKET_SERVER_URL}/analytics/charts/orders${suffix}`).then(res => res.json()),
          fetch(`${SOCKET_SERVER_URL}/analytics/top-products${suffix}`).then(res => res.json()),
          fetch(`${SOCKET_SERVER_URL}/analytics/recent-events${suffix}`).then(res => res.json())
        ]);

        if (kpiRes.success) setStats(kpiRes.data);
        if (viewsRes.success) setViewsData(viewsRes.data);
        if (ordersRes.success) setOrdersData(ordersRes.data);
        if (productsRes.success) setTopProducts(productsRes.data);
        if (eventsRes.success) setEvents(eventsRes.data);
      } catch (error) {
        console.error('Failed to fetch initial analytics data:', error);
      }
    };
    
    fetchInitialData();

    // 2. Setup WebSockets
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      if (vendorId) {
        socket.emit('join_vendor_room', vendorId);
      }
    });
    socket.on('disconnect', () => setIsConnected(false));

    // 3. Listen for live events
    const eventChannel = vendorId ? 'vendor_event' : 'live_event';
    socket.on(eventChannel, (eventPayload) => {
      
      // Update KPIs
      setStats((prev) => ({
        totalViews: prev.totalViews + (eventPayload.event_type === 'product_view' ? 1 : 0),
        totalOrders: prev.totalOrders + (eventPayload.event_type === 'order_created' ? 1 : 0),
        arOpens: prev.arOpens + (eventPayload.event_type === 'ar_opened' ? 1 : 0),
        recommendationClicks: prev.recommendationClicks + (eventPayload.event_type === 'recommendation_clicked' ? 1 : 0),
      }));

      // Add to beginning of event feed
      setEvents((prevEvents) => [eventPayload, ...prevEvents].slice(0, 50));
      
      // Incrementally update chart data state based on time buckets
      const now = new Date();
      const currentHour = `${String(now.getHours()).padStart(2, '0')}:00`;

      setViewsData((prev) => {
        const newData = [...prev];
        const last = newData.length > 0 ? newData[newData.length - 1] : null;
        const isView = eventPayload.event_type === 'product_view' ? 1 : 0;
        const isAr = eventPayload.event_type === 'ar_opened' ? 1 : 0;
        
        if (last && last.time === currentHour) {
          newData[newData.length - 1] = {
            ...last,
            views: Number(last.views) + isView,
            ar_opens: Number(last.ar_opens) + isAr
          };
        } else if (isView || isAr) {
          newData.push({ time: currentHour, views: isView, ar_opens: isAr });
        }
        return newData;
      });

      setOrdersData((prev) => {
        const newData = [...prev];
        const last = newData.length > 0 ? newData[newData.length - 1] : null;
        const isOrder = eventPayload.event_type === 'order_created' ? 1 : 0;
        
        if (last && last.time === currentHour) {
          newData[newData.length - 1] = {
            ...last,
            orders: Number(last.orders) + isOrder
          };
        } else if (isOrder) {
          newData.push({ time: currentHour, orders: 1 });
        }
        return newData;
      });

      setTopProducts((prev) => {
        if (!eventPayload.product_id) return prev;
        const newData = [...prev];
        const existingIndex = newData.findIndex(p => p.name === eventPayload.product_id);
        const isView = eventPayload.event_type === 'product_view' ? 1 : 0;
        const isOrder = eventPayload.event_type === 'order_created' ? 1 : 0;
        
        if (existingIndex >= 0) {
          newData[existingIndex] = {
            ...newData[existingIndex],
            views: Number(newData[existingIndex].views) + isView,
            orders: Number(newData[existingIndex].orders) + isOrder
          };
        } else {
          newData.push({ 
            name: eventPayload.product_id, 
            views: isView,
            orders: isOrder
          });
        }
        return newData.sort((a, b) => b.views - a.views).slice(0, 5);
      });
    });

    return () => socket.disconnect();
  }, []);

  const containerStyle = vendorId 
    ? { background: '#0f172a', borderRadius: '24px', padding: isMobile ? '1.25rem' : '2rem', border: '1px solid #1e293b', color: 'white' }
    : { minHeight: '100vh', background: '#0f172a', color: 'white', padding: isMobile ? '1.25rem' : '2rem' };

  return (
    <div style={containerStyle} className="font-sans">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '900', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 className="text-brand-DEFAULT" style={{ color: '#6366f1' }} />
              Live Operations Analytics
            </h2>
            <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Real-time telemetry powered by Redis Streams & PostgreSQL</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Stream Status:</span>
            <div style={{
              background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isConnected ? '#10b981' : '#ef4444',
              padding: '4px 12px',
              borderRadius: '50px',
              fontSize: '0.75rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isConnected ? '#10b981' : '#ef4444',
                animation: isConnected ? 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'
              }} />
              {isConnected ? 'ONLINE' : 'RECONNECTING'}
            </div>
          </div>
        </div>

        {/* Top Level KPIs */}
        <KPISection data={stats} />

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ height: '350px' }}>
              <ViewsChart data={viewsData} />
            </div>
            <div style={{ height: '350px' }}>
              <OrdersChart data={ordersData} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ height: '400px' }}>
              <TopProducts products={topProducts} />
            </div>
            <div style={{ flex: 1, minHeight: '300px' }}>
              <EventFeed events={events} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LiveDashboard;
