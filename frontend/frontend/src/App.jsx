import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Home from "./components/Home.jsx"
import Login from "./components/Login.jsx"
import Register from "./components/Register.jsx"
import {BrowserRouter, Routes, Route} from "react-router-dom"
function App() {

  return (
    
    <BrowserRouter>
      <Routes>

      <Route path="/" element = {
        
          <Home/>   
            
      }/>

      <Route path="/login" element = {
        
        <Login/>   
          
      }/>
      <Route path="/register" element = {
        
        <Register/>   
          
      }/>

      </Routes>
    </BrowserRouter>
  )
}

export default App
