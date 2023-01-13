import React from 'react';
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import './app.css';
import { Chat } from './chat';
import { Landing } from './landing';
import { Layout } from './layout';

function App() {
  const navigation = useNavigate();

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="chat" element={<Chat navigation={navigation} />} />

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
