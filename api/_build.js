// Serverless build function for Vercel
export default function handler(req, res) {
  res.status(200).json({
    message: 'Build API is running',
    buildTime: new Date().toISOString()
  });
}