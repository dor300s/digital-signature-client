import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { CreatePdf } from './pages/CreatePdf';
import { EditPdf } from './pages/EditPdf';



export const App = () => {
  return (
    <div className="app-container">
      <div className="logo-container flex align-center">
        <div className="logo" >D-signature</div>
      </div>
      <Switch>
        <Route component={EditPdf} path="/:id" />
        <Route component={CreatePdf} path="/" />
      </Switch>
    </div>
  )
}
