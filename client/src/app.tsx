import React, { ReactNode } from 'react';
import { Routes, Route, Link, useNavigate, RouteProps, Navigate, Outlet } from "react-router-dom";
import './app.css';
import { Chat } from './chat';
import { Landing } from './landing';
import { Layout } from './layout';
import { socketService } from './sockets';

interface Props {
  children?: JSX.Element
}

const ProtectedRoute = ({ children, ...props }: Props) => {
  if (!socketService) {
    console.warn('Redirecting due to socketService', socketService)
    return <Navigate to="/" replace />;
  }

  if (!socketService.ws) {
    console.warn('Redirecting due to socketService.ws', socketService.ws)
    return <Navigate to="/" replace />;
  }

  if (socketService.ws.readyState !== WebSocket.OPEN) {
    console.warn('Redirecting due to readyState', socketService.ws.readyState)
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

function App() {
  const navigation = useNavigate();

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing navigate={navigation}/>} />
          <Route
          path="chat"
          element={
            <ProtectedRoute>
              <Chat navigate={navigation} />
            </ProtectedRoute>
          }
        />

          {/* Using path="*"" means "match anything", so this route
                acts like a catch-all for URLs that we don't have explicit
                routes for. */}
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
      
    </div>
  );
}


function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}


export default App;
