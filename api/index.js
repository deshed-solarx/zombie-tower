// Main API handler for Vercel
export default function handler(req, res) {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
}