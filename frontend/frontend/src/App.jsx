import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Home from "./components/Home.jsx"
import Login from "./components/Login.jsx"
import Register from "./components/Register.jsx"
import {BrowserRouter, Routes, Route} from "react-router-dom"
import NavBar from "./components/NavBar.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import LogPage from "./components/LogPage.jsx"

function App() {

  return (
    
    <BrowserRouter>
      <Routes>

      <Route path="/" element = {
        <ProtectedRoute>
          <NavBar>
            <Home/>  
          </NavBar> 
        </ProtectedRoute>
            
      }/>

      <Route path="/login" element = {
        
        <Login/>   
          
      }/>
      <Route path="/register" element = {
        
        <Register/>   
          
      }/>

      <Route path="/log/:date" element = {
        <NavBar>
          <LogPage/>   
        </NavBar>
      }/>


      </Routes>
    </BrowserRouter>
  )
}

export default App
