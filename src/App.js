import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { CreatePdf } from './pages/CreatePdf';
import { EditPdf } from './pages/EditPdf';



export const App = () => {
  return (
    <div className="app-container">
      <div className="logo-container flex align-center">
        <div className="logo" />
      </div>
      <Switch>
        <Route component={EditPdf} path="/preview/:id" />
        <Route component={CreatePdf} path="/" />
      </Switch>
    </div>
  )
}

// TODOS:
// Remove old files from DB
// Start preview zoomed out