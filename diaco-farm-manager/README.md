# Diaco Farm Manager

A comprehensive web dashboard for monitoring, managing, and analyzing a farm of Klipper-based 3D printers using the Moonraker API.

![License](https://img.shields.io/badge/License-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)

## 🎯 Features

### Real-Time Printer Monitoring
- **Live Status Updates**: Monitor all printers with 2-second polling intervals
- **Temperature Monitoring**: Real-time nozzle and bed temperature display
- **Print Progress**: Live progress bars and completion percentages
- **Offline Detection**: Automatic detection of offline printers

### Printer Control
- **Direct Control**: Send commands directly to any printer
- **Homing Controls**: Home all axes or individual axes (X, Y, Z)
- **Temperature Presets**: Quick-set buttons for PLA, PETG, ABS, and cooldown
- **Emergency Stop**: Prominent emergency stop with confirmation
- **Live Z-Offset**: Adjust Z-offset during printing
- **Print Management**: Pause, resume, and cancel prints

### Farm Management
- **Drag & Drop Sorting**: Reorder printer cards with smooth animations
- **Printer Configuration**: Add, edit, and delete printers
- **Status Tracking**: Maintenance status (Healthy, Has Issue, Maintenance)
- **Import/Export**: JSON-based backup and restore
- **Mass Upload**: Upload G-code to multiple printers simultaneously

### Analytics Dashboard
- **Operational Status**: Pie chart showing printer states (printing, standby, offline)
- **Maintenance Status**: Distribution of printer health
- **Nozzle Size Distribution**: Bar chart of nozzle sizes
- **Printer List**: Sortable table with all printer details

### History Tracking
- **Job History**: Complete log of all print jobs
- **Statistics**: Total print time and filament used
- **Status Analysis**: Jobs by completion status (completed, cancelled, error)
- **Printer Analytics**: Time and job distribution per printer
- **Filtering**: Filter by printer, date range, and status
- **Sync**: Fetch job history from all printers

### Modern UI/UX
- **Glassmorphism Design**: Frosted glass effect with transparency
- **Animated Gradient**: Smooth, animated background gradient
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Fullscreen Mode**: Long-press any card for fullscreen view on mobile
- **Dark/Light Theme**: Toggle between themes
- **Smooth Animations**: Fluid transitions and loading states

## 🏗️ Architecture

```
diaco-farm-manager/
├── server/                    # Node.js + Express backend
│   ├── server.js             # Main server file
│   ├── data/                 # JSON file storage
│   │   ├── printers.json    # Printer configurations
│   │   └── history.log.json # Print job history
│   └── package.json
│
├── client/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Header.tsx
│   │   │   ├── PrinterCard.tsx
│   │   │   ├── PrinterGrid.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── HistoryDashboard.tsx
│   │   │   ├── AddEditPrinterModal.tsx
│   │   │   └── MassUploadModal.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   └── usePrinters.ts
│   │   ├── services/        # API services
│   │   │   └── api.ts
│   │   ├── types/           # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
└── README.md
```

## 📦 Installation

### Prerequisites

- Node.js 20+ and npm
- Klipper-based 3D printers with Moonraker API
- Network access to all printers

### Setup

1. **Clone or navigate to the project:**
   ```bash
   cd diaco-farm-manager
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```
   This installs dependencies for both server and client.

3. **Configure printers:**

   Edit `server/data/printers.json` (created automatically on first run) or use the web UI to add printers.

4. **Start development servers:**
   ```bash
   npm run dev
   ```
   This starts both the backend (port 3001) and frontend (port 5174) concurrently.

5. **Access the application:**
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:3001/api

## 🚀 Usage

### Adding Printers

1. Click the **Menu** button in the header
2. Select **"Add New Printer"**
3. Enter printer details:
   - Name (e.g., "Printer 1")
   - IP address (e.g., "192.168.1.100")
   - Maintenance status
   - Nozzle size
4. Click **"Add Printer"**

### Controlling Printers

Each printer card provides:

- **Temperature Controls**: Set target temperatures or use presets
- **Homing**: Home all axes or individual axes
- **Motors**: Disable stepper motors
- **Printing Controls**: Pause, resume, cancel prints
- **Z-Offset**: Fine-tune during printing
- **Emergency Stop**: Halt all operations immediately

### Monitoring Print Progress

When a printer is actively printing, the card displays:
- Filename
- Progress percentage
- Progress bar
- Current temperatures

### Using Analytics

Switch to the **Dashboard** view to see:
- Total printer count
- Currently printing
- Offline printers
- Operational status distribution
- Maintenance status distribution
- Nozzle size distribution
- Complete printer list

### Viewing History

Switch to the **History** view to:
1. **Sync History**: Click "Sync History" to fetch latest jobs from all printers
2. **Filter Data**: Select specific printers and date ranges
3. **View Charts**: See job status distribution and time per printer
4. **View Table**: Toggle to raw data table for detailed information

### Mass Upload

To upload a G-code file to multiple printers:

1. Click **Menu** → **"Upload G-code to Many"**
2. Select your G-code file
3. Check the printers you want to upload to
4. Click **"Upload to X Printers"**
5. View upload results

## 🔧 API Documentation

### Printer Endpoints

- `GET /api/printers` - Get all printers
- `POST /api/printers` - Add new printer
- `PUT /api/printers/:id` - Update printer
- `DELETE /api/printers/:id` - Delete printer
- `POST /api/printers/reorder` - Reorder printers
- `POST /api/printers/import` - Import printers from JSON

### History Endpoints

- `GET /api/history` - Get print history
- `POST /api/history/sync` - Sync history from all printers

### Moonraker Proxy Endpoints

- `GET /api/printer/:printerId/status` - Get printer status
- `POST /api/printer/:printerId/command` - Send G-code command
- `POST /api/printer/:printerId/upload` - Upload file to printer

### Health Check

- `GET /api/health` - Server health status

## 🎨 Customization

### Changing the Gradient

Edit the gradient in `client/index.html`:

```css
.animated-gradient {
  background: linear-gradient(-45deg, #0f172a, #1e293b, #1e3a8a, #26c6bc);
}
```

### Adjusting Poll Interval

In `client/src/hooks/usePrinters.ts`, change the interval (default: 2000ms):

```typescript
const interval = setInterval(() => {
  // Poll printer status
}, 2000); // Change this value
```

### Modifying Glassmorphism

Edit the glass styles in `client/index.html`:

```css
.glass-dark {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(10px);
}
```

## 🔐 Security Notes

- **Network Security**: This application is designed for local network use
- **No Authentication**: Current version has no built-in authentication
- **Direct Access**: All users have full control over all printers
- **Production Use**: Consider adding authentication and access controls for production

## 🐛 Troubleshooting

### Printers Show as Offline

1. Verify printer IP addresses are correct
2. Check that Moonraker is running on each printer
3. Ensure network connectivity between server and printers
4. Check firewall settings

### Upload Fails

1. Verify G-code file format
2. Check printer storage space
3. Ensure Moonraker API is accessible
4. Review browser console for errors

### Charts Not Displaying

1. Ensure recharts is installed: `cd client && npm install`
2. Check browser console for errors
3. Verify data is being fetched from the API

## 📝 Development

### Building for Production

```bash
# Build client
npm run build

# Start production server
cd server && node server.js
```

The server will automatically serve the built client files.

### Project Structure

- **Backend**: Simple Express server with file-based persistence
- **Frontend**: React with TypeScript, using Vite for development
- **State Management**: Custom hooks with React state
- **Styling**: Tailwind CSS (CDN) with custom animations
- **Charts**: Recharts for data visualization
- **Drag & Drop**: @dnd-kit for sortable printer grid

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Authentication and user management
- Database integration (PostgreSQL, MongoDB)
- WebSocket for real-time updates
- Camera feed integration
- Mobile app (React Native)
- Multi-language support
- Advanced analytics and reporting
- Printer grouping and tagging
- Scheduled prints
- Filament inventory management

## 📄 License

MIT License - feel free to use this project for personal or commercial use.

## 🙏 Acknowledgments

- **Klipper**: Advanced 3D printer firmware
- **Moonraker**: Klipper's web API
- **React**: UI library
- **Recharts**: Charting library
- **@dnd-kit**: Drag and drop library
- **Tailwind CSS**: Utility-first CSS framework

---

**Made with ❤️ for the 3D printing community**

For issues, questions, or feature requests, please open an issue on GitHub.
