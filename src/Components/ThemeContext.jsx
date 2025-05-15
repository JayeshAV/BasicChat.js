import { createContext, useEffect, useState } from "react";



export const ThemeContext=createContext()

export const ThemeProvider=({children})=>{
           const [theme,setTheme]=useState(()=>{
             return localStorage.getItem("theme") || "light"
           })


useEffect(()=>{
    localStorage.setItem("theme",theme)
    document.documentElement.className=theme
},[theme])


const toggletheme=()=>{
    setTheme((prev)=>prev==="light"?"dark":"light")
}


return (
    <ThemeContext.Provider value={{theme,toggletheme}}>
        {children}  
    </ThemeContext.Provider>
)}