# Zombie Tower Defense

A dynamic 2D tower defense web game featuring strategic zombie combat with serverless deployment and advanced game mechanics.

## Features

- TypeScript for robust game logic
- React for responsive frontend
- Vercel serverless deployment
- Canvas-based rendering with advanced visual effects
- Sophisticated zombie spawning and behavior systems
- Performance-optimized game state management
- Player progression with permanent upgrades
- Global leaderboard using Notion integration

## Development Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL database (or use the Neon serverless Postgres)
- Notion account (for leaderboard functionality)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/zombie-tower-defense.git
   cd zombie-tower-defense
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example`:
   ```
   cp .env.example .env
   ```

4. Set up your database connection in the `.env` file:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

5. Set up Notion integration for the leaderboard:
   - Go to https://www.notion.so/my-integrations
   - Create a new integration with a name like "Zombie Tower Defense"
   - Copy the "Internal Integration Secret" to your `.env` file
   - Create a new page in Notion or use an existing one
   - Share this page with your integration (click "..." in the top right of the page, then "Add connections", find your integration)
   - Copy the page URL to your `.env` file

6. Run the Notion setup script:
   ```
   node setup-notion.js
   ```

7. Start the development server:
   ```
   npm run dev
   ```

## Deployment on Vercel

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Add the following environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NOTION_INTEGRATION_SECRET`: Your Notion integration secret
   - `NOTION_PAGE_URL`: Your Notion page URL
4. Deploy the project

## Game Controls

- Use WASD or arrow keys to move
- Click to shoot
- Space to use special ability (if available)
- ESC to pause the game

## Permanent Upgrades

Players can spend coins earned in the game to purchase permanent upgrades:

- Max Health: Increases player's maximum health
- Base Damage: Increases weapon damage
- Movement Speed: Increases player's movement speed
- Skip Waves: Start the game at a higher wave

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.