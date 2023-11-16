import style from '../styles/App.module.css';
import { ReactP5Wrapper } from "react-p5-wrapper";
import sketch from "./sketch"
import { useState } from 'react';

function App() {
  const [lives, setLives] = useState([3]);

  return (
    <div> 
      <ReactP5Wrapper sketch={sketch}/>
    </div>
  );
}

export default App;
