import React, { useState } from "react";
import { Link, Links, useNavigate } from "react-router-dom";
import { auth } from '../firebase.js';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { FacebookAuthProvider } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const [loading, setLoading] = useState(false); 

    const handlelogin = async (e) => {
        e.preventDefault();
        setLoading(true); 
        try {
            await signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    setLoading(false); 
                    // const loginsuccess = window.confirm("You Are Successfuly logged in..")
                    toast.success("Login successful!");
                    
                     setTimeout(() => {
                      navigate("/group");
                     }, 2000);
                    
                })
                .catch((err) => {
                    setLoading(false); 
                    toast.error(err.message);
                    console.log(err);
                });
            console.log(email, password);
        } catch (error) {
            setLoading(false); 
            toast.error(error.message);
            console.log(error.message);
        }
    };

    const handleGooglelogin = async (e) => {
        e.preventDefault();
        setLoading(true); 
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider)
                .then(() => {
                    setLoading(false);
                    toast.success("Google login successful!");
                 
                      navigate("/group");
                    
                })
                .catch((err) => {
                    setLoading(false); 
                    toast.error(err.message);
                    console.log(err);
                });
            console.log(email, password);
        } catch (error) {
            setLoading(false); 
            toast.error(error.message);
            console.log(error.message);
        }
    };

    // const handleFacebook = async (e) => {
    //     e.preventDefault();
    //     setLoading(true); 
    //     const provider = new FacebookAuthProvider();
    //     try {
    //         await signInWithPopup(auth, provider)
    //             .then(() => {
    //                 setLoading(false); 
    //                 toast.success("Facebook login successful!");
    //                 navigate("/group");
    //             })
    //             .catch((err) => {
    //                 setLoading(false); 
    //                 console.log(err);
    //             });
    //         console.log(email, password);
    //     } catch (error) {
    //         setLoading(false); 
    //         toast.error(error.message);
    //         console.log(error.message);
    //     }
    // };

    const clearInputFields = () => {
        setEmail("");
        setPassword("");
        setResetKey(prevKey => prevKey + 1);
    };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-black px-4">
    <div className="w-full max-w-md relative">
    
      <div className="bg-blue-900/30 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-blue-800/50 shadow-xl relative overflow-hidden">
      
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-blue-400/20 blur-2xl"></div>
  
        <div className="flex justify-center mb-4 relative">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-400/50 flex items-center justify-center bg-blue-800/30">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-t-2 border-r-2 border-blue-400 animate-spin"></div>
          </div>
        </div>
  
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl text-white font-semibold">Welcome back</h2>
          <p className="text-blue-200/80 text-sm mt-1">Please enter your details to sign in.</p>
        </div>
  
        <div>
            <form onSubmit={handlelogin}>
          <div className="mb-4 relative">
            <label className="text-blue-300 text-xs mb-1 block">Email</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="Enter Your Email"
              required
                autoComplete="off"
              value={email}
              key={`email-${resetKey}`}
                type="email"
                className="w-full bg-blue-800/30 text-blue-100 px-4 py-3 rounded-lg border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
            </div>
          </div>
  
          <div className="mb-6 relative">
      <label className="text-blue-300 text-xs mb-1 block">Password</label>
      <input
        type={showPassword ? "text" : "password"}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="off"
        placeholder="Enter Your Password"
        key={`password-${resetKey}`}
        required
        value={password}
        className="w-full bg-blue-800/30 text-blue-100 px-4 py-3 rounded-lg border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute top-9 right-4 text-blue-300 hover:text-blue-100"
      >
        {showPassword ? <Eye size={18} />  : <EyeOff size={18} />       }
      </button>
    </div>
  
          <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 hover:scale-[0.98] rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400">
            Sign In
          </button>
          </form>
  
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-blue-800"></div>
            <span className="px-3 text-blue-400 text-sm">OR</span>
            <div className="flex-grow h-px bg-blue-800"></div>
          </div>
  
          <button type="button" onClick={handleGooglelogin} className="w-full bg-blue-800/40 text-blue-100 py-3 px-4 rounded-lg mb-3 flex items-center transition duration-200 hover:bg-blue-700/40 border border-blue-700/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
            <div className="ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
  
          {/* <button onClick={handleFacebook} type="button" className="w-full bg-blue-800/40 text-blue-100 py-3 px-4 rounded-lg flex items-center transition duration-200 hover:bg-blue-700/40 border border-blue-700/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continue with Facebook
            <div className="ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button> */}
        </div>
      </div>
      <Link to={"/signup"}>
      <h1 className=" text-center pt-5 text-blue-300 opacity-80">If You are new user ? Please Register</h1></Link>
    </div>
  </div>
  
  );
};

export default Login;
