import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ShopListing from './ShopListing';
import ShopView from './ShopView';
import CustomerAuth from './CustomerAuth';
import CustomerProfile from './CustomerProfile';
import CustomerOrders from './CustomerOrders';
import ShopOrders from './ShopOrders';
import CustomerCart from './CustomerCart';
import ShopCart from './ShopCart';
import NearbyVendors from './components/location/NearbyVendors';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<ShopListing />} />
          <Route path="/discover" element={<NearbyVendors />} />
          <Route path="/shop/:id" element={<ShopView />} />
          <Route path="/shop/:id/orders" element={<ShopOrders />} />
          <Route path="/auth" element={<CustomerAuth />} />
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/orders" element={<CustomerOrders />} />
          <Route path="/cart" element={<CustomerCart />} />
          <Route path="/shop/:id/cart" element={<ShopCart />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
