import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ShopListing from './ShopListing';
import ShopView from './ShopView';
import CustomerAuth from './CustomerAuth';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<ShopListing />} />
          <Route path="/shop/:id" element={<ShopView />} />
          <Route path="/auth" element={<CustomerAuth />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
