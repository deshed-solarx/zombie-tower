// API route to handle API requests and redirect to the game

export default function handler(req, res) {
  // No redirects needed, just report status
  res.status(200).json({
    status: 'success',
    message: 'Game API endpoint',
    isVercel: true,
    serverTime: new Date().toISOString()
  });
}