// Server entry: loads environment variables and starts the Express app
require('dotenv').config()
const app = require('./src/app')

// Start listening on port 3000 for local development
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000')
})
