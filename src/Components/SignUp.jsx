import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { Eye, EyeOff, Vault } from "lucide-react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const SignUp = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [users,setUsers]=useState([])

    const navigate=useNavigate()

    useEffect(() => {
        const fetchUsers = async () => {
          try {
            const userSnapshot = await getDocs(collection(db, "users"));
            const userList = [];
            userSnapshot.forEach((doc) => {
              userList.push({ id: doc.id, ...doc.data() });
            });
            setUsers(userList);
          } catch (error) {
            console.error("Error fetching users:", error);
          }
        };
        fetchUsers();
      }, []);
    

    

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
    },

    validationSchema: Yup.object({
      email: Yup.string()
        .required("email is reuired !")
        .email("invalid email !"),
      password: Yup.string()
        .required("password is required !")
        .min(6, "minimum 6 characters reuired"),    
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], "password must match")
        .required("confirm your password"),
      displayName: Yup.string().required("display name is required "),
    }),
    
    
    onSubmit: async(values,{resetForm}) => {
      
        const matchedmail = users.find((e)=>e.email===values.email)
        if(matchedmail) {
            alert("user already exist !")
        }

      try {

        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        console.log("✅ Logged in user:", user);
        

        const docref=await addDoc(collection(db,"users"),{
           
            email:values.email,
            password:values.password,
            confirmPassword:values.confirmPassword,
            displayName:values.displayName,
            createdAt:new Date(),
            uid:user.uid             
        })
        console.log("document writte id:",docref.id)
      
        toast.success("User Logged in")

        setTimeout(() => {
            navigate("/group");
          }, 1000);

        resetForm()

      } catch (error) { 
        console.error("error adding document:",error)
        toast.error("log in error")
      }
     
      

    },
  });

  const { handleChange, handleBlur, handleReset, handleSubmit, values ,errors ,touched} =
    formik;

  return (
    <>
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
              <h2 className="text-xl sm:text-2xl text-white font-semibold">
                Welcome
              </h2>
              <p className="text-blue-200/80 text-sm mt-1">
                Create a new account.
              </p>
            </div>

            <div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4 relative">
                  <label className="text-blue-300 text-xs mb-1 block">
                    Email
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      placeholder="Enter Your Email"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="email"
                      value={values.email}
                    //   value={values.email}
                      //   key={`email-${resetKey}`}
                      type="email"
                      className="w-full bg-blue-800/30 text-blue-100 px-4 py-3 rounded-lg border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                  </div>
                  {touched.email && errors.email && (<h1 className="text-red-500 mt-1 ps-2">{errors.email}</h1>)}
                </div>

                <div className="mb-6 relative">
                  <label className="text-blue-300 text-xs mb-1 block">
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    placeholder="Enter Your Password"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    // key={`password-${resetKey}`}
                    name="password"
                    
                    value={values.password}
                    className="w-full bg-blue-800/30 text-blue-100 px-4 py-3 rounded-lg border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  {touched.password && errors.password && (<h1 className="text-red-500 mt-1 ps-2">{errors.password}</h1>)}
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute top-9 right-4 text-blue-300 hover:text-blue-100"
                  >
                    {showPassword ? <Eye size={18} />  : <EyeOff size={18} />       }
                  </button>
                </div>
                <div className="mb-6 relative">
                  <label className="text-blue-300 text-xs mb-1 block">
                    Confirm Password
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="off"
                    placeholder="Enter Your Confirm Password"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    name="confirmPassword"
                    // key={`password-${resetKey}`}
                    
                    value={values.confirmPassword}
                    className="w-full bg-blue-800/30 text-blue-100 px-4 py-3 rounded-lg border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute top-9 right-4 text-blue-300 hover:text-blue-100"
                  >
                    {showConfirmPassword ? <Eye size={18} />  : <EyeOff size={18} />       }
                  </button>
                  {touched.confirmPassword && errors.confirmPassword && (<h1 className="text-red-500 mt-1 ps-2">{errors.confirmPassword}</h1>)}
                </div>
                <div className="mb-6 relative">
                  <label className="text-blue-300 text-xs mb-1 block">
                    Display Name
                  </label>
                  <input
                    // type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    placeholder="Enter Your Display Name"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    name="displayName"
                    // key={`password-${resetKey}`}
                    
                    value={values.displayName}
                    className="w-full bg-blue-800/30 text-blue-100 px-4 py-3 rounded-lg border border-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <button
                    type="button"
                    // onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute top-9 right-4 text-blue-300 hover:text-blue-100"
                  >
                    {/* {showPassword ? <Eye size={18} />  : <EyeOff size={18} />       } */}
                  </button>
                  {touched.displayName && errors.displayName && (<h1 className="text-red-500 mt-1 ps-2">{errors.displayName}</h1>)}
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 hover:scale-[0.98] rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Sign Up
                </button>
              </form>

              <div className="flex items-center my-6">
                <div className="flex-grow h-px bg-blue-800"></div>
                <span className="px-3 text-blue-400 text-sm">OR</span>
                <div className="flex-grow h-px bg-blue-800"></div>
              </div>
 
               <Link to={"/"}>  <h1 className="text-center text-blue-100">Already Have an Account ? Log in</h1> </Link>

              {/* <button type="button" onClick={handleGooglelogin} className="w-full bg-blue-800/40 text-blue-100 py-3 px-4 rounded-lg mb-3 flex items-center transition duration-200 hover:bg-blue-700/40 border border-blue-700/30">
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
          </button> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;
