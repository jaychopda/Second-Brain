import { BrowserRouter, Route, Routes } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import { Signup } from "./pages/Signup"
import { SignIn } from "./pages/Signin"
import Brain from "./pages/Brain"
import TweetInfo from "./pages/TweetInfo"
import OthersBrain from "./pages/OthersBrain"
import GoogleCallback from "./pages/GoogleCallback"
import Profile from "./pages/Profile"
import VoiceTest from "./pages/VoiceTest"


function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mybrain" element={<Brain />} />
          <Route path="/brain" element={<Brain />} />
          <Route path="/others-brain" element={<OthersBrain />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/tweet/info/:id" element={<TweetInfo />} />
          <Route path="/oauth/google/callback" element={<GoogleCallback />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/voice-test" element={<VoiceTest />} />
          {/* <Route path="/testing" element={<Testing />} /> */}
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
