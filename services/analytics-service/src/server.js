const express = require('express');
const cors = require('cors');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { sendError } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// --- ROUTES ---
// Gateway forwards /stats directly. 
// We'll map it to the root of analyticsRoutes.
app.use('/', analyticsRoutes);

// --- GLOBAL ERROR HANDLING ---
app.use((err, req, res, next) => {
    console.error('ANALYTICS FAILURE:', err);
    sendError(res, 'Unexpected analytics engine failure', 500);
});

app.listen(PORT, () => {
    console.log(`🚀 Analytics Service live at http://localhost:${PORT}`);
});
