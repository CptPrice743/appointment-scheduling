const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const appointmentRouter = require('./routes/appoinments');
app.use('/api/appointments', appointmentRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
