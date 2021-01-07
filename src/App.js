import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { CreatePdf } from './pages/CreatePdf';
import { EditPdf } from './pages/EditPdf';



export const App = () => {
  return (
    <div className="app-container">
      <Switch>
        <Route component={EditPdf} path="/:id" />
        <Route component={CreatePdf} path="/" />
      </Switch>
    </div>
  )
}
