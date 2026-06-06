import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import EventFeed from './EventFeed';
import { Activity, BarChart2 } from 'lucide-react';
import KPISection from './analytics/KPISection';
import ViewsChart from './analytics/ViewsChart';
import OrdersChart from './analytics/OrdersChart';
import TopProducts from './analytics/TopProducts';

const SOCKET_SERVER_URL = 'http://localhost:5003';

const LiveDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({ totalViews: 0, totalOrders: 0, arOpens: 0, recommendationClicks: 0 });
  const [events, setEvents] = useState([]);
  const [viewsData, setViewsData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  
  const eventsRef = useRef(events);
  const statsRef = useRef(stats);

  useEffect(() => {
    eventsRef.current = events;
    statsRef.current = stats;
  }, [events, stats]);

  useEffect(() => {
    // 1. Initial Fetch for REST data
    const fetchInitialData = async () => {
      try {
        const [kpiRes, viewsRes, ordersRes, productsRes, eventsRes] = await Promise.all([
          fetch(`${SOCKET_SERVER_URL}/analytics/kpis`).then(res => res.json()),
          fetch(`${SOCKET_SERVER_URL}/analytics/charts/views`).then(res => res.json()),
          fetch(`${SOCKET_SERVER_URL}/analytics/charts/orders`).then(res => res.json()),
          fetch(`${SOCKET_SERVER_URL}/analytics/top-products`).then(res => res.json()),
          fetch(`${SOCKET_SERVER_URL}/analytics/recent-events`).then(res => res.json())
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

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // 3. Listen for live events
    socket.on('live_event', (eventPayload) => {
      
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

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-DEFAULT to-brand-dark bg-clip-text text-transparent flex items-center gap-3">
              <BarChart2 className="text-brand-DEFAULT" />
              Advanced Analytics Hub
            </h1>
            <p className="text-slate-400 mt-1">Real-time charts powered by Recharts & PostgreSQL Aggregation</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">Socket.io:</span>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} flex items-center gap-2 transition-colors`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {isConnected ? 'LIVE' : 'RECONNECTING'}
            </div>
          </div>
        </div>

        {/* Top Level KPIs */}
        <KPISection data={stats} />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="h-[350px]">
              <ViewsChart data={viewsData} />
            </div>
            <div className="h-[350px]">
              <OrdersChart data={ordersData} />
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="h-[400px]">
              <TopProducts products={topProducts} />
            </div>
            <div className="flex-1">
              <EventFeed events={events} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LiveDashboard;
