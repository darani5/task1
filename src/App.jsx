import { useState } from 'react'

import './App.css'
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import UsersPage from './UsersPage';


function App() {
  return (
    <div style={{ backgroundColor: '#e0f0ff', minHeight: '100vh', padding: 20 }}>
      <UsersPage />
    </div>
  );
}


export default App
