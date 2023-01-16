import React from 'react';
import { Outlet } from "react-router-dom";
import Box from '@mui/material/Box';
import { Link } from '@mui/material';
import {Link as LinkRR} from 'react-router-dom';
import { socketService } from './sockets';

export function Layout() {
  return (
    <div>
      {/* A "layout route" is a good place to put markup you want to
                share across all the pages on your site, like navigation. */}

      <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
        <Link component={LinkRR} to="/" sx={{minWidth : 100 }}>Home</Link>
        {socketService.ws !== null && <Link component={LinkRR}  to="/chat" sx={{minWidth : 100 }}>Chat</Link>}
        {socketService.ws !== null && <Link href="#" onClick={(e) => {socketService.disconnect(); e.preventDefault()}} sx={{flexGrow : 1, textAlign: 'right', marginRight: '1em' }}>Disconnect</Link>}
      </Box>

      <hr />


      <Outlet />
    </div>
  );
}
