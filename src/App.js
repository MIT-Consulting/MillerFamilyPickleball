import React, { useState, useEffect, createContext } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Sidebar from './components/Sidebar';
import PlayerList from './components/PlayerList';
import TeamList from './components/TeamList';
import Tournament from './components/Tournament';
import GameSchedule from './components/GameSchedule';
import './App.css';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { db } from './firebase-config';
import StarIcon from '@mui/icons-material/Star';
import BoltIcon from '@mui/icons-material/Bolt';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WavesIcon from '@mui/icons-material/Waves';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FlareIcon from '@mui/icons-material/Flare';
import FilterVintageIcon from '@mui/icons-material/FilterVintage';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CloudIcon from '@mui/icons-material/Cloud';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import AirIcon from '@mui/icons-material/Air';

const TEAM_COLORS = [
  '#7CB9E8', // bright blue
  '#F0B6D5', // bright pink
  '#98FB98', // pale green
  '#FFB347', // pastel orange
  '#87CEEB', // sky blue
  '#DDA0DD', // plum
  '#F4C430', // saffron
  '#FF69B4', // hot pink
  '#98FF98', // mint green
  '#E6E6FA', // lavender
  '#FFA07A', // light salmon
  '#9370DB', // medium purple
  '#40E0D0', // turquoise
  '#FFBF00', // amber
];

