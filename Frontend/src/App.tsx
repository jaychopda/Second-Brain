import { BrowserRouter, Route, Routes } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import { Signup } from "./pages/Signup"
import { SignIn } from "./pages/Signin"
import Brain from "./pages/Brain"


function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mybrain" element={<Brain />} />
          <Route path="/brain" element={<Brain />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<SignIn />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