const TEAM_ICONS = [
  { icon: StarIcon, name: 'Star' },
  { icon: BoltIcon, name: 'Lightning' },
  { icon: RocketLaunchIcon, name: 'Rocket' },
  { icon: LocalFireDepartmentIcon, name: 'Fire' },
  { icon: WavesIcon, name: 'Waves' },
  { icon: AcUnitIcon, name: 'Snowflake' },
  { icon: WhatshotIcon, name: 'Flame' },
  { icon: AutoAwesomeIcon, name: 'Sparkle' },
  { icon: FlareIcon, name: 'Flare' },
  { icon: FilterVintageIcon, name: 'Flower' },
  { icon: PsychologyIcon, name: 'Mind' },
  { icon: CloudIcon, name: 'Cloud' },
  { icon: EmojiNatureIcon, name: 'Leaf' },
  { icon: AirIcon, name: 'Wind' }
];

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [mode, setMode] = useState('dark');

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#90caf9' : '#1976d2',
          },
          secondary: {
            main: mode === 'dark' ? '#f48fb1' : '#dc004e',
          },
          background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
      }),
    [mode],
  );

  // Load data when component mounts
  useEffect(() => {
    const playersRef = ref(db, 'players');
    const teamsRef = ref(db, 'teams');

    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      setPlayers(data ? Object.values(data) : []);
    });

    onValue(teamsRef, (snapshot) => {
      const data = snapshot.val();
      setTeams(data ? Object.values(data) : []);
    });
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleAddPlayer = (playerName, skillLevel, gender, family) => {
    const newPlayer = {
      id: Date.now(),
      name: playerName,
      skillLevel: skillLevel,
      gender: gender,
      family: family,
      rank: players.length + 1
    };
    set(ref(db, `players/${newPlayer.id}`), newPlayer);
  };

  const handleUpdatePlayer = (playerId, updates) => {
    const playerRef = ref(db, `players/${playerId}`);
    const playerToUpdate = players.find(p => p.id === playerId);
    set(playerRef, { ...playerToUpdate, ...updates });
  };

  const handleDeletePlayer = (playerId) => {
    remove(ref(db, `players/${playerId}`));
    // Update team if player was assigned
    const playerToDelete = players.find(p => p.id === playerId);
    if (playerToDelete?.teamId) {
      const team = teams.find(t => t.id === playerToDelete.teamId);
      if (team) {
        const updatedPlayerIds = team.playerIds.filter(id => id !== playerId);
        set(ref(db, `teams/${team.id}/playerIds`), updatedPlayerIds);
      }
    }
  };

  const handleMovePlayer = (playerId, direction) => {
    const sortedPlayers = [...players].sort((a, b) => a.rank - b.rank);
    const currentIndex = sortedPlayers.findIndex(p => p.id === playerId);
    const newIndex = currentIndex + direction;

    if (newIndex < 0 || newIndex >= sortedPlayers.length) {
      return;
    }

    // Swap ranks between the two players
    const player1 = sortedPlayers[currentIndex];
    const player2 = sortedPlayers[newIndex];
    const tempRank = player1.rank;
    player1.rank = player2.rank;
    player2.rank = tempRank;

    // Update both players in Firebase
    set(ref(db, `players/${player1.id}`), player1);
    set(ref(db, `players/${player2.id}`), player2);
  };

  const getNextTeamColor = () => {
    const usedColors = new Set(teams.map(team => team.color));
    return TEAM_COLORS.find(color => !usedColors.has(color)) || TEAM_COLORS[0];
  };

  const getNextTeamIcon = () => {
    const usedIcons = new Set(teams.map(team => team.iconName));
    return TEAM_ICONS.find(icon => !usedIcons.has(icon.name)) || TEAM_ICONS[0];
  };

  const handleRandomizeTeams = () => {
    // Create arrays of unused colors and icons
    const availableColors = [...TEAM_COLORS];
    const availableIcons = [...TEAM_ICONS];

    // Shuffle both arrays
    for (let i = availableColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableColors[i], availableColors[j]] = [availableColors[j], availableColors[i]];
    }
    for (let i = availableIcons.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableIcons[i], availableIcons[j]] = [availableIcons[j], availableIcons[i]];
    }

    // Update each team with new random color and icon
    teams.forEach((team, index) => {
      const color = availableColors[index % availableColors.length];
      const icon = availableIcons[index % availableIcons.length];
      set(ref(db, `teams/${team.id}`), {
        ...team,
        color,
        iconName: icon.name
      });
    });
  };

  const handleAddTeam = (teamName) => {
    try {
      // Sort teams to get the highest rank
      const maxRank = teams.reduce((max, team) => Math.max(max, team.rank || 0), 0);
      
      const newTeam = {
        id: Date.now(),
        name: teamName,
        color: getRandomColor(),
        iconName: TEAM_ICONS[Math.floor(Math.random() * TEAM_ICONS.length)].name,
        playerIds: [],
        createdAt: new Date().toISOString(),
        rank: maxRank + 1  // Set rank to one more than the highest existing rank
      };
      
      set(ref(db, `teams/${newTeam.id}`), newTeam);
    } catch (error) {
      console.error('Error adding team:', error);
    }
  };

  const handleUpdateTeam = (teamId, updates) => {
    const teamRef = ref(db, `teams/${teamId}`);
    const teamToUpdate = teams.find(t => t.id === teamId);
    set(teamRef, { ...teamToUpdate, ...updates });
  };

  const handleDeleteTeam = (teamId) => {
    // Remove team and unassign its players
    const team = teams.find(t => t.id === teamId);
    if (team) {
      // Update all players that were in this team
      team.playerIds?.forEach(playerId => {
        const playerRef = ref(db, `players/${playerId}`);
        const player = players.find(p => p.id === playerId);
        if (player) {
          set(playerRef, { ...player, teamId: null });
        }
      });

      // Remove the team from Firebase
      remove(ref(db, `teams/${teamId}`));
    }
  };

  const handleAssignPlayer = (playerId, teamId) => {
    // Remove player from previous team if any
    const previousTeam = teams.find(team => team.playerIds?.includes(playerId));
    if (previousTeam) {
      const updatedPlayerIds = previousTeam.playerIds?.filter(id => id !== playerId) || [];
      set(ref(db, `teams/${previousTeam.id}/playerIds`), updatedPlayerIds);
    }

    // Add player to new team
    if (teamId) {
      const team = teams.find(t => t.id === teamId);
      const updatedPlayerIds = [...(team.playerIds || []), playerId];
      set(ref(db, `teams/${teamId}/playerIds`), updatedPlayerIds);
    }

    // Update player's teamId
    const playerRef = ref(db, `players/${playerId}`);
    const playerToUpdate = players.find(p => p.id === playerId);
    set(playerRef, { ...playerToUpdate, teamId });
  };

  const isTeamFull = (team) => {
    if (!team || !team.playerIds) return false;
    return (team.playerIds || []).length >= 2;
  };

  const getTeamCapacityText = (team) => {
    return `${(team.playerIds || []).length}/2`;
  };

  const getRandomColor = () => {
    const unusedColors = TEAM_COLORS.filter(color => 
      !teams.some(team => team.color === color)
    );
    
    if (unusedColors.length > 0) {
      // Use an unused color if available
      return unusedColors[Math.floor(Math.random() * unusedColors.length)];
    } else {
      // If all colors are used, pick a random one from the full list
      return TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)];
    }
  };

  const handleMoveTeam = (teamId, direction) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    // Sort teams by existing rank or array index if rank is undefined
    const sortedTeams = [...teams].sort((a, b) => {
      const aRank = a.rank ?? teams.findIndex(t => t.id === a.id) + 1;
      const bRank = b.rank ?? teams.findIndex(t => t.id === b.id) + 1;
      return aRank - bRank;
    });

    // Get current index in sorted array
    const currentIndex = sortedTeams.findIndex(t => t.id === teamId);
    const targetIndex = currentIndex + direction;

    // Validate target index
    if (targetIndex < 0 || targetIndex >= sortedTeams.length) return;

    // Update ranks for all teams to ensure consistency
    const updates = {};
    sortedTeams.forEach((t, i) => {
      if (i === currentIndex) {
        updates[`teams/${t.id}/rank`] = targetIndex + 1;
      } else if (i === targetIndex) {
        updates[`teams/${t.id}/rank`] = currentIndex + 1;
      } else {
        updates[`teams/${t.id}/rank`] = i + 1;
      }
    });

    // Update all ranks in a single operation
    update(ref(db), updates);
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      <Router>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Sidebar
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 3,
                bgcolor: 'background.default',
                height: '100vh',
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Routes>
                <Route path="/teams" element={
                  <TeamList
                    teams={teams}
                    players={players}
                    onUpdateTeam={handleUpdateTeam}
                    onDeleteTeam={handleDeleteTeam}
                    onAssignPlayer={handleAssignPlayer}
                    onRandomizeTeams={handleRandomizeTeams}
                    onUpdatePlayer={handleUpdatePlayer}
                    onAddTeam={handleAddTeam}
                    onMoveTeam={handleMoveTeam}
                  />
                } />
                <Route path="/players" element={
                  <PlayerList
                    players={players}
                    teams={teams}
                    onUpdatePlayer={handleUpdatePlayer}
                    onDeletePlayer={handleDeletePlayer}
                    onMovePlayer={handleMovePlayer}
                    onAssignPlayer={handleAssignPlayer}
                    onAddPlayer={handleAddPlayer}
                  />
                } />
                <Route path="/tournament" element={<Tournament />} />
                <Route path="/schedule" element={<GameSchedule />} />
                <Route path="/" element={<Navigate to="/teams" replace />} />
              </Routes>
            </Box>
          </Box>
        </ThemeProvider>
      </Router>
    </ColorModeContext.Provider>
  );
}

export default App; 